'use strict';

var $ = require('jquery');
var osmAuth = require('osm-auth');
var L = require('leaflet');
var defined = require('defined');
var Session = require('./session.js');
var Building = require('./building.js');
var Session = require('./session.js');
var BuildingService = require('./buildingservice.js');
var LoadingStatus = require('./loadingstatus.js');

require('leaflet-easybutton');

require('leaflet/dist/leaflet.css');
require('leaflet/dist/images/marker-icon.png');
require('leaflet/dist/images/marker-icon-2x.png');
require('leaflet/dist/images/marker-shadow.png');
require('leaflet-easybutton/src/easy-button.css');
require('font-awesome/css/font-awesome.css');
require('./style.css');

// since leaflet is bundled into the browserify package it won't be able to detect where the images
// solution is to point it to where you host the the leaflet images yourself
L.Icon.Default.imagePath = 'http://cdn.leafletjs.com/leaflet-0.7.3/images';

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
    "</div>" +
    "<div id='tag-buttons'>" +
    "<label class='btn btn-primary'><input type='radio' name='tag-selection' id='tag-undefined' value='undefined' autocomplete='off' />Undefined</label>" +
    "<label class='btn btn-primary'><input type='radio' name='tag-selection' id='tag-tiles' value='tiles' autocomplete='off' />Tiles</label>" +
    "<label class='btn btn-primary'><input type='radio' name='tag-selection' id='tag-slate' value='slate' autocomplete='off' />Slate</label>" +
    "<label class='btn btn-primary'><input type='radio' name='tag-selection' id='tag-metal' value='metal' autocomplete='off' />Metal</label>" +
    "<label class='btn btn-primary'><input type='radio' name='tag-selection' id='tag-copper' value='copper' autocomplete='off' />Copper</label>" +
    "<label class='btn btn-primary'><input type='radio' name='tag-selection' id='tag-concrete' value='concrete' autocomplete='off' />Concrete</label>" +
    "</div>"
);

var _username = undefined;
var _map = undefined;
var _recenterButton = undefined;
var _buildingPolygon = undefined;
var _session = new Session();
var _loadingStatus = new LoadingStatus();

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
    updateButtons();
}

function fetchUserName(callback) {
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
        _username = u.getAttribute('display_name');
        var userId = u.getAttribute('id');
        
        console.log("connected as " + _username + " (" + userId + ")");
        
        updateConnectionStatusDisplay();
        updateButtons();
        
        if (defined(callback)) {
            callback();
        }
    });
};

function updateButtons()
{
    var loading = _loadingStatus.isLoading;
    
    $("#authenticate").prop('disabled', loading || auth.authenticated());
    $("#logout").prop('disabled', loading || !auth.authenticated())
    $("#building-buttons").find("button").prop('disabled', loading);
    
    if (_session.currentIndex <= 0) {
        $("#previous-building").prop('disabled', true);
    }
    
    if (defined(_session.currentBuilding)) {
        _recenterButton.enable();
    } else {
        _recenterButton.disable();
    }
    
    $("#tag-buttons").find("input").prop('disabled', loading || _session.currentIndex < 0);
}

function updateTagButtons() {
    $("#tag-buttons").find("input").prop("checked", false);
    
    if (defined(_session.currentBuilding)) {
        var roofMaterial = _session.currentBuilding.roofMaterial;
        $("#tag-" + roofMaterial).prop("checked", true);
    }
}

function updateConnectionStatusDisplay() {
    if (auth.authenticated()) {
        $("#authenticate").hide();
        $("#logout").show();
        $("#connection-status").text("Connected as " + _username);
    } else {
        $("#authenticate").show();
        $("#logout").hide();
        $("#connection-status").text("Disconnected");
    }
}

if (auth.authenticated()) {
    $("#connection-status").text("Connected, retrieving username...");
    fetchUserName();
}

document.getElementById('authenticate').onclick = function() {
    _loadingStatus.addSystem('username-fetch');
    fetchUserName(function() { // login is automatically triggered
        _loadingStatus.removeSystem('username-fetch');
    });
};
document.getElementById('logout').onclick = logout;

function destroyBuildingPolygon() {
    if (defined(_buildingPolygon)) {
        _map.removeLayer(_buildingPolygon);
        _buildingPolygon = undefined;
    }
}

function displayBuildingPolygon(building) {
    destroyBuildingPolygon();
    
    building.polygon.addTo(_map);
    _map.fitBounds(building.polygon.getBounds());
    _buildingPolygon = building.polygon;
}

function loadAndDisplayNewBuilding() {
    _loadingStatus.addSystem('load-building');
    
    BuildingService.getBuilding(function(building) {
        auth.xhr({
            method : 'GET',
            path : '/api/0.6/' + building.type + '/' + building.id + '/full'
        }, function(error, response) {
            if (defined(error)) {
                console.error("Download error: " + error.responseText);
                _loadingStatus.removeSystem('load-building');
            } else {
                var $data = $(response);
                var version = Number($data.children("osm").children(building.type).attr("version"));
                
                if (version !== building.version) {
                    console.log("Building " + building.type + "/" + building.id + " is at version " + version +
                        ", was expecting version " + building.version + ". Skipping.");
                    _loadingStatus.removeSystem('load-building');
                    loadAndDisplayNewBuilding();
                } else {
                    building.setData($data);
                    _session.addBuilding(building, true);
                    displayBuildingPolygon(building);
                    updateTagButtons();
                    _loadingStatus.removeSystem('load-building');
                }
            }
        });
    });
}

function displayPreviousBuilding() {
    if (_session.currentIndex > 0) {
        _session.currentIndex = _session.currentIndex - 1;
        var building = _session.getCurrentBuilding();
        displayBuildingPolygon(building);
        updateButtons();
        updateTagButtons();
    }
}

function displayNextBuilding() {
    if (_session.currentIndex < _session.buildingCount - 1) {
        _session.currentIndex = _session.currentIndex + 1;
        var building = _session.getCurrentBuilding();
        displayBuildingPolygon(building);
        updateButtons();
        updateTagButtons();
    } else {
        loadAndDisplayNewBuilding();
    }
}

document.getElementById('previous-building').onclick = function() {
    displayPreviousBuilding();
};

document.getElementById('next-building').onclick = function() {
    displayNextBuilding();
};

function init() {
    console.log("ENV: " + ENV);
    
    var osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    var osmAttrib = 'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
    var osm = new L.TileLayer(osmUrl, {minZoom: 0, maxZoom: 18, attribution: osmAttrib});
    _map = L.map('map').setView([46.935, 2.780], 7);
    _map.addLayer(osm);
    
    _recenterButton = L.easyButton(
        'fa-crosshairs fa-lg',
        function(button, map) {
            if (defined(_buildingPolygon)) {
                _map.fitBounds(_buildingPolygon.getBounds());
            }
        },
        '', // title
        'recenter-button' // id
    );
    _recenterButton.addTo(_map);
    _recenterButton.disable();
    
    // Set the title here and not in the button constructor because when set by
    // the constructor, the title is only displayable when the button is active.
    // With this alternative way its always displayable.
    $("#recenter-button").closest(".leaflet-control").prop("title", "Recenter on building");
    
    _loadingStatus.addListener(updateButtons);
    
    $('input[type=radio][name=tag-selection]').change(function() {
        if (defined(_session.currentBuilding)) {
            var value = this.value === 'undefined' ? undefined : this.value;
            _session.currentBuilding.roofMaterial = value;
            updateTagButtons()
        }
    });
    
    updateConnectionStatusDisplay();
    updateButtons();
}

init();