'use strict';

var activeSessions = require('./activesessions');
var dbPool = require('./dbpool');

function closeOpenSessions() {
    dbPool.connect(function(err, client, done) {
        if (err) {
            console.error('Error fetching client from pool: ' + err);
            return;
        }
        
        client.query('UPDATE sessions SET end_date = now() WHERE end_date IS NULL', [ ], function(err, result) {
            done();

            if (err) {
                console.error('Error running query: ' + err);
                return;
            }

            activeSessions.clear();

            if (result.rowCount > 0) {
                console.log(result.rowCount + ' open sessions closed')
            }
        });
    });
}

module.exports = closeOpenSessions;
