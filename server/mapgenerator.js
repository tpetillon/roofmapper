'use strict';

var async = require('async');
var config = require('config');
var dateTime = require('node-datetime');
var dbPool = require('./dbpool');
var defined = require('./defined');
var fs = require('fs');
var mapnik = require('mapnik');
var path = require('path');
var schedule = require('node-schedule');

// register fonts and datasource plugins
mapnik.register_default_fonts();
mapnik.register_default_input_plugins();

function fetchDataFromDatabase(callback) {
    dbPool.connect(function(err, client, done) {
        if (err) {
            callback('error fetching client from pool: ' + err);
            return;
        }

        var query =
            "SELECT grid.id, grid.name, buildings.roof_material, count(DISTINCT buildings.id), ST_AsGeoJSON(grid.geom) as geometry \
            FROM france_grid AS grid, buildings \
            WHERE buildings.roof_material IS NOT NULL \
            AND ST_Contains(grid.geom, buildings.location) \
            GROUP BY grid.id, grid.name, grid.geom, buildings.roof_material \
            ORDER BY count DESC;"
        
        client.query(query, [], function(err, result) {
            done();

            if (err) {
                console.error('error running query: ' + err);
                callback(err);
                return;
            }

            var cells = new Map();

            for (var i = 0; i < result.rowCount; i++) {
                var row = result.rows[i];
                var cellId = Number(row.id);
                var geometry = row.geometry;
                var roofMaterial = row.roof_material;
                var count = Number(row.count);

                if (!cells.has(cellId)) {
                    cells.set(cellId, {
                        id: cellId,
                        geometry: geometry,
                        roofMaterials: []
                    });
                }

                cells.get(cellId).roofMaterials.push({
                    roofMaterial: roofMaterial,
                    count: count
                });
            }

            for (var [cellId, cell] of cells) {
                var totalCount = 0;
                var otherCount = 0;
                for (var i = 0; i < cell.roofMaterials.length; i++) {
                    var materialEntry = cell.roofMaterials[i];
                    totalCount += materialEntry.count;

                    if (materialEntry.roofMaterial !== 'roof_tiles' && materialEntry.roofMaterial !== 'slate') {
                        otherCount += materialEntry.count;
                    }
                }
                cell.totalCount = totalCount;

                if (otherCount > 0) {
                    cell.roofMaterials.push({
                        roofMaterial: 'other',
                        count: otherCount
                    });
                }
                
                cell.roofMaterials.sort(function (a, b) {
                    return a.count - b.count;
                });
            }

            callback(undefined, cells);
        });
    });
}
function generateTopMaterialGeoJson(cells) {
    var geojson = {
        type: 'FeatureCollection',
        features: []
    };

    for (var [cellId, cell] of cells) {
        var roofMaterial = undefined;
        var count = 0;
        if (cell.roofMaterials.length > 0) {
            roofMaterial = cell.roofMaterials[0].roofMaterial;
            count = cell.roofMaterials[0].count;
        }

        var feature = {
            type: 'Feature',
            geometry: JSON.parse(cell.geometry),
            properties: {
                totalCount: cell.totalCount,
                roofMaterial: roofMaterial,
                count: count,
                ratio: count / cell.totalCount
            }
        };

        geojson.features.push(feature);
    }

    return geojson;
}

function generateOneMaterialGeoJson(cells, roofMaterial) {
    var geojson = {
        type: 'FeatureCollection',
        features: []
    };

    for (var [cellId, cell] of cells) {
        var count = 0;
        for (var i = 0; i < cell.roofMaterials.length; i++) {
            var entry = cell.roofMaterials[i];
            if (entry.roofMaterial === roofMaterial) {
                count = entry.count;
                break;
            }
        }

        var feature = {
            type: 'Feature',
            geometry: JSON.parse(cell.geometry),
            properties: {
                totalCount: cell.totalCount,
                roofMaterial: roofMaterial,
                count: count,
                ratio: count / cell.totalCount
            }
        };

        geojson.features.push(feature);
    }

    return geojson;
}

function addDate(map, position) {
    var dt = dateTime.create();
    var formattedDate = dt.format('Y-m-d H:M:S');

    var dateGeojson = {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: position
                },
                properties: {
                    name: formattedDate
                }
            }
        ]
    };
    var dateDatasource = new mapnik.Datasource({
        type: 'geojson',
        inline: JSON.stringify(dateGeojson)
    });
    var dateLayer = new mapnik.Layer('date');
    dateLayer.srs = '+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs';
    dateLayer.styles = [ 'date' ];
    dateLayer.datasource = dateDatasource;
    map.add_layer(dateLayer);
}

function makeMap(geojson, width, height, outputPaths, callback) {
    var map = new mapnik.Map(width, height);
    map.load(path.join(__dirname, '../data/francemap.xml'), function(err, map) {
        if (err) {
            callback(err);
            return;
        }

        var datasource = new mapnik.Datasource({
            type: 'geojson',
            inline: JSON.stringify(geojson)
        });

        var layer = new mapnik.Layer('grid');
        layer.srs = '+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs';
        layer.styles = [ 'grid-roofMaterial' ];

        layer.datasource = datasource;

        map.add_layer(layer);

        addDate(map, [ -5, 42 ]);

        map.zoomAll();

        var image = new mapnik.Image(width, height);
        map.render(image, function(err, image) {
            if (err) {
                callback(err);
            }

            image.encode('png', function(err, buffer) {
                if (err) {
                    callback(err);
                }

                async.eachSeries(outputPaths, function(outputPath, next) {
                    fs.writeFile(outputPath, buffer, function(err) {
                        if (err) {
                            next(err);
                        }
                        
                        console.log('Saved map image to', outputPath);
                        next();
                    });
                }, function done() {
                    callback();
                });
            });
        });
    });
}

function generateMaps(callback) {
    fetchDataFromDatabase(function(error, cells) {
        if (error) {
            console.error(error);
            callback(error);
            return;
        }

        var dt = dateTime.create();
        var formattedDate = dt.format('Y-m-d-H-M-S');

        var width = config.get('maps.width');
        var height = config.get('maps.height');

        var outputDir = config.get('maps.directory');
        
        var topMaterialGeoJson = generateTopMaterialGeoJson(cells);

        var topMaterialOutputPaths = [
            path.join(outputDir, 'top-' + formattedDate + '.png'),
            path.join(outputDir, 'top-latest.png')
        ];

        makeMap(topMaterialGeoJson, width, height, topMaterialOutputPaths, function(error) {
            if (error) {
                console.error(error);
                callback(error);
                return;
            }

            var roofTilesGeoJson = generateOneMaterialGeoJson(cells, 'roof_tiles');
            
            var roofTilesOutputPaths = [
                path.join(outputDir, 'roof_tiles-' + formattedDate + '.png'),
                path.join(outputDir, 'roof_tiles-latest.png')
            ];
    
            makeMap(roofTilesGeoJson, width, height, roofTilesOutputPaths, function(error) {
                if (error) {
                    console.error(error);
                    callback(error);
                    return;
                }
    
                var slateGeoJson = generateOneMaterialGeoJson(cells, 'slate');
                
                var slateOutputPaths = [
                    path.join(outputDir, 'slate-' + formattedDate + '.png'),
                    path.join(outputDir, 'slate-latest.png')
                ];
        
                makeMap(slateGeoJson, width, height, slateOutputPaths, function(error) {
                    if (error) {
                        console.error(error);
                        callback(error);
                        return;
                    }
        
                    callback();
                });
            });
        });
    });
}

function MapGenerator() {
}

MapGenerator.prototype.generateMaps = function(callback) {
    generateMaps(function(error) {
        if (defined(callback)) {
            callback(error);
        }
    });
}

MapGenerator.prototype.scheduleMapGeneration = function() {
    var that = this;

    var rule = new schedule.RecurrenceRule();
    rule.hour = [ 0 ];
    rule.minute = 0;
    schedule.scheduleJob(rule, function() {
        that.generateMaps();
    });
}

var mapGenerator = new MapGenerator();

module.exports = mapGenerator;
