'use strict';

var $ = require('jquery');
var osmAuth = require('osm-auth');
var L = require('leaflet');
var defined = require('defined');
var Session = require('./session.js');
var Building = require('./building.js');
var Session = require('./session.js');
var BuildingService = require('./buildingservice.js');

require('leaflet/dist/leaflet.css');
require('./style.css');

// since leaflet is bundled into the browserify package it won't be able to detect where the images
// solution is to point it to where you host the the leaflet images yourself
//L.Icon.Default.imagePath = 'http://cdn.leafletjs.com/leaflet-0.7.3/images';

$("body").append("<div id='wrapper'></div>");
var wrapper = $("body").children("#wrapper");
wrapper.append("<div id='header'></div>");
wrapper.children("#header").append(
    "<div id='connection-buttons'>" +
    "<span id='connection-status'>Disconnected</span> " +
    "<button id='authenticate'>Authenticate</button>" +
    "<button id='logout'>Logout</button>" +
    "</div>"
);
wrapper.append("<div id='map'></div>");
wrapper.append("<div id='footer'></div>");
wrapper.children("#footer").append(
    "<div id='building-buttons'>" +
    "<button id='previous-building'>Previous building</button>" +
    "<button id='next-building'>Next building</button>" +
    "</div>"
);

var username = undefined;
var map = undefined;
var buildingPolygon = undefined;
var session = new Session();

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
        $("#authenticate").prop('disabled', true).hide();
        $("#logout").prop('disabled', false).show();
        $("#connection-status").text("Connected as " + username);
        
        $("#download").prop('disabled', false);
    } else {
        $("#authenticate").prop('disabled', false).show();
        $("#logout").prop('disabled', true).hide();
        $("#connection-status").text("Disconnected");
        
        $("#download").prop('disabled', true);
    }
}

updateConnectionStatusDisplay();

if (auth.authenticated()) {
    $("#connection-status").text("Connected, retrieving username...");
    fetchUserName();
}

document.getElementById('authenticate').onclick = fetchUserName; // login is automatically triggered
document.getElementById('logout').onclick = logout;

function destroyBuildingPolygon() {
    if (defined(buildingPolygon)) {
        map.removeLayer(buildingPolygon);
        buildingPolygon = undefined;
    }
}

function displayBuildingPolygon(building) {
    destroyBuildingPolygon();
    
    building.polygon.addTo(map);
    map.fitBounds(building.polygon.getBounds());
    buildingPolygon = building.polygon;
}

function loadAndDisplayNewBuilding(onError) {
    destroyBuildingPolygon();
    
    BuildingService.getBuilding(function(building) {
        auth.xhr({
            method : 'GET',
            path : '/api/0.6/' + building.type + '/' + building.id + '/full'
        }, function(error, response) {
            if (defined(error)) {
                console.error("Download error: " + error.responseText);
                onError();
            } else {
                var $data = $(response);
                var version = Number($data.children("osm").children(building.type).attr("version"));
                
                if (version !== building.version) {
                    console.log("Building " + building.type + "/" + building.id + " is at version " + version +
                        ", was expecting version " + building.version + ". Skipping.");
                    onError();
                } else {
                    building.setData($data);
                    session.addBuilding(building, true);
                    displayBuildingPolygon(building);
                }
            }
        });
    });
}

function displayPreviousBuilding() {
    if (session.currentIndex > 0) {
        session.currentIndex = session.currentIndex - 1;
        var building = session.getCurrentBuilding();
        displayBuildingPolygon(building);
    }
}

function displayNextBuilding() {
    if (session.currentIndex < session.buildingCount - 1) {
        session.currentIndex = session.currentIndex + 1;
        var building = session.getCurrentBuilding();
        displayBuildingPolygon(building);
    } else {
        destroyBuildingPolygon();
        
        loadAndDisplayNewBuilding(loadAndDisplayNewBuilding);
    }
}

document.getElementById('previous-building').onclick = function() {
    displayPreviousBuilding();
};

document.getElementById('next-building').onclick = function() {
    displayNextBuilding();
};

var osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
var osmAttrib = 'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
var osm = new L.TileLayer(osmUrl, {minZoom: 0, maxZoom: 18, attribution: osmAttrib});
map = L.map('map').setView([46.935, 2.780], 7);
map.addLayer(osm);