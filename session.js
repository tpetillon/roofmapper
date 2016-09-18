'use strict';

function Session(sessionId, userId, startDate) {
    this._id = sessionId;
    this._userId = userId;
    this._startDate = startDate;
    this._allocatedBuildingCount = 0;
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

module.exports = Session;
