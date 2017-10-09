'use strict';

var defined = require('../defined');
var express = require('express');
var router = express.Router();

var statsManager = require('../statsmanager');

router.get('/', function(req, res, net) {

    statsManager.getUserStats(function(status, response) {
        res.status(status).json(response);
    });
});

module.exports = router;