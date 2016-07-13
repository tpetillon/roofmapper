'use strict';

//document.write(require("./content.js"));

var $ = require("jquery");
var osmAuth = require('osm-auth');
var L = require('leaflet');
var defined = require('defined');

require("leaflet/dist/leaflet.css");
require("./style.css");

// since leaflet is bundled into the browserify package it won't be able to detect where the images
// solution is to point it to where you host the the leaflet images yourself
//L.Icon.Default.imagePath = 'http://cdn.leafletjs.com/leaflet-0.7.3/images';

$("body").append("<button id='authenticate'>Authenticate</button><button id='logout'>Logout</button>");
$("body").append("<p id='connection-status'>Disconnected</p>");
$("body").append("<div id='map'></div>");

var username = undefined;

var auth = osmAuth({
    oauth_consumer_key: 'aF9d6GToknMHKvU7KLo208XCMaHxPo2EtyMxgLtd',
    oauth_secret: '0QrDWTZMCG0IYFnm92iq045HTzv26p1QzwhhItaV',
    auto: true, // show a login form if the user is not authenticated and
               // you try to do a call
    landing: "/land.html"
});

function logout() {
    auth.logout();
    
    console.log("logged out");
    
    updateConnectionStatusDisplay();
}

function fetchUserName() {
    // Signed method call - since `auto` is true above, this will
    // automatically start an authentication process if the user isn't
    // authenticated yet.
    auth.xhr({
        method: 'GET',
        path: '/api/0.6/user/details'
    }, function(error, details) {
        if (defined(error)) {
            alert("Error: " + error.responseText);
            console.log("could not connect: " + error.responseText);
            
            if (error.status === 401) {
                logout();
            }
            
            return;
        }
        
        var u = details.getElementsByTagName('user')[0];
        username = u.getAttribute('display_name');
        var userId = u.getAttribute('id');
        
        console.log("connected as " + username + " (" + userId + ")");
        
        updateConnectionStatusDisplay();
    });
};

function updateConnectionStatusDisplay() {
    if (auth.authenticated()) {
        $("#authenticate").prop('disabled', true);
        $("#logout").prop('disabled', false);
        $("#connection-status").text("Connected as " + username);
    } else {
        $("#authenticate").prop('disabled', false);
        $("#logout").prop('disabled', true);
        $("#connection-status").text("Disconnected");
    }
}

updateConnectionStatusDisplay();

if (auth.authenticated()) {
    $("#connection-status").text("Connected, retrieving username...");
    fetchUserName();
}

document.getElementById('authenticate').onclick = fetchUserName; // login is automatically triggered
document.getElementById('logout').onclick = logout;

var osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
var osmAttrib = 'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
var osm = new L.TileLayer(osmUrl, {minZoom: 0, maxZoom: 18, attribution: osmAttrib});
var map = L.map('map').setView([46.935, 2.780], 7);
map.addLayer(osm);