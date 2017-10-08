'use strict';

var schedule = require('node-schedule');

var dbPool = require('./dbpool');
var defined = require('./defined');
var Session = require('./session');
var SessionList = require('./sessionlist');

function SessionManager() {
    this._sessions = new SessionList();
}

SessionManager.prototype.getSession = function(token) {
    return this._sessions.getByToken(token);
}

SessionManager.prototype.openSession = function(userId, callback) {
    var session = this._sessions.getByUser(userId);
    if (defined(session)) {
        var that = this;
        this.closeSession(session, function(status, message) {
            if (status !== 200) {
                callback(status, message);
            } else {
                that.openSession(userId, callback);
            }
        });
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
                
                callback(200, { session_token: session.token, start_date: session.startDate });
            });
        });
    });
};

SessionManager.prototype.closeSession = function(session, callback) {
    var that = this;
    
    dbPool.connect(function(err, client, done) {
        if (err) {
            callback(503, { message: 'error fetching client from pool: ' + err });
            return;
        }
        
        client.query('UPDATE sessions SET end_date = now() WHERE id=$1::integer AND user_id=$2::integer AND end_date IS NULL', [ session.id, session.userId ], function(err, result) {
            if (err) {
                callback(500, { message: 'error running query: ' + err });
                return;
            }
            
            that._sessions.remove(session.id);
            
            console.log("closing session " + session.id + " for user " + session.userId);

            that.releaseMultipleSessionBuildings([ session.id ], client, function(err) {
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

                that.releaseMultipleSessionBuildings(sessionIds, client, function(err) {
                    done();
                });
            }
        });
    });
};

SessionManager.prototype.scheduleSessionClosing = function() {
    var that = this;

    var rule = new schedule.RecurrenceRule();
    rule.minute = [ 0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55 ];
    schedule.scheduleJob(rule, function() {
        dbPool.connect(function(err, client, done) {
            if (err) {
                console.error('Error fetching client from pool: ' + err);
                return;
            }

            var inactiveSessionIds = that._sessions.getInactiveSessions().map(function(session) {
                return session.id;
            });
            
            var query = 'UPDATE sessions SET end_date = now() WHERE id = ANY($1::integer[]) AND end_date IS NULL RETURNING id';
            client.query(query, [ inactiveSessionIds ], function(err, result) {
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

                    that.releaseMultipleSessionBuildings(sessionIds, client, function(err) {
                        done();
                    });
                } else {
                    done();
                }
            });
        });
    });
};

SessionManager.prototype.releaseMultipleSessionBuildings = function(sessionIds, client, callback) {
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

SessionManager.prototype.releaseSessionBuildings = function(session, callback) {
    session.setLastUpdate();

    dbPool.connect(function(err, client, done) {
        if (err) {
            callback(503, { message: 'error fetching client from pool: ' + err });
            return;
        }

        client.query('UPDATE buildings SET session_id = NULL WHERE session_id = $1::integer AND changeset_id IS NULL', [ session.id ], function(err, result) {
            done();

            if (err) {
                callback(500, { error: 'error running query: ' + err });
                return;
            }

            callback(200, { message: result.rowCount + ' buildings released' });
        });
    });
};

var sessionManager = new SessionManager();

module.exports = sessionManager;
