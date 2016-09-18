'use strict';

var dbPool = require('./dbpool');

var maxBuildingsPerSession = 1000;

function BuildingManager() {
}

BuildingManager.prototype.getUntaggedBuilding = function(session, callback) {
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
                buildingType: row.type,
                id: row.osm_id,
                version: row.version
            };

            session.allocatedBuildingCount++;

            callback(200, building);
        });
    });
};

BuildingManager.prototype.tagBuildings = function(tagData, changesetId, session, callback) {
    dbPool.connect(function(err, client, done) {
        if (err) {
            callback(503, { message: 'error fetching client from pool: ' + err });
            return;
        }
        
        var ids = [];
        var types = [];
        var roofTypes = [];
        var changesetIds = [];
        
        for (var i = 0; i < tagData.length; i++) {
            var t = tagData[i];
            ids.push(t.id);
            types.push(t.type);
            roofTypes.push(t.roofType);
            changesetIds.push(changesetId);
        }

        var query =
            "UPDATE buildings AS b \
            SET \
                roof_type = v.roof_type, \
                changeset_id = v.changeset_id \
            FROM unnest($1::integer[], $2::building_type[], $3::varchar[], $4::integer[]) AS v (id, type, roof_type, changeset_id) \
            WHERE b.osm_id = v.id AND b.type = v.type::building_type AND b.session_id = $5::integer";
        
        client.query(query, [ ids, types, roofTypes, changesetIds, session.id ], function(err, result) {
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
