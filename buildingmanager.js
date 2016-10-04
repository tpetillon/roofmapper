'use strict';

var dbPool = require('./dbpool');

var maxBuildingsPerSession = 1000;

function BuildingManager() {
}

BuildingManager.prototype.getUntaggedBuilding = function(session, callback) {
    session.setLastUpdate();
    
    if (session.allocatedBuildingCount >= maxBuildingsPerSession) {
        callback(401, {
            error: 'cannot have more than ' + maxBuildingsPerSession +
                ' buildings simultaneously allocated to a session'
        });
        return;
    }

    dbPool.connect(function(err, client, done) {
        if (err) {
            callback(503, { error: 'error fetching client from pool: ' + err });
            return;
        }

        var query =
            'UPDATE buildings b \
            SET session_id=$1::integer \
            FROM ( \
                SELECT id \
                FROM buildings \
                WHERE session_id IS NULL \
                LIMIT 1 \
                FOR UPDATE \
            ) sub \
            WHERE b.id = sub.id \
            RETURNING b.id, type, osm_id, version';
        
        client.query(query, [ session.id ], function(err, result) {
            done();

            if (err) {
                callback(500, { error: 'error running query: ' + err });
                return;
            }
            
            if (result.rowCount === 0) {
                callback(404, { error: "no more buildings in database" });
                return;
            }

            var row = result.rows[0];
            var building = {
                type: row.type,
                id: row.osm_id,
                version: row.version
            };

            session.allocatedBuildingCount++;

            callback(200, building);
        });
    });
};

BuildingManager.prototype.releaseBuilding = function(session, buildingType, buildingId, callback) {
    session.setLastUpdate();

    dbPool.connect(function(err, client, done) {
        if (err) {
            callback(503, { error: 'error fetching client from pool: ' + err });
            return;
        }

        var query =
            'UPDATE buildings SET session_id = NULL \
            WHERE session_id = $1::integer AND type = $2 AND osm_id = $3::integer';
        client.query(query, [ session.id, buildingType, buildingId ], function(err, result) {
            done();

            if (err) {
                callback(500, { error: 'error running query: ' + err });
                return;
            }
            
            if (result.rowCount === 0) {
                callback(404, {
                    error: "building " + buildingType + "/" + buildingId + " is not allocated to session " + session.token
                });
                return;
            }

            session.allocatedBuildingCount--;

            callback(200, {});
        });
    });
};

BuildingManager.prototype.tagBuildings = function(tagData, changesetId, session, callback) {
    session.setLastUpdate();

    dbPool.connect(function(err, client, done) {
        if (err) {
            callback(503, { message: 'error fetching client from pool: ' + err });
            return;
        }
        
        var ids = [];
        var types = [];
        var roofMaterials = [];
        var changesetIds = [];
        
        for (var i = 0; i < tagData.length; i++) {
            var t = tagData[i];
            ids.push(t.id);
            types.push(t.type);
            roofMaterials.push(t.roof_material);
            changesetIds.push(changesetId);
        }

        var query =
            "UPDATE buildings AS b \
            SET \
                roof_material = v.roof_material, \
                changeset_id = v.changeset_id \
            FROM unnest($1::integer[], $2::building_type[], $3::varchar[], $4::integer[]) AS v (id, type, roof_material, changeset_id) \
            WHERE b.osm_id = v.id AND b.type = v.type::building_type AND b.session_id = $5::integer";
        
        client.query(query, [ ids, types, roofMaterials, changesetIds, session.id ], function(err, result) {
            done();

            if (err) {
                callback(500, { message: 'error running query: ' + err });
                return;
            }

            session.allocatedBuildingCount -= result.rowCount;

            callback(200, { message: result.rowCount + ' buildings tagged' });
        });
    });
};

var buildingManager = new BuildingManager();

module.exports = buildingManager;
