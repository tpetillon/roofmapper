'use strict';

var $ = require('jquery');
var L = require('leaflet');
var defined = require('./defined');

var roofMaterials = [
    'roof_tiles',
    'slate',
    'metal',
    'copper',
    'concrete',
    'glass',
    'tar_paper',
    'eternit',
    'gravel',
    'grass',
    'plants',
    'stone',
    'thatch'
];

var invalidityReasons = [
    //'outdated',
    'multiple_materials',
    'multiple_buildings',
    'building_fraction',
    'not_a_building'
];

function Building(type, id, version) {
    this._type = type;
    this._id = id;
    this._version = version;
    this._tags = [];
    this._nodes = []; // for ways
    this._members = []; // for relations
    
    this._polygon = undefined;
    this._roofMaterial = undefined;
    this._invalidityReason = undefined;
}

Object.defineProperties(Building.prototype, {
    type : {
        get : function() {
            return this._type;
        }
    },
    id : {
        get : function() {
            return this._id;
        }
    },
    version : {
        get : function() {
            return this._version;
        }
    },
    polygon : {
        get : function() {
            return this._polygon;
        }
    },
    roofMaterial : {
        get : function() {
            return this._roofMaterial;
        },
        set : function(material) {
            if (!defined(material) || roofMaterials.indexOf(material) != -1) {
                this._roofMaterial = material;
                this._invalidityReason = undefined;
            } else {
                throw "Invalid roof material: " + material;
            }
        }
    },
    invalidityReason : {
        get : function() {
            return this._invalidityReason;
        },
        set : function(reason) {
            if (!defined(reason) || invalidityReasons.indexOf(reason) != -1) {
                this._invalidityReason = reason;
                this._roofMaterial = undefined;
            } else {
                throw "Invalid invalidity reason: " + reason;
            }
        }
    }
});

Building.prototype.setData = function($data) {
    if (this.type === 'way') {
        var ways = extractWays($data);
        var positions = ways[Object.keys(ways)[0]].map(function(node) { return node.position; });
        this._polygon = L.polygon(positions);
        this._nodes = ways[Object.keys(ways)[0]].map(function(node) { return node.nodeId; });
        this._tags = extractTags($data.children("osm").children("way"));
    } else if (this.type === 'relation') {
        var relation = extractRelation($data);
        var polygons = [];
        for (var i = 0; i < relation.outer.length; i++) {
            polygons.push([relation.outer[i]].concat(relation.inner));
        }
        this._polygon = L.polygon(polygons);
        this._members = relation.members;
        this._tags = extractTags($data.children("osm").children("relation"));
    } else {
        throw 'Unsupported building type: ' + type;
    }
    
    for (var i = 0; i < this._tags.length; i++) {
        var tag = this._tags[i];
        if (tag.k === "roof:material") {
            this._roofMaterial = tag.v;
            this._tags.splice(i, 1);
            break;
        }
    }
};

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
            return {
                nodeId : id_,
                position : nodes[id_]
            };
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
        var wayPositions = way.map(function(node) { return node.position; });
        
        if (role === "outer") {
            outerWays.push(wayPositions);
        } else if (role === "inner") {
            innerWays.push(wayPositions);
        }
    });
    
    var members = $data.children("osm").children("relation").children("member").map(function() {
        return {
            type : $(this).attr("type"),
            ref : Number($(this).attr("ref")),
            role : $(this).attr("role")
        }
    }).toArray();
    
    return {
        outer : outerWays,
        inner : innerWays,
        members : members
    };
}

function extractTags($object) {
    return $object.children("tag").map(function() {
        return {
            k : $(this).attr("k"),
            v : $(this).attr("v")
        };
    }).toArray();
}

Building.prototype.toOsmChange = function(changesetId) {
    if (!defined(this._roofMaterial)) {
        return '';
    }
    
    var xml = '';
    xml += '<modify>';
    xml += '<' + this._type + ' id="' + this._id + '" changeset="' + changesetId + '" version="' + this._version + '">';
    
    if (this._type === "way") {
        this._nodes.forEach(function(nodeId) {
            xml +=  '<nd ref="' + nodeId + '" />';
        });
    } else if (this._type === "relation") {
        this._members.forEach(function(member) {
            xml +=  '<member type="' + member.type + '" ref="' + member.ref + '" role="' + member.role + '" />';
        });
    }
    
    this._tags.forEach(function(tag) {
        xml += '<tag k="' + tag.k + '" v="' + tag.v + '" />';
    });
    
    xml += '<tag k="roof:material" v="' + this._roofMaterial + '" />';
    
    xml += '</' + this._type + '>';
    xml += '</modify>';
    
    return xml;
};

module.exports = Building;