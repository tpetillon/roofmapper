'use strict';

var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
    res.status(501).json({ error: 'service not implemented' });
});

module.exports = router;
