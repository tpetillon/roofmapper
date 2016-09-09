'use strict';

var defined = require('../defined');
var express = require('express');
var router = express.Router();

var sessionManager = require('../sessionmanager');

router.put('/open', function(req, res, next) {
    var userId = parseInt(req.body.user_id);
    
    if (!defined(userId) || isNaN(userId)) {
        res.status(400).json({ error: "'user_id' parameter absent or badly formed" });
        return;
    }

    sessionManager.openSession(userId, function(status, response) {
        res.status(status).json(response);
    });
});

router.put('/close', function(req, res, next) {
    var sessionId = parseInt(req.body.session_id);
    var userId = parseInt(req.body.user_id);
    
    if (!defined(sessionId) || isNaN(sessionId)) {
        res.status(400).json({ error: "'sessionId' parameter absent or badly formed" });
        return;
    }
    if (!defined(userId) || isNaN(userId)) {
        res.status(400).json({ error: "'user_id' parameter absent or badly formed" });
        return;
    }
    
    sessionManager.closeSession(sessionId, userId, function(status, response) {
        res.status(status).json(response);
    });
});

module.exports = router;
