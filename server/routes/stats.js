'use strict';

var defined = require('../defined');
var express = require('express');
var router = express.Router();

var statsManager = require('../statsmanager');

router.get('/top', function(req, res, net) {
    statsManager.getTopUserStats(function(status, response) {
        res.status(status).json(response);
    });
});

router.get('/users/:id(\\d+)', function(req, res, net) {
    var userId = parseInt(req.params.id);

    statsManager.getOneUserStats(userId, function(status, response) {
        res.status(status).json(response);
    });
});

module.exports = router;