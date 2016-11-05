'use strict';

var $ = require('expose?$!expose?jQuery!jquery');
var L = require('leaflet');
var keyboardJS = require('keyboardJS');
var defined = require('./defined');
var OsmApi = require('./osmapi.js');
var Session = require('./session.js');
var Building = require('./building.js');
var Session = require('./session.js');
var BuildingService = require('./buildingservice.js');
var LoadingStatus = require('./loadingstatus.js');
var Localizer = require('./localizer.js');
var enMessages = require('./messages/en.json');
var frMessages = require('./messages/fr.json');

require("jquery-fullscreen-plugin");

require('leaflet-bing-layer');
require('leaflet-easybutton');

require('leaflet/dist/leaflet.css');
require('leaflet/dist/images/marker-icon.png');
require('leaflet/dist/images/marker-icon-2x.png');
require('leaflet/dist/images/marker-shadow.png');
require('leaflet-easybutton/src/easy-button.css');
require('./style.css');

require('bootstrap');
require("bootstrap-webpack");

require("font-awesome-webpack");

// since leaflet is bundled into the browserify package it won't be able to detect where the images
// solution is to point it to where you host the the leaflet images yourself
L.Icon.Default.imagePath = 'http://cdn.leafletjs.com/leaflet-0.7.3/images';

$("body").append(require('html!./main.html'));
$("body").append(require('html!./aboutpopup.html'));
$("body").append(require('html!./messagepopup.html'));

var _localizer = new Localizer(document, [ enMessages, frMessages ]);
var _map = undefined;
var _recenterButton = undefined;
var _buildingPolygon = undefined;
var _api = new OsmApi();
var _session = new Session();
var _loadingStatus = new LoadingStatus();

function logout() {
    if (_session.open) {
        BuildingService.closeSession(_session.id);
        _session.id = undefined;
    }

    _api.logout();
    
    console.log("logged out");
    
    updateConnectionStatusDisplay();
    updateUi();
}

function confirmQuit(evt) {
    var dialogText = _localizer.getText("close-roofmapper-confirm");
    evt.returnValue = dialogText;
    return dialogText;
}

function updateUi() {
    var loading = _loadingStatus.isLoading;
    
    $("#authenticate").prop('disabled', loading || _api.authenticated);
    $("#logout").prop('disabled', loading || !_api.authenticated)
    $("#building-buttons").find("button").prop('disabled', loading);
    
    if (_session.currentIndex <= 0) {
        $("#previous-building").prop('disabled', true);
    }
    if (!_session.open ||
        (_session.currentIndex == _session.buildingCount - 1 && (_session.full || _session.changesetIsFull))) {
        $("#next-building").prop('disabled', true);
    }
    
    if (defined(_session.currentBuilding)) {
        _recenterButton.enable();
    } else {
        _recenterButton.disable();
    }
    
    $("#tag-buttons").find("input").prop('disabled', loading || _session.currentIndex < 0);
    
    $("#upload-changes").prop("disabled", loading || !_session.open || _session.taggedBuildingCount <= 0);
    
    $("#tag-buttons").find("input")
        .prop("checked", false)
        .parent().removeClass("active");
    
    if (defined(_session.currentBuilding)) {
        var roofMaterial = _session.currentBuilding.roofMaterial;
        $("#tag-" + roofMaterial)
            .prop("checked", true)
            .parent().addClass("active");
        
        $("#tag-buttons").find("input")
            .parent().removeClass("disabled")
    } else {
        $("#tag-buttons").find("input")
            .parent().addClass("disabled")
    }
    
    $("#tagged-building-count")
        .attr('l10n', 'n-buildings-tagged')
        .attr('l10n-params', JSON.stringify({ count: _session.taggedBuildingCount }));
    $("#uploaded-building-count")
        .attr('l10n', 'n-buildings-uploaded')
        .attr('l10n-params', JSON.stringify({ count: _session.uploadedBuildingCount }));

    if (_session.taggedBuildingCount > 0) {
        window.addEventListener('beforeunload', confirmQuit);
    } else {
        window.removeEventListener('beforeunload', confirmQuit)
    }
}

function updateConnectionStatusDisplay() {
    if (_api.authenticated) {
        $("#authenticate-button").hide();
        $("#user-menu").show();
        $("#username").removeAttr("l10n").text(_api.username);
        $("#user-profile-link").attr("href", _api.url + "/user/" + _api.username);
    } else {
        $("#authenticate-button").show();
        $("#user-menu").hide();
        $("#username").attr("l10n", "username");
    }
}

if (_api.authenticated) {
    $("#connection-status").text("Authenticated, retrieving username...");
    _loadingStatus.addSystem('connection');
    _api.connect(function(error) {
        _loadingStatus.removeSystem('connection');
        if (defined(error)) {
            showMessage("could-not-connect", error.responseText);
        } else {
            console.log("connected as " + _api.username + " (" + _api.userId + ")");
            
            openSession();
        }
        
        updateConnectionStatusDisplay();
        updateUi();
    });
}

document.getElementById('authenticate-button').onclick = function() {
    _loadingStatus.addSystem('authentication');
    _api.authenticate(function(error) {
        _loadingStatus.removeSystem('authentication');
        
        if (defined(error)) {
            showMessage("could-not-authenticate", error.responseText);
        } else {
            console.log("connected as " + _api.username + " (" + _api.userId + ")");

            openSession();
        }
        
        updateConnectionStatusDisplay();
        updateUi();
    });
};

document.getElementById('logout-button').onclick = logout;

function openSession() {
    if (!_api.authenticated) {
        return;
    }

    if (_session.open) {
        return;
    }
    
    _loadingStatus.addSystem('open-session');

    BuildingService.openSession(_api.userId, function(error, sessionId) {
        _loadingStatus.removeSystem('open-session');

        if (defined(error)) {
            console.log("could not open session: " + error.responseText);
            showMessage("could-not-open-session", error.responseText);
        } else {
            console.log("session " + sessionId + " opened");
            _session.id = sessionId;
            
            displayNextBuilding();
        }
        
        updateUi();
    });
}

function destroyBuildingPolygon() {
    if (defined(_buildingPolygon)) {
        _map.removeLayer(_buildingPolygon);
        _buildingPolygon = undefined;
    }
}

function displayBuildingPolygon(building) {
    destroyBuildingPolygon();
    
    if (!defined(building)) {
        return;
    }
    
    building.polygon.setStyle({
        weight : 2,
        color : '#FFFF00',
        opacity : 0.8,
        fill : false,
        dashArray : "5,5",
        clickable : false
    });
    building.polygon.addTo(_map);
    _map.fitBounds(building.polygon.getBounds());
    _buildingPolygon = building.polygon;
}

function loadAndDisplayNewBuilding() {
    if (_session.full || _session.changesetIsFull) {
        return;
    }
    
    _loadingStatus.addSystem('load-building');
    
    BuildingService.getBuilding(_session.id, function(error, building) {
        if (defined(error)) {
            console.error("Could not get building from building service: " + error.responseText);
            showMessage("could-not-get-building-from-building-service", error.responseText);
        } else {
            _api.request('/api/0.6/' + building.type + '/' + building.id + '/full', 'GET', function(error, response) {
                if (defined(error)) {
                    console.error("Download error: " + error.responseText);
                    showMessage("download-error", error.responseText);
                    _loadingStatus.removeSystem('load-building');
                } else {
                    var $data = $(response);
                    var version = Number($data.children("osm").children(building.type).attr("version"));
                    
                    if (version !== building.version) {
                        console.log("Building " + building.type + "/" + building.id + " is at version " + version +
                            ", was expecting version " + building.version + ". Skipping.");
                        _loadingStatus.removeSystem('load-building');
                        markBuildingAsOutdatedAndRelease(building.type, building.id);
                        loadAndDisplayNewBuilding();
                    } else {
                        building.setData($data);
                        
                        if (defined(building.roofMaterial)) {
                            console.log("Building " + building.type + "/" + building.id +
                                " already has its roof material defined. Skipping.");
                            _loadingStatus.removeSystem('load-building');
                            loadAndDisplayNewBuilding();
                        } else {
                            console.log("Displaying building " + building.type + "/" + building.id);
                            _session.addBuilding(building, true);
                            displayBuildingPolygon(building);
                            updateUi();
                            _loadingStatus.removeSystem('load-building');
                        }
                    }
                }
            });
        }
    });
}

function displayPreviousBuilding() {
    if (_session.currentIndex > 0) {
        _session.currentIndex = _session.currentIndex - 1;
        var building = _session.getCurrentBuilding();
        displayBuildingPolygon(building);
        updateUi();
    }
}

function displayNextBuilding() {
    if (_session.currentIndex < _session.buildingCount - 1) {
        _session.currentIndex = _session.currentIndex + 1;
        var building = _session.getCurrentBuilding();
        displayBuildingPolygon(building);
        updateUi();
    } else {
        loadAndDisplayNewBuilding();
    }
}

function clearTaggedBuildings() {
    _session.clearTaggedBuildings();
    var building = _session.getCurrentBuilding();
    displayBuildingPolygon(building);
    updateUi();
}

document.getElementById('previous-building').onclick = displayPreviousBuilding;
document.getElementById('next-building').onclick = displayNextBuilding;

function createChangeset(callback) {
    var changesetData =
        '<osm>' +
        '<changeset>' +
        '<tag k="created_by" v="RoofMapper ' + VERSION + '"/>' +
        '<tag k="comment" v="Add building roof:material data from imagery"/>' +
        '<tag k="source" v="Bing"/>' +
        '</changeset>' +
        '</osm>';
    
    _loadingStatus.addSystem('changeset-creation');
    
    _api.requestWithData('/api/0.6/changeset/create', 'PUT', changesetData, function(error, response) {
        if (defined(error)) {
            console.error("Changeset creation error: " + error.responseText);
            showMessage("changeset-creation-error", error.responseText);
            _loadingStatus.removeSystem('changeset-creation');
        } else {
            var changesetId = Number(response);
            console.log("Changeset " + changesetId + " created");
            _session.changesetId = changesetId;
            
            callback();
            _loadingStatus.removeSystem('changeset-creation');
        }
    });
}

function uploadChanges() {
    if (!defined(_session.changesetId)) {
        return;
    }
    
    var changeData = _session.toOsmChange();
    
    _loadingStatus.addSystem('changes-upload');
    
    var url = '/api/0.6/changeset/' + _session.changesetId + '/upload';
    _api.requestWithData(url, 'POST', changeData, function(error, response) {
        if (defined(error)) {
            console.error("Changes upload error: " + error.responseText);
            
            if (error.statusText === "Conflict") {
                if (error.responseText.match(/was closed/)) {
                    // The changeset #id was closed at #closed_at.
                    console.log("The changeset " + _session.changesetId +
                        " has been closed, creating a new one.");
                    createChangeset(uploadChanges);
                } else if (error.responseText.match(/Version mismatch/)) {
                    // Version mismatch: Provided #ver_client, server had: #ver_serv of [Way|Relation] #id
                    removeBuildingInConflict(error.responseText);
                }
            }
            
            _loadingStatus.removeSystem('changes-upload');
        } else {
            console.log("Changes uploaded to OSM server");
            
            BuildingService.tagBuildings(_session.id, _session.toTagData(), function(error) {
                _loadingStatus.removeSystem('changes-upload');
                
                if (defined(error)) {
                    console.error("Could not upload tags to building service: " + error.responseText);
                } else {
                    console.log("Tags uploaded to building service");
                    showMessage("changes-uploaded-to-osm");
                }

                _session.clearTaggedBuildings();
                destroyBuildingPolygon();
                loadAndDisplayNewBuilding();
            });
        }
    });
}

function removeBuildingInConflict(errorString) {
    var matches = errorString.match(/(Way|Relation) (\d+)/);
    
    if (matches == null) {
        return;
    }
    
    var type = matches[1].toLowerCase();
    var id = Number(matches[2]);
    
    console.log("Removing building " + type + "/" + id + " from session");
    
    _session.removeBuilding(type, id);
    
    if (_session.currentIndex >= 0 && _session.currentIndex < _session.buildingCount) {
        var building = _session.getCurrentBuilding();
        displayBuildingPolygon(building);
        updateUi();
    } else {
        loadAndDisplayNewBuilding();
    }

    markBuildingAsOutdatedAndRelease(type, id);
}

function markBuildingAsOutdatedAndRelease(buildingType, buildingId, callback) {
    BuildingService.markAsOutdated(buildingType, buildingId, function() {
        console.log("building " + buildingType + "/" + buildingId + " marked as outdated");

        releaseBuilding(buildingType, buildingId, callback);
    });
}

function releaseBuilding(buildingType, buildingId, callback) {
    BuildingService.releaseBuilding(_session.id, buildingType, buildingId, function() {
        _session.removeBuilding(buildingType, buildingId);
        console.log("building " + buildingType + "/" + buildingId + " released");

        if (defined(callback)) {
            callback();
        }
    });
}

document.getElementById('upload-changes').onclick = function() {
    if (!defined(_session.changesetId)) {
        createChangeset(uploadChanges);
    } else {
        uploadChanges();
    }
};

function showMessage(messageKey) {
    var parameters = [];
    for (var i = 1; i < arguments.length; i++) {
        parameters.push(arguments[i]);
    }

    var message = _localizer.getText(messageKey, parameters);
    $("#message-popup").find('#message').text(message);
    $("#message-popup").modal('show');
}

function addKeyboardShortcut(key, conditions, action) {
    keyboardJS.bind(key, function(e) {
        for (var i = 0; i < conditions.length; i++) {
            if (!conditions[i]()) {
                return true;
            }
        }
        
        action(e);

        return false;
    });
}

function init() {
    console.log("RoofMapper " + VERSION + ", environment: " + ENV);
    
    _map = L.map('map');
    
    var bingKey = 'AlCYN3W0pAkcnVgUrS9Jb4Wkmoa_3WCGtD72BGvpzaYxAgjz0VEv5_5OalHYb3k5';
    L.tileLayer.bing(bingKey).addTo(_map);
    
    _map.setView([46.935, 2.780], 7);
    
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
    
    _loadingStatus.addListener(updateUi);
    
    $('input[type=radio][name=tag-selection]').change(function() {
        if (defined(_session.currentBuilding)) {
            var value = this.value === 'undefined' ? undefined : this.value;
            _session.setBuildingRoofMaterial(_session.currentBuilding, value);
            updateUi();
        }
    });
    
    var sessionOpened = function() { return _session.open; };
    var isNotLoading = function() { return !_loadingStatus.isLoading; };
    var buildingDisplayed = function() { return defined(_session.currentBuilding); };
    var isNotAtFirstBuilding = function() { return _session.currentIndex > 0; };
    var nextBuildingIsAvailable = function() { return !(_session.currentIndex == _session.buildingCount - 1 && (_session.full || _session.changesetIsFull)); };
    addKeyboardShortcut('backspace', [ isNotLoading, isNotAtFirstBuilding ], displayPreviousBuilding);
    addKeyboardShortcut('space', [ isNotLoading, sessionOpened, nextBuildingIsAvailable ], displayNextBuilding);
    
    var addRoofMaterialKeyboardShortcut = function(key, material) {
        addKeyboardShortcut(key, [ isNotLoading, buildingDisplayed ], function() { $("#tag-" + material).prop("checked", true).trigger('change'); });
    };
    addRoofMaterialKeyboardShortcut('numzero', 'undefined');
    addRoofMaterialKeyboardShortcut('numone', 'roof_tiles');
    addRoofMaterialKeyboardShortcut('numtwo', 'slate');
    addRoofMaterialKeyboardShortcut('numthree', 'metal');
    addRoofMaterialKeyboardShortcut('numfour', 'copper');
    addRoofMaterialKeyboardShortcut('numfive', 'concrete');
    addRoofMaterialKeyboardShortcut('numsix', 'glass');
    addRoofMaterialKeyboardShortcut('numseven', 'tar_paper');
    addRoofMaterialKeyboardShortcut('numeight', 'eternit');
    addRoofMaterialKeyboardShortcut('numnine', 'gravel');
    
    updateConnectionStatusDisplay();
    updateUi();

    // avoid a situation where the map is partially loaded
    setTimeout(function() { _map.invalidateSize() }, 1);

    $("#fullscreen-button").click(function() {
        $(document).toggleFullScreen();
    });

    $('#language-en-button').click(function() {
        _localizer.language = 'en';
    })

    $('#language-fr-button').click(function() {
        _localizer.language = 'fr';
    })
    
    if (!_api.authenticated) {
        $("#about-popup").modal('show');
    }
}

init();