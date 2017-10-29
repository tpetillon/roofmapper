'use strict';

var config = require('config');
var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var serveIndex = require('serve-index');
var serveStatic = require('serve-static');

var sessionRoutes = require('./routes/sessions');
var buildingRoutes = require('./routes/buildings');
var statsRoutes = require('./routes/stats');

var sessionManager = require('./sessionmanager');
var statsManager = require('./statsmanager');

var mapGenerator = require('./mapgenerator');

console.log('RoofMapper server, version', process.env.npm_package_version);

var app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.set('view engine', 'pug')

app.use(express.static(path.join(__dirname, 'public')));

app.use('/sessions', sessionRoutes);
app.use('/buildings', buildingRoutes);
app.use('/stats', statsRoutes);

app.use('/stats/archive', serveIndex(config.get('stats.directory'), { 'icons': true }));
app.use('/stats/archive', serveStatic(config.get('stats.directory')));

app.get('/maps', function(req, res) {
    res.render('maps', {});
});
app.use('/maps', serveStatic(config.get('maps.directory')));
app.use('/maps/archive', serveIndex(config.get('maps.directory'), { 'icons': true }));
app.use('/maps/archive', serveStatic(config.get('maps.directory')));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.json({
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.json({
        message: err.message,
        error: {}
    });
});

sessionManager.closeOpenSessions();
sessionManager.scheduleSessionClosing();

statsManager.updateUserStats();
statsManager.scheduleUserStatsUpdate();
statsManager.scheduleStatsWritingToDisk();

mapGenerator.scheduleMapGeneration();

module.exports = app;
