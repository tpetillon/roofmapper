'use strict';

var $ = require('jquery');
var L = require('leaflet');

function Building(type, id, version) {
    this._type = type;
    this._id = id;
    this._version = version;
    
    this._polygon = undefined;
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
    }
});

Building.prototype.setData = function($data) {
    if (this.type === 'way') {
        var ways = extractWays($data);
        var positions = ways[Object.keys(ways)[0]];
        this._polygon = L.polygon(positions)
    } else if (this.type === 'relation') {
        var relation = extractRelation($data);
        var polygons = [];
        for (var i = 0; i < relation.outer.length; i++) {
            polygons.push([relation.outer[i]].concat(relation.inner));
        }
        this._polygon = L.multiPolygon(polygons)
    } else {
        throw 'Unsupported building type: ' + type;
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

module.exports = Building;