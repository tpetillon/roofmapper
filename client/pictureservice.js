'use strict';

var $ = require('jquery');
var defined = require('./defined');

var endPoint = 'http://api-pic4carto.openstreetmap.fr';
var radius = 250; // metres

var PictureService = {
    fetchPictures: function(latitude, longitude, callback) {
        $.ajax({
            type: 'GET',
            url: endPoint + '/search/around?lat=' + latitude + '&lng=' + longitude + '&radius=' + radius
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
    
module.exports = PictureService;