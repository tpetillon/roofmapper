'use strict';

var defined = require('../defined');
var express = require('express');
var router = express.Router();

var dbPool = require('../dbpool');
var Session = require('../session');
var activeSessions = require('../activesessions');

router.put('/create', function(req, res, next) {
    var userId = parseInt(req.body.user_id);
    
    if (!defined(userId) || isNaN(userId)) {
        res.status(400).json({ error: "'user_id' parameter absent or badly formed" });
        return;
    }
    
    if (activeSessions.hasForUser(userId)) {
        res.status(403).json({ error: "a session is already open for user id " + userId });
        return;
    }
    
    dbPool.connect(function(err, client, done) {
        if (err) {
            res.status(503).json({ message: 'error fetching client from pool: ' + err });
            return;
        }
        
        client.query('SELECT id FROM sessions WHERE user_id=$1::integer AND end_date IS NULL', [ userId ], function(err, result) {
            if (err) {
                done();
                res.status(500).json({ message: 'error running query: ' + err });
                return;
            }
            
            if (result.rowCount != 0) {
                done();
                console.error("An open session was present in the database for user " + userId);
                res.status(403).json({ error: "a session is already open for user id " + userId });
                return;
            }
            
            client.query('INSERT INTO sessions VALUES (DEFAULT, $1::integer, DEFAULT, NULL) RETURNING *', [ userId ], function(err, result) {
                done();

                if (err) {
                    res.status(500).json({ message: 'error running query: ' + err });
                    return;
                }
                
                var row = result.rows[0];
                var session = new Session(row.id, row.user_id, row.start_date);
                activeSessions.add(session);
                
                console.log("opening session " + session.id + " for user " + session.userId);
                
                res.json({ session_id: session.id, start_date: session.startDate });
            });
        });
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
    
    if (!activeSessions.has(sessionId)) {
        res.status(400).json({ error: "session " + sessionId + " is not an open session for user " + userId });
        return;
    }
    
    var session = activeSessions.get(sessionId);
    
    if (session.userId != userId) {
        res.status(400).json({ error: "session " + sessionId + " is not an open session for user " + userId });
        return;
    }
    
    dbPool.connect(function(err, client, done) {
        if (err) {
            res.status(503).json({ message: 'error fetching client from pool: ' + err });
            return;
        }
        
        client.query('UPDATE sessions SET end_date = now() WHERE id=$1::integer AND user_id=$2::integer AND end_date IS NULL', [ sessionId, userId ], function(err, result) {
            done();

            if (err) {
                res.status(500).json({ message: 'error running query: ' + err });
                return;
            }
            
            activeSessions.remove(sessionId);
            
            console.log("closing session " + sessionId + " for user " + userId);
            
            res.json({ message: 'session closed' });
        });
    });
});

module.exports = router;
