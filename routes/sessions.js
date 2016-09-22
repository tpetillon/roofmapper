'use strict';

var defined = require('../defined');
var express = require('express');
var router = express.Router();

var buildingManager = require('../buildingmanager');
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

router.put('/:token/buildings/reserve', function(req, res, next) {
    var sessionToken = req.params.token;
    var session = sessionManager.getSession(sessionToken);

    if (!defined(session)) {
        res.status(400).json({ error: "no active session named " + sessionToken });
        return;
    }

    buildingManager.getUntaggedBuilding(session, function(status, response) {
        res.status(status).json(response);
    });
});

router.post('/:token/buildings/tag', function(req, res, next) {
    var sessionToken = req.params.token;
    var changesetId = parseInt(req.body.changeset_id);
    var tagData = req.body.tag_data;
    
    if (!defined(changesetId) || isNaN(changesetId)) {
        res.status(400).json({ error: "'changeset_id' parameter absent or badly formed" });
        return;
    }
    if (!defined(tagData)) {
        res.status(400).json({ error: "'tag_data' parameter absent" });
        return;
    }
    
    var session = sessionManager.getSession(sessionToken);

    if (!defined(session)) {
        res.status(400).json({ error: "no active session named " + sessionToken });
        return;
    }

    buildingManager.tagBuildings(tagData, changesetId, session, function(status, response) {
        res.status(status).json(response);
    });
});

router.put('/:token/buildings/clear', function(req, res, next) {
    var sessionToken = req.params.token;
    var session = sessionManager.getSession(sessionToken);

    if (!defined(session)) {
        res.status(400).json({ error: "no active session named " + sessionToken });
        return;
    }
    
    sessionManager.releaseSessionBuildings(session, function(status, response) {
        res.status(status).json(response);
    })
});

router.put('/:token/close', function(req, res, next) {
    var sessionToken = req.params.token;
    var session = sessionManager.getSession(sessionToken);

    if (!defined(session)) {
        res.status(400).json({ error: "no active session named " + sessionToken });
        return;
    }
    
    sessionManager.closeSession(session, function(status, response) {
        res.status(status).json(response);
    });
});

module.exports = router;
