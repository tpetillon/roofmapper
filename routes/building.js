'use strict';

var defined = require('../defined');
var express = require('express');
var router = express.Router();

var buildingManager = require('../buildingmanager');
var sessionManager = require('../sessionmanager');

router.get('/untagged', function(req, res, next) {
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

    buildingManager.getUntaggedBuilding(sessionId, function(status, response) {
        res.status(status).json(response);
    });
});

router.post('/tag', function(req, res, next) {
    var sessionId = parseInt(req.body.session_id);
    var userId = parseInt(req.body.user_id);
    var changesetId = parseInt(req.body.changeset_id);
    var tagData = req.body.tag_data;
    
    if (!defined(sessionId) || isNaN(sessionId)) {
        res.status(400).json({ error: "'session_id' parameter absent or badly formed" });
        return;
    }
    if (!defined(userId) || isNaN(userId)) {
        res.status(400).json({ error: "'user_id' parameter absent or badly formed" });
        return;
    }
    if (!defined(changesetId) || isNaN(changesetId)) {
        res.status(400).json({ error: "'changeset_id' parameter absent or badly formed" });
        return;
    }
    if (!defined(tagData)) {
        res.status(400).json({ error: "'tag_data' parameter absent or badly formed" });
        return;
    }

    if (!sessionManager.hasOpenSession(sessionId, userId)) {
        res.status(400).json({ error: "session " + sessionId + " is not an open session for user " + userId });
        return;
    }

    buildingManager.tagBuildings(tagData, changesetId, sessionId, function(status, response) {
        res.status(status).json(response);
    });
});

module.exports = router;
