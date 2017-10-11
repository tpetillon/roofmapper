'use strict';

var $ = require('jquery');
var defined = require('./defined');
var Building = require('./building.js');

var BuildingService = {
    openSession : function(userId, callback) {
        $.ajax({
            type: 'PUT',
            url: '/sessions/open',
            data : { user_id : userId }
        })
        .done(function(data) {
            if (defined(callback)) {
                callback(undefined, data.session_token);
            }
        })
        .fail(function(xhr, status, error) {
            if (defined(callback)) {
                callback(xhr, undefined);
            }
        });
    },

    closeSession : function(sessionId, callback) {
        $.ajax({
            type: 'PUT',
            url: '/sessions/' + sessionId + '/close'
        })
        .done(function() {
            if (defined(callback)) {
                callback(undefined);
            }
        })
        .fail(function(xhr, status, error) {
            if (defined(callback)) {
                callback(xhr);
            }
        });
    },

    getBuilding : function(sessionId, callback) {
        $.ajax({
            type: 'PUT',
            url: '/sessions/' + sessionId + '/buildings/reserve'
        })
        .done(function(data) {
            if (defined(callback)) {
                var building = new Building(data.type, data.id, data.version);
                callback(undefined, building);
            }
        })
        .fail(function(xhr, status, error) {
            if (defined(callback)) {
                callback(xhr, undefined);
            }
        });
    },

    releaseBuilding : function(sessionId, buildingType, buildingId, callback) {
        $.ajax({
            type: 'PUT',
            url: '/sessions/' + sessionId + '/buildings/' + buildingType + '/' + buildingId + '/release'
        })
        .done(function() {
            if (defined(callback)) {
                callback(undefined);
            }
        })
        .fail(function(xhr, status, error) {
            if (defined(callback)) {
                callback(xhr);
            }
        });
    },

    tagBuildings : function(sessionId, tagData, callback) {
        $.ajax({
            type: 'POST',
            url: '/sessions/' + sessionId + '/buildings/tag',
            contentType: 'application/json',
            data: JSON.stringify(tagData)
        })
        .done(function() {
            if (defined(callback)) {
                callback(undefined);
            }
        })
        .fail(function(xhr, status, error) {
            if (defined(callback)) {
                callback(xhr);
            }
        });
    },

    invalidateBuildings : function(sessionId, invalidationData, callback) {
        $.ajax({
            type: 'POST',
            url: '/sessions/' + sessionId + '/buildings/invalidate',
            contentType: 'application/json',
            data: JSON.stringify(invalidationData)
        })
        .done(function() {
            if (defined(callback)) {
                callback(undefined);
            }
        })
        .fail(function(xhr, status, error) {
            if (defined(callback)) {
                callback(xhr);
            }
        });
    },

    fetchTopUsersStats : function(callback) {
        $.ajax({
            type: 'GET',
            url: '/stats/top'
        })
        .done(function(data) {
            if (defined(callback)) {
                callback(undefined, data);
            }
        })
        .fail(function(xhr, status, error) {
            if (defined(callback)) {
                callback(xhr, undefined);
            }
        });
    },

    fetchUserStats : function(userId, callback) {
        $.ajax({
            type: 'GET',
            url: '/stats/users/' + userId
        })
        .done(function(data) {
            if (defined(callback)) {
                callback(undefined, data);
            }
        })
        .fail(function(xhr, status, error) {
            if (defined(callback)) {
                callback(xhr, undefined);
            }
        });
    }
};

module.exports = BuildingService;