'use strict';

var dbPool = require('./dbpool');

function BuildingManager() {
}

BuildingManager.prototype.getUntaggedBuilding = function(sessionId, callback) {
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
        
        client.query(query, [ sessionId ], function(err, result) {
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

            callback(200, building);
        });
    });
};

var buildingManager = new BuildingManager();

module.exports = buildingManager;
