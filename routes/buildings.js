'use strict';

var defined = require('../defined');
var express = require('express');
var router = express.Router();

var buildingManager = require('../buildingmanager');

router.put('/:type(way|relation)/:id(\\d+)/invalidate', function(req, res, next) {
    var buildingType = req.params.type;
    var buildingId = parseInt(req.params.id);
    var invalidityReason = req.body.reason;

    if (invalidityReason === undefined || invalidityReason === '') {
        res.status(400).json({ error: "no invalidity reason given" });
        return;
    }

    buildingManager.markBuildingAsInvalid(buildingType, buildingId, invalidityReason, function(status, response) {
        res.status(status).json(response);
    });
});

module.exports = router;