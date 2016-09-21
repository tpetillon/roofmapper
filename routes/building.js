'use strict';

var defined = require('../defined');
var express = require('express');
var router = express.Router();

var buildingManager = require('../buildingmanager');
var sessionManager = require('../sessionmanager');

router.get('/untagged', function(req, res, next) {
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

    buildingManager.getUntaggedBuilding(session, function(status, response) {
        res.status(status).json(response);
    });
});

router.post('/tag', function(req, res, next) {
    var sessionToken = req.body.session_token;
    var changesetId = parseInt(req.body.changeset_id);
    var tagData = req.body.tag_data;
    
    if (!defined(sessionToken)) {
        res.status(400).json({ error: "'session_token' parameter absent" });
        return;
    }
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
        res.status(400).json({ error: "no active session associated to token " + sessionToken });
        return;
    }

    buildingManager.tagBuildings(tagData, changesetId, session, function(status, response) {
        res.status(status).json(response);
    });
});

module.exports = router;
