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
$("body").append("<button id='download'>Download</button>");
$("body").append("<div id='map'></div>");

var username = undefined;
var map = undefined;

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

function extractNodes($data) {
    var nodes = {};
    
    $data.children("osm").children("node").each(function() {
        var id = Number($(this).attr("id"));
        var lat = Number($(this).attr("lat"));
        var lon = Number($(this).attr("lon"));
        nodes[id] = [ lat, lon ];
    });
    
    return nodes;
}

function extractWays($data) {
    var nodes = extractNodes($data);
    
    var ways = {};
    
    $data.children("osm").children("way").each(function() {
        var id = Number($(this).attr("id"));
        
        var nodeIds = $(this).children("nd").map(function() {
            return Number($(this).attr("ref"));
        });
        
        var positions = $.map(nodeIds, function(id_) {
            // array in array because map() flattens arrays and we don't want that
            return [ nodes[id_] ];
        });
        
        ways[id] = positions;
    });
    
    return ways;
}

function extractRelation($data) {
    var ways = extractWays($data);
    
    var outerWays = [];
    var innerWays = [];
    
    $data.children("osm").children("relation").children("member").filter("[type='way']").each(function() {
        var ref = Number($(this).attr("ref"));
        var role = $(this).attr("role");
        
        var way = ways[ref];
        
        if (role === "outer") {
            outerWays.push(way);
        } else if (role === "inner") {
            innerWays.push(way);
        }
    });
    
    return {
        outer : outerWays,
        inner : innerWays
    };
}

function displayOsmWayAsPolygon($data) {
    var ways = extractWays($data);
    var positions = ways[Object.keys(ways)[0]];
    var polygon = L.polygon(positions)
    polygon.addTo(map);
    map.fitBounds(polygon.getBounds());
    return polygon;
}

function displayOsmWayAsMultiPolygon($data) {
    var relation = extractRelation($data);
    var polygons = [];
    for (var i = 0; i < relation.outer.length; i++) {
        polygons.push([relation.outer[i]].concat(relation.inner));
    }
    var multiPolygon = L.multiPolygon(polygons)
    multiPolygon.addTo(map);
    map.fitBounds(multiPolygon.getBounds());
    return multiPolygon;
}

/*document.getElementById('download').onclick = function() {
    auth.xhr({
        method: 'GET',
        path: '/api/0.6/way/45827933/full'
    }, function(error, response) {
        if (defined(error)) {
            console.error("Download error: " + error.responseText);
        } else {
            var $data = $(response);
            displayOsmWayAsPolygon($data);
        }
    });
};*/

document.getElementById('download').onclick = function() {
    auth.xhr({
        method: 'GET',
        path: '/api/0.6/relation/252751/full'
    }, function(error, response) {
        if (defined(error)) {
            console.error("Download error: " + error.responseText);
        } else {
            var $data = $(response);
            displayOsmWayAsMultiPolygon($data);
        }
    });
};

var osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
var osmAttrib = 'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
var osm = new L.TileLayer(osmUrl, {minZoom: 0, maxZoom: 18, attribution: osmAttrib});
map = L.map('map').setView([46.935, 2.780], 7);
map.addLayer(osm);