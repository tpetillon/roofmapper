'use strict';

function Session(sessionId, userId, startDate) {
    this._id = sessionId;
    this._userId = userId;
    this._startDate = startDate;
}

Object.defineProperties(Session.prototype, {
    id : {
        get : function() {
            return this._id;
        }
    },
    userId : {
        get : function() {
            return this._userId;
        }
    },
    startDate : {
        get : function() {
            return this._startDate;
        }
    }
});

module.exports = Session;
