'use strict';

var defined = require('./defined');
var Session = require('./session');

function SessionList() {
    this._sessionsById = new Map();
    this._sessionsByUser = new Map();
    this._sessionsByToken = new Map();
}

SessionList.prototype.add = function(session) {
    if (this._sessionsById.has(session.id)) {
        console.error("Trying to add session " + session.id + ", which is already present!");
    } else if (this._sessionsByUser.has(session.userId)) {
        console.error("Trying to add session for user " + session.id + ", who already has one open!");
    } else {
        this._sessionsById.set(session.id, session);
        this._sessionsByUser.set(session.userId, session);
        this._sessionsByToken.set(session.token, session);
    }
};

SessionList.prototype.hasForUser = function(userId) {
    return this._sessionsByUser.has(userId);
};

SessionList.prototype.getById = function(sessionId) {
    return this._sessionsById.get(sessionId);
};

SessionList.prototype.getByToken = function(token) {
    return this._sessionsByToken.get(token);
};

SessionList.prototype.remove = function(sessionId) {
    if (!this._sessionsById.has(sessionId)) {
        console.error("Trying to remove session " + sessionId + ", which is not present!");
    } else {
        var session = this._sessionsById.get(sessionId);
        this._sessionsById.delete(sessionId);
        
        if (!this._sessionsByUser.has(session.userId)) {
            console.error("Trying to remove session for user " + session.userId + ", who has no open sessions!");
        } else {
            this._sessionsByUser.delete(session.userId);
        }
        
        this._sessionsByToken.delete(session.token);
    }
};

SessionList.prototype.clear = function() {
    this._sessionsById.clear();
    this._sessionsByUser.clear();
    this._sessionsByToken.clear();
};

SessionList.prototype.getInactiveSessions = function() {
    var cutoffDate = Date.now() - Session.MAX_INACTIVE_DURATION;
    var inactiveSessions = [];
    var values = this._sessionsById.values();
    var next = values.next();
    while (!next.done) {
        var session = next.value;
        if (session.lastUpdate < cutoffDate) {
            inactiveSessions.push(next.value);
        }
        next = values.next();
    }
    return inactiveSessions;
};

module.exports = SessionList;
