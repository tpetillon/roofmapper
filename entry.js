'use strict';

var $ = require('expose?$!expose?jQuery!jquery');
var L = require('leaflet');
var keyboardJS = require('keyboardjs');
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
$("body").append(require('html!./roofmaterialpopup.html'));
$("body").append(require('html!./invaliditypopup.html'));

var roofMaterialL10nKeys = {
    "roof_tiles" : "tiles",
    "slate" : "slate",
    "metal" : "metal",
    "copper" : "copper",
    "concrete" : "concrete",
    "glass" : "glass",
    "tar_paper" : "tar-paper",
    "eternit" : "eternit",
    "gravel" : "gravel",
    "grass" : "grass",
    "plants" : "plants",
    "stone" : "stone",
    "thatch" : "thatch"
};
var invalidityReasonL10nKeys = {
    "mark_as_invalid" : "mark-as-invalid",
    "multiple_materials" : "multiple-materials",
    "multiple_buildings" : "multiple-buildings",
    "building_fraction" : "building-fraction",
    "not_a_building" : "not-a-building",
};

var _localizer = new Localizer(document, [ enMessages, frMessages ]);
var _map = undefined;
var _recenterButton = undefined;
var _outlineButton = undefined;
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
        _outlineButton.enable();
    } else {
        _recenterButton.disable();
        _outlineButton.disable();
    }
    
    $(".tag-buttons").find("input").prop('disabled', loading || _session.currentIndex < 0);
    $("#invalidity-buttons").find("input").prop('disabled', loading || _session.currentIndex < 0);
    
    $("#upload-changes").prop(
        "disabled",
        loading || !_session.open || (_session.taggedBuildingCount <= 0 && _session.invalidatedBuildingCount <= 0));
    
    $(".tag-buttons").find("input")
        .prop("checked", false)
        .parent().removeClass("active");
    $("#invalidity-buttons").find("input")
        .prop("checked", false)
        .parent().removeClass("active");

    $("#tag-other-detail-span").hide();
    $("#tag-invalid-detail-span").hide();
    
    if (defined(_session.currentBuilding)) {
        var invalidityReason = _session.currentBuilding.invalidityReason;
        if (defined(invalidityReason)) {
            $("#tag-invalid")
                .prop("checked", true)
                .parent().addClass("active");
            $("#invalidity-" + invalidityReason)
                .prop("checked", true)
                .parent().addClass("active");
            
            $("#tag-invalid-detail-text").attr("l10n", invalidityReasonL10nKeys[invalidityReason]);
            $("#tag-invalid-detail-span").show();
        } else {
            var roofMaterial = _session.currentBuilding.roofMaterial;
            $("#tag-" + roofMaterial)
                .prop("checked", true)
                .parent().addClass("active");
            
            if (roofMaterial === "glass" || roofMaterial === "grass" ||
                roofMaterial === "plants" || roofMaterial === "stone" ||
                roofMaterial === "tar_paper" || roofMaterial === "thatch") {
                $("#tag-other")
                    .prop("checked", true)
                    .parent().addClass("active");
                
                $("#tag-other-detail-text").attr("l10n", roofMaterialL10nKeys[roofMaterial]);
                $("#tag-other-detail-span").show();
            }
        }
        
        $(".tag-buttons").find("input")
            .parent().removeClass("disabled");
    } else {
        $(".tag-buttons").find("input")
            .parent().addClass("disabled");
    }
    
    $("#tagged-building-count")
        .attr('l10n', 'n-buildings-tagged')
        .attr('l10n-params', JSON.stringify({ count: _session.taggedBuildingCount }));
    $("#uploaded-building-count")
        .attr('l10n', 'n-buildings-uploaded')
        .attr('l10n-params', JSON.stringify({ count: _session.uploadedBuildingCount }));

    if (_session.taggedBuildingCount > 0 || _session.invalidatedBuildingCount > 0) {
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
                        invalidateBuilding(building.type, building.id, 'outdated');
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
            
            _loadingStatus.removeSystem('changeset-creation');
            
            if (callback) {
                callback();
            }
        }
    });
}

function uploadTags(callback) {
    if (_session.taggedBuildingCount === 0) {
        if (callback) {
            callback();
        }
        return;
    }

    if (!defined(_session.changesetId)) {
        createChangeset(function () { uploadTags(callback); });
        return;
    }
    
    _loadingStatus.addSystem('changes-upload');

    var changeData = _session.toOsmChange();
    
    var url = '/api/0.6/changeset/' + _session.changesetId + '/upload';
    _api.requestWithData(url, 'POST', changeData, function(error, response) {
        if (defined(error)) {
            console.error("Changes upload error: " + error.responseText);
            
            if (error.statusText === "Conflict") {
                if (error.responseText.match(/was closed/)) {
                    // The changeset #id was closed at #closed_at.
                    console.log("The changeset " + _session.changesetId +
                        " has been closed, creating a new one.");
                    createChangeset(function() { uploadTags(callback); });
                } else if (error.responseText.match(/Version mismatch/)) {
                    // Version mismatch: Provided #ver_client, server had: #ver_serv of [Way|Relation] #id
                    removeBuildingInConflict(error.responseText);
                    
                    _loadingStatus.removeSystem('changes-upload');
                }
            }
        } else {
            console.log("Changes uploaded to OSM server");
            
            BuildingService.tagBuildings(_session.id, _session.toTagData(), function(error) {
                _loadingStatus.removeSystem('changes-upload');

                if (defined(error)) {
                    console.error("Could not upload tags to building service: " + error.responseText);
                } else {
                    console.log("Tags uploaded to building service");
                }

                _session.clearTaggedBuildings();
                destroyBuildingPolygon();

                if (callback) {
                    callback();
                }
            });
        }
    });
}

function uploadInvalidationData(callback) {
    if (_session.invalidatedBuildingCount === 0) {
        if (defined(callback)) {
            callback();
        }
        return;
    }

    _loadingStatus.addSystem('invalidation-data-upload');
    
    BuildingService.invalidateBuildings(_session.id, _session.toInvalidationData(), function(error) {
        _loadingStatus.removeSystem('invalidation-data-upload');

        if (defined(error)) {
            console.error("Could not upload invalidity reasons to building service: " + error.responseText);
        } else {
            console.log("Invalidity reasons uploaded to building service");
            showMessage("changes-uploaded-to-osm");
        }
        
        _session.clearInvalidatedBuildings();
        destroyBuildingPolygon();

        if (defined(callback)) {
            callback();
        }
    });
}

function uploadChanges() {
    if (_session.taggedBuildingCount > 0) {
        uploadTags(function() {
            uploadInvalidationData(loadAndDisplayNewBuilding);
        })
    } else {
        uploadInvalidationData(loadAndDisplayNewBuilding);        
    }
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

    invalidateBuilding(type, id, 'outdated');
}

function invalidateBuilding(buildingType, buildingId, reason, callback) {
    var invalidationData = [
        {
            type : buildingType,
            id : buildingId,
            invalidation_reason : reason
        }
    ];

    BuildingService.invalidate(_session.id, invalidationData, function() {
        console.log("building " + buildingType + "/" + buildingId + " invalidated because of \"" + reason + "\"");
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
    uploadChanges();
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

function recenterMapOnBuilding() {
    if (defined(_buildingPolygon)) {
        _map.fitBounds(_buildingPolygon.getBounds());
    }
}

function toggleBuildingOutline() {
    if (defined(_buildingPolygon)) {
        if (_map.hasLayer(_buildingPolygon)) {
            _map.removeLayer(_buildingPolygon);
        } else {
            _map.addLayer(_buildingPolygon);
        }
    }
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
    console.log('RoofMapper ' + VERSION + ', server: "' + OSM_SERVER_URL + '", auth method: ' + OSM_AUTH_METHOD);
    
    _map = L.map('map');
    
    var bingKey = 'AlCYN3W0pAkcnVgUrS9Jb4Wkmoa_3WCGtD72BGvpzaYxAgjz0VEv5_5OalHYb3k5';
    L.tileLayer.bing(bingKey).addTo(_map);
    
    _map.setView([46.935, 2.780], 7);
    
    _recenterButton = L.easyButton(
        'fa-crosshairs fa-lg',
        recenterMapOnBuilding,
        '', // title
        'recenter-button' // id
    );
    _recenterButton.addTo(_map);
    _recenterButton.disable();
    
    _outlineButton = L.easyButton(
        'fa-square-o fa-lg',
        toggleBuildingOutline,
        '', // title
        'outline-button' // id
    );
    _outlineButton.addTo(_map);
    _outlineButton.disable();
    
    // Set the title here and not in the button constructor because when set by
    // the constructor, the title is only displayable when the button is active.
    // With this alternative way its always displayable.
    $("#recenter-button").closest(".leaflet-control").attr("l10n-attr-title", "recenter-on-building");
    $("#outline-button").closest(".leaflet-control").attr("l10n-attr-title", "toggle-building-outline");
    
    _loadingStatus.addListener(updateUi);
    
    $('input[name=tag-selection]').change(function() {
        if (defined(_session.currentBuilding)) {
            if (this.value === 'invalid') {
                $("#invalidity-popup").modal('show');
            } else if (this.value === 'other') {
                $("#roof-material-popup").modal('show');
            } else if (this.checked) {
                var value = this.value === 'undefined' ? undefined : this.value;
                _session.setBuildingRoofMaterial(_session.currentBuilding, value);
                
                $("#roof-material-popup").modal('hide');
            }
            
            updateUi();
        }
    });
    $('input[type=radio][name=invalidity-selection]').change(function() {
        if (defined(_session.currentBuilding)) {
            _session.setBuildingInvalidityReason(_session.currentBuilding, this.value);
            updateUi();
        }

        $("#invalidity-popup").modal('hide');
    });
    
    var sessionOpened = function() { return _session.open; };
    var isNotLoading = function() { return !_loadingStatus.isLoading; };
    var buildingDisplayed = function() { return defined(_session.currentBuilding); };
    var isNotAtFirstBuilding = function() { return _session.currentIndex > 0; };
    var nextBuildingIsAvailable = function() { return !(_session.currentIndex == _session.buildingCount - 1 && (_session.full || _session.changesetIsFull)); };
    var roofMaterialPopupIsShown = function() { return $('#roof-material-popup').hasClass('in') };
    var roofMaterialPopupIsHidden = function() { return !$('#roof-material-popup').hasClass('in') };
    var invalidityPopupIsShown = function() { return $('#invalidity-popup').hasClass('in') };
    var invalidityPopupIsHidden = function() { return !$('#invalidity-popup').hasClass('in') };

    addKeyboardShortcut('backspace', [ isNotLoading, isNotAtFirstBuilding ], displayPreviousBuilding);
    addKeyboardShortcut('space', [ isNotLoading, sessionOpened, nextBuildingIsAvailable ], displayNextBuilding);

    addKeyboardShortcut('c', [ buildingDisplayed ], recenterMapOnBuilding);
    addKeyboardShortcut('b', [ buildingDisplayed ], toggleBuildingOutline);
    
    var addRoofMaterialKeyboardShortcut = function(key, material) {
        addKeyboardShortcut(
            key,
            [ isNotLoading, buildingDisplayed, roofMaterialPopupIsHidden, invalidityPopupIsHidden ],
            function() { $("#tag-" + material).prop("checked", true).trigger('change'); });
    };
    addRoofMaterialKeyboardShortcut('numzero', 'undefined');
    addRoofMaterialKeyboardShortcut('numone', 'roof_tiles');
    addRoofMaterialKeyboardShortcut('numtwo', 'slate');
    addRoofMaterialKeyboardShortcut('numthree', 'metal');
    addRoofMaterialKeyboardShortcut('numfour', 'copper');
    addRoofMaterialKeyboardShortcut('numfive', 'concrete');
    addRoofMaterialKeyboardShortcut('numsix', 'eternit');
    addRoofMaterialKeyboardShortcut('numseven', 'gravel');

    addKeyboardShortcut(
            'numeight',
            [ isNotLoading, buildingDisplayed, roofMaterialPopupIsHidden, invalidityPopupIsHidden ],
            function() { $("#roof-material-popup").modal('show'); }
    );

    addKeyboardShortcut(
            'numnine',
            [ isNotLoading, buildingDisplayed, roofMaterialPopupIsHidden, invalidityPopupIsHidden ],
            function() { $("#invalidity-popup").modal('show'); }
    );

    addKeyboardShortcut(
        'numzero',
        [ isNotLoading, buildingDisplayed, roofMaterialPopupIsShown ],
        function() { $("#roof-material-popup").modal('hide') });

    var addAdditionalRoofMaterialKeyboardShortcut = function(key, invalidityReason) {
        addKeyboardShortcut(
            key,
            [ isNotLoading, buildingDisplayed, roofMaterialPopupIsShown ],
            function() { $("#tag-" + invalidityReason).prop("checked", true).trigger('change'); });
    };
    addAdditionalRoofMaterialKeyboardShortcut('numone', 'glass');
    addAdditionalRoofMaterialKeyboardShortcut('numtwo', 'grass');
    addAdditionalRoofMaterialKeyboardShortcut('numthree', 'plants');
    addAdditionalRoofMaterialKeyboardShortcut('numfour', 'stone');
    addAdditionalRoofMaterialKeyboardShortcut('numfive', 'tar_paper');
    addAdditionalRoofMaterialKeyboardShortcut('numsix', 'thatch');

    addKeyboardShortcut(
        'numzero',
        [ isNotLoading, buildingDisplayed, invalidityPopupIsShown ],
        function() { $("#invalidity-popup").modal('hide') });

    var addInvalidityKeyboardShortcut = function(key, invalidityReason) {
        addKeyboardShortcut(
            key,
            [ isNotLoading, buildingDisplayed, invalidityPopupIsShown ],
            function() { $("#invalidity-" + invalidityReason).prop("checked", true).trigger('change'); });
    };
    addInvalidityKeyboardShortcut('numone', 'multiple_materials');
    addInvalidityKeyboardShortcut('numtwo', 'multiple_buildings');
    addInvalidityKeyboardShortcut('numthree', 'building_fraction');
    addInvalidityKeyboardShortcut('numfour', 'not_a_building');
    
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