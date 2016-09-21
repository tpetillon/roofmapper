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
    var sessionToken = req.query.session_token;
    
    if (!defined(sessionToken)) {
        res.status(400).json({ error: "'session_token' parameter absent" });
        return;
    }
    
    var session = sessionManager.getSession(sessionToken);

    if (!defined(session)) {
        res.status(400).json({ error: "no active session associated to token " + sessionToken });
        return;
    }
    
    sessionManager.releaseSessionBuildings(session, function(status, response) {
        res.status(status).json(response);
    })
});

router.put('/close', function(req, res, next) {
    var sessionToken = req.query.session_token;
    
    if (!defined(sessionToken)) {
        res.status(400).json({ error: "'session_token' parameter absent" });
        return;
    }
    
    var session = sessionManager.getSession(sessionToken);

    if (!defined(session)) {
        res.status(400).json({ error: "no active session associated to token " + sessionToken });
        return;
    }
    
    sessionManager.closeSession(session, function(status, response) {
        res.status(status).json(response);
    });
});

module.exports = router;
