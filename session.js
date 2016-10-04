'use strict';

var defined = require('./defined');

const MAX_SESSION_SIZE =  1000;
const MAX_CHANGES_PER_CHANGESET = 50000;

function Session() {
    this._sessionId = undefined;
    this._buildings = [];
    this._currentIndex = -1;
    this._taggedBuildingCount = 0;
    this._uploadedBuildingCount = 0;
    this._changesetId = undefined;
}

Object.defineProperties(Session.prototype, {
    open : {
        get : function() {
            return defined(this._sessionId);
        }
    },
    id : {
        get : function() {
            return this._sessionId;
        },
        set : function(value) {
            this._sessionId = value;
        }
    },
    currentIndex : {
        get : function() {
            return this._currentIndex;
        },
        set : function(value) {
            if (value !== this._currentIndex && value >= 0 && value < this._buildings.length) {
                this._currentIndex = value;
            }
        }
    },
    currentBuilding : {
        get : function() {
            if (this._currentIndex >= 0) {
                return this._buildings[this._currentIndex];
            } else {
                return undefined;
            }
        }
    },
    buildingCount : {
        get : function() {
            return this._buildings.length;
        }
    },
    full : {
        get : function() {
            return this._buildings.length >= MAX_SESSION_SIZE;
        }
    },
    taggedBuildingCount : {
        get : function() {
            return this._taggedBuildingCount;
        }
    },
    uploadedBuildingCount : {
        get : function() {
            return this._uploadedBuildingCount;
        }
    },
    changesetId : {
        get : function() {
            return this._changesetId;
        },
        set : function(value) {
            this._changesetId = value;
            this._uploadedBuildingCount = 0;
        }
    },
    changesetIsFull : {
        get : function() {
            // count every potentially uploadable building
            return this._uploadedBuildingCount + this._buildings.length > MAX_CHANGES_PER_CHANGESET;
        }
    }
});

Session.prototype.addBuilding = function(building, setAsCurrentIndex) {
    if (this.changesetIsFull) {
        return;
    }
    
    this._buildings.push(building);
    
    if (setAsCurrentIndex === true) {
        this._currentIndex = this._buildings.length - 1;
    }
};

Session.prototype.getBuilding = function(index) {
    return this._buildings[index];
}

Session.prototype.getCurrentBuilding = function() {
    if (this._currentIndex !== -1) {
        return this._buildings[this._currentIndex];
    }
    
    return undefined;
}

Session.prototype.setBuildingRoofMaterial = function(building, roofMaterial) {
    var previousRoofMaterial = building.roofMaterial;
    
    building.roofMaterial = roofMaterial;
    
    if (!defined(previousRoofMaterial) && defined(roofMaterial)) {
        this._taggedBuildingCount++;
    } else if (defined(previousRoofMaterial) && !defined(roofMaterial)) {
        this._taggedBuildingCount--;
    }
}

Session.prototype.toOsmChange = function() {
    if (!defined(this._changesetId)) {
        return '';
    }
    
    var changesetId = this._changesetId;
    
    var xml = '';
    
    xml += '<osmChange version="0.6">';
    
    this._buildings.forEach(function(building) {
        xml += building.toOsmChange(changesetId);
    });
    
    xml += '</osmChange>';
    
    return xml;
};

Session.prototype.toTagData = function() {
    if (!defined(this._changesetId)) {
        return {};
    }

    var tagData = [];

    this._buildings.forEach(function(building) {
        if (defined(building.roofMaterial)) {
            tagData.push({
                type : building.type,
                id : building.id,
                roof_material : building.roofMaterial
            });
        }
    });
    
    return {
        changeset_id : this._changesetId,
        tag_data : tagData
    };
};

Session.prototype.removeBuilding = function(type, id) {
    if (this._currentIndex < 0) {
        return;
    }
    
    for (var i = 0; i < this._buildings.length; i++) {
        var building = this._buildings[i];
        if (building.type === type && building.id === id) {
            this._buildings.splice(i, 1);
            
            if (defined(building.roofMaterial)) {
                this._taggedBuildingCount--;
            }
            
            if (this._currentIndex >= i) {
                this._currentIndex--;
            }
            
            return;
        }
    }
};

Session.prototype.clearTaggedBuildings = function() {
    var buildingCountBefore = this._buildings.length;
    
    this._buildings = this._buildings.filter(function(building) {
        return !defined(building.roofMaterial);
    });
    
    this._currentIndex = this._buildings.length - 1;
    this._taggedBuildingCount = 0;
    this._uploadedBuildingCount += buildingCountBefore - this._buildings.length;
};

module.exports = Session;