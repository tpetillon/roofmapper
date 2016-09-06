var defined = require('../defined');
var express = require('express');
var router = express.Router();

var dbPool = require('../dbpool');

router.put('/create', function(req, res, next) {
    var userId = parseInt(req.body.user_id);
    
    if (!defined(userId) || isNaN(userId)) {
        res.status(400).json({ error: "'user_id' parameter absent or badly formed" });
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
                res.status(403).json({ error: "a session is already open for user id " + userId });
                return;
            }
            
            client.query('INSERT INTO sessions VALUES (DEFAULT, $1::integer, DEFAULT, NULL) RETURNING *', [ userId ], function(err, result) {
                done();

                if (err) {
                    res.status(500).json({ message: 'error running query: ' + err });
                    return;
                }
                
                res.json({ session_id: Number(result.rows[0].id) });
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
            
            res.json({ message: 'session closed' });
        });
    });
});

module.exports = router;
