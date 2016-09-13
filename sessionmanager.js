'use strict';

var schedule = require('node-schedule');

var dbPool = require('./dbpool');
var Session = require('./session');
var SessionList = require('./sessionlist');

function SessionManager() {
    this._sessions = new SessionList();
}

SessionManager.prototype.hasOpenSession = function(sessionId, userId) {
    return this._sessions.has(sessionId, userId);
};

SessionManager.prototype.openSession = function(userId, callback) {
    if (this._sessions.hasForUser(userId)) {
        callback(403, { error: "a session is already open for user id " + userId });
        return;
    }

    var that = this;

    dbPool.connect(function(err, client, done) {
        if (err) {
            callback(503, { error: 'error fetching client from pool: ' + err });
            return;
        }
        
        client.query('SELECT id FROM sessions WHERE user_id=$1::integer AND end_date IS NULL', [ userId ], function(err, result) {
            if (err) {
                done();
                callback(500, { error: 'error running query: ' + err });
                return;
            }
            
            if (result.rowCount != 0) {
                done();
                console.error("An open session was present in the database for user " + userId);
                callback(403, { error: "a session is already open for user id " + userId });
                return;
            }
            
            client.query('INSERT INTO sessions VALUES (DEFAULT, $1::integer, DEFAULT, NULL) RETURNING *', [ userId ], function(err, result) {
                done();

                if (err) {
                    callback(500, { error: 'error running query: ' + err });
                    return;
                }
                
                var row = result.rows[0];
                var session = new Session(row.id, row.user_id, row.start_date);
                that._sessions.add(session);
                
                console.log("opening session " + session.id + " for user " + session.userId);
                
                callback(200, { session_id: session.id, start_date: session.startDate });
            });
        });
    });
};

SessionManager.prototype.closeSession = function(sessionId, userId, callback) {
    if (!this._sessions.has(sessionId)) {
        callback(400, { error: "session " + sessionId + " is not an open session for user " + userId });
        return;
    }
    
    var session = this._sessions.get(sessionId);
    
    if (session.userId != userId) {
        callback(400, { error: "session " + sessionId + " is not an open session for user " + userId });
        return;
    }
    
    var that = this;
    
    dbPool.connect(function(err, client, done) {
        if (err) {
            callback(503, { message: 'error fetching client from pool: ' + err });
            return;
        }
        
        client.query('UPDATE sessions SET end_date = now() WHERE id=$1::integer AND user_id=$2::integer AND end_date IS NULL', [ sessionId, userId ], function(err, result) {
            if (err) {
                callback(500, { message: 'error running query: ' + err });
                return;
            }
            
            that._sessions.remove(sessionId);
            
            console.log("closing session " + sessionId + " for user " + userId);

            that.releaseSessionBuildings([ sessionId ], client, function(err) {
                done();

                if (err) {
                    callback(500, { message: 'error running query: ' + err });
                    return;
                }

                callback(200, { message: 'session closed' });
            });
        });
    });
};

SessionManager.prototype.closeOpenSessions = function() {
    var that = this;

    dbPool.connect(function(err, client, done) {
        if (err) {
            console.error('Error fetching client from pool: ' + err);
            return;
        }
        
        client.query('UPDATE sessions SET end_date = now() WHERE end_date IS NULL RETURNING id', [ ], function(err, result) {
            done();

            if (err) {
                console.error('Error running query: ' + err);
                return;
            }

            that._sessions.clear();

            if (result.rowCount > 0) {
                console.log(result.rowCount + ' open sessions closed');

                var sessionIds = result.rows.map(function(row) {
                    return row.id;
                });

                that.releaseSessionBuildings(sessionIds, client, function(err) {
                    done();
                });
            }
        });
    });
};

SessionManager.prototype.scheduleSessionClosing = function() {
    var that = this;

    var rule = new schedule.RecurrenceRule();
    //rule.minute = [ 0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55 ];
    rule.second = [ 0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55 ];
    schedule.scheduleJob(rule, function() {
        dbPool.connect(function(err, client, done) {
            if (err) {
                console.error('Error fetching client from pool: ' + err);
                return;
            }
            
            client.query('UPDATE sessions SET end_date = now() WHERE start_date < now() - INTERVAL \'1 minutes\' AND end_date IS NULL RETURNING id', [ ], function(err, result) {
                if (err) {
                    console.error('Error running query: ' + err);
                    return;
                }

                for (var i = 0; i < result.rowCount; i++) {
                    that._sessions.remove(result.rows[i].id);
                }

                if (result.rowCount > 0) {
                    console.log(result.rowCount + ' open sessions closed');

                    var sessionIds = result.rows.map(function(row) {
                        return row.id;
                    });

                    that.releaseSessionBuildings(sessionIds, client, function(err) {
                        done();
                    });
                } else {
                    done();
                }
            });
        });
    });
};

SessionManager.prototype.releaseSessionBuildings = function(sessionIds, client, callback) {
    client.query('UPDATE buildings SET session_id = NULL WHERE session_id = ANY($1::integer[]) AND changeset_id IS NULL', [ sessionIds ], function(err, result) {
        if (err) {
            console.error('Error running query: ' + err);
            callback(err);
            return;
        }

        if (result.rowCount > 0) {
            console.log(result.rowCount + ' buildings released from sessions [' + sessionIds + ']');
        }

        callback();
    });
};

var sessionManager = new SessionManager();

module.exports = sessionManager;
