'use strict';

//document.write(require("./content.js"));

var $ = require("jquery");
var osmAuth = require('osm-auth');
var L = require('leaflet');

require("leaflet/dist/leaflet.css");
require("./style.css");

// since leaflet is bundled into the browserify package it won't be able to detect where the images
// solution is to point it to where you host the the leaflet images yourself
//L.Icon.Default.imagePath = 'http://cdn.leafletjs.com/leaflet-0.7.3/images';

$("body").append("<button id='authenticate'>Authenticate</button><button id='logout'>Logout</button>");
$("body").append("<div id='map'></div>");

var auth = osmAuth({
    oauth_consumer_key: 'WLwXbm6XFMG7WrVnE8enIF6GzyefYIN6oUJSxG65',
    oauth_secret: '9WfJnwQxDvvYagx1Ut0tZBsOZ0ZCzAvOje3u1TV0',
    auto: true // show a login form if the user is not authenticated and
               // you try to do a call
});

document.getElementById('authenticate').onclick = function() {
    // Signed method call - since `auto` is true above, this will
    // automatically start an authentication process if the user isn't
    // authenticated yet.
    auth.xhr({
        method: 'GET',
        path: '/api/0.6/user/details'
    }, function(err, details) {
        // details is an XML DOM of user details
        console.log("authentication: " + err + " - " + JSON.stringify(details));
        
        var u = details.getElementsByTagName('user')[0];
        var changesets = details.getElementsByTagName('changesets')[0];
        var o = {
            display_name: u.getAttribute('display_name'),
            id: u.getAttribute('id'),
            count: changesets.getAttribute('count')
        };
        
        console.log("details: " + JSON.stringify(o));
    });
};

document.getElementById('logout').onclick = function() {
    auth.logout();
    console.log("logged out");
}

var osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
var osmAttrib = 'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
var osm = new L.TileLayer(osmUrl, {minZoom: 0, maxZoom: 18, attribution: osmAttrib});
var map = L.map('map').setView([46.935, 2.780], 7);
map.addLayer(osm);