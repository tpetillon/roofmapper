'use strict';

var defined = require('../defined');
var express = require('express');
var router = express.Router();

var buildingManager = require('../buildingmanager');

router.put('/:type(way|relation)/:id(\\d+)/outdate', function(req, res, next) {
    var buildingType = req.params.type;
    var buildingId = parseInt(req.params.id);

    buildingManager.markAsOutdated(buildingType, buildingId, function(status, response) {
        res.status(status).json(response);
    });
});

module.exports = router;