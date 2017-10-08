'use strict';

var defined = require('../defined');
var express = require('express');
var router = express.Router();

var buildingManager = require('../buildingmanager');

router.get('/:type(way|relation)/:id(\\d+)', function(req, res, net) {
    var buildingType = req.params.type;
    var buildingId = parseInt(req.params.id);

    buildingManager.getBuilding(buildingType, buildingId, function(status, response) {
        res.status(status).json(response);
    });
});

module.exports = router;