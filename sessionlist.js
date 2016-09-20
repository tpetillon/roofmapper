'use strict';

var defined = require('./defined');
var Session = require('./session');

function SessionList() {
    this._sessionsById = new Map();
    this._sessionsByUser = new Map();
}

SessionList.prototype.add = function(session) {
    if (this._sessionsById.has(session.id)) {
        console.error("Trying to add session " + session.id + ", which is already present!");
    } else if (this._sessionsByUser.has(session.userId)) {
        console.error("Trying to add session for user " + session.id + ", who already has one open!");
    } else {
        this._sessionsById.set(session.id, session);
        this._sessionsByUser.set(session.userId, session);
    }
};

SessionList.prototype.has = function(sessionId, userId) {
    var session = this._sessionsById.get(sessionId);

    if (!defined(session)) {
        return false;
    }

    if (!defined(userId)) {
        return true;
    }

    return session.userId === userId;
};

SessionList.prototype.hasForUser = function(userId) {
    return this._sessionsByUser.has(userId);
};

SessionList.prototype.get = function(sessionId) {
    return this._sessionsById.get(sessionId);
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
    }
};

SessionList.prototype.clear = function() {
    this._sessionsById.clear();
    this._sessionsByUser.clear();
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
