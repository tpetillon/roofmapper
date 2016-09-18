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

router.put('/clear', function(req, res, next) {
    var sessionId = parseInt(req.query.session_id);
    var userId = parseInt(req.query.user_id);
    
    if (!defined(sessionId) || isNaN(sessionId)) {
        res.status(400).json({ error: "'session_id' parameter absent or badly formed" });
        return;
    }
    if (!defined(userId) || isNaN(userId)) {
        res.status(400).json({ error: "'user_id' parameter absent or badly formed" });
        return;
    }

    if (!sessionManager.hasOpenSession(sessionId, userId)) {
        res.status(400).json({ error: "session " + sessionId + " is not an open session for user " + userId });
        return;
    }

    var session = sessionManager.getSession(sessionId);
    
    sessionManager.releaseSessionBuildings(session, function(status, response) {
        res.status(status).json(response);
    })
});

router.put('/close', function(req, res, next) {
    var sessionId = parseInt(req.body.session_id);
    var userId = parseInt(req.body.user_id);
    
    if (!defined(sessionId) || isNaN(sessionId)) {
        res.status(400).json({ error: "'session_id' parameter absent or badly formed" });
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
