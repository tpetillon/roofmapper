'use strict';

function Session(sessionId, userId, startDate) {
    this._id = sessionId;
    this._userId = userId;
    this._startDate = startDate;
    this._lastUpdate = startDate;
    this._allocatedBuildingCount = 0;
}

Session.MAX_INACTIVE_DURATION = 2 * 60 * 60 * 1000 // ms == 2 hours

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
    },
    lastUpdate : {
        get : function() {
            return this._lastUpdate;
        }
    },
    allocatedBuildingCount : {
        get : function() {
            return this._allocatedBuildingCount;
        },
        set : function(value) {
            this._allocatedBuildingCount = value;

            if (this._allocatedBuildingCount < 0) {
                console.error('Cannot have less than 0 buildings allocated to a session!');
                this._allocatedBuildingCount = 0;
            }
        }
    }
});

Session.prototype.setLastUpdate = function() {
    this._lastUpdate = Date.now();
};

module.exports = Session;
