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
    }
};

module.exports = BuildingService;