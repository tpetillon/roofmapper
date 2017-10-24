'use strict';

var $ = require('jquery');
var defined = require('./defined');
var Localizer = require('./localizer.js');

var endPoint = NOMINATIM_SERVER_URL;
var zoom = NOMINATIM_ZOOM_LEVEL;

var GeocodingService = {
    reverse: function(latitude, longitude, language, callback) {
        var query = endPoint + '/reverse?format=json&lat=' + latitude + '&lon=' + longitude + '&zoom=' + zoom;

        if (defined(language)) {
            query += '&accept-language=' + language;
        }

        $.ajax({
            type: 'GET',
            url: query
        })
        .done(function(data) {
            if (defined(callback)) {
                callback(undefined, data.display_name);
            }
        })
        .fail(function(xhr, status, error) {
            if (defined(callback)) {
                callback(xhr, undefined);
            }
        });
    }
};
    
module.exports = GeocodingService;