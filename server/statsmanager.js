'use strict';

var http = require('http');
var schedule = require('node-schedule');
var xml2js = require('xml2js');

var dbPool = require('./dbpool');

var maxUserCount = 1000;
var userNameRetrievalTimeout = 10000;

function getUserName(userId, callback) {
    var options = {
        hostname: 'www.openstreetmap.org',
        path: '/api/0.6/user/' + userId,
        method: 'GET'
    };

    var request = http.request(options, function(response) {
        var statusCode = response.statusCode;
        if (statusCode !== 200) {
            callback('Status ' + statusCode + ' while retrieving user name for id ' + userId);
            return;
        }

        response.on('data', function(data) {
            xml2js.parseString(data, function (err, parseResult) {
                if (err) {
                    callback(err);
                    return;
                }

                try {
                    var userName = parseResult.osm.user[0]['$'].display_name;
                    callback(undefined, userName);
                } catch (exception) {
                    callback(exception);
                }
            });
        });
    });
    
    request.on('error', function(err) {
        console.error('Error while retrieving user name for id ' + userId + ': ' + err);
        callback(err);
    });

    request.setTimeout(userNameRetrievalTimeout, function() {
        var message = 'Timeout while retrieving user name for id ' + userId;
        console.error(message);
        callback(message);
    });

    request.end();
}

function getUserNames(userIds, callback) {
    function getUserNameI(i, userNames) {
        getUserName(userIds[i], function(err, userName) {
            if (err) {
                console.warn(err);
                userNames.push(undefined);
            } else {
                userNames.push(userName);
            }

            if (i < userIds.length - 1) {
                getUserNameI(i + 1, userNames);
            } else {
                callback(undefined, userNames);
            }
        });
    };

    getUserNameI(0, []);
}

function StatsManager() {
    this._userStats = undefined;
}

StatsManager.prototype.getUserStats = function(callback) {
    callback(200, this._userStats);
};

StatsManager.prototype.updateUserStats = function() {
    console.log('Updating user stats...');

    var that = this;
    
    dbPool.connect(function(err, client, done) {
        if (err) {
            console.error('Error fetching client from pool: ' + err);
            return;
        }

        var query =
            "SELECT user_id, count(*) as tag_count \
            FROM buildings \
            INNER JOIN sessions ON buildings.session_id = sessions.id \
            WHERE session_id IS NOT NULL \
            GROUP BY user_id \
            ORDER BY tag_count DESC";

        client.query(query, [], function(err, userRankingResult) {
            if (err) {
                done();
                console.error('Error while updating user stats:', err);
                return;
            }
            
            // TODO It is probably possible to get the total count through
            // the first query, discarding the need for the second one.

            query =
                "SELECT count(*) as tag_count \
                FROM buildings \
                WHERE session_id IS NOT NULL";

            client.query(query, [], function(err, totalTagCountResult) {
                done();

                if (err) {
                    console.error('Error while updating user stats:', err);
                    return;
                }

                var userIds = [];
                for (var i = 0; i < userRankingResult.rowCount && i < maxUserCount; i++) {
                    userIds.push(userRankingResult.rows[i].user_id);
                }

                getUserNames(userIds, function(err, userNames) {
                    if (err) {
                        console.error('Error while updating user stats:', err);
                        return;
                    }
            
                    that._userStats = {
                        totalTaggedBuildingCount: totalTagCountResult.rows[0].tag_count,
                        userRanking: []
                    };
                    
                    for (var i = 0; i < userRankingResult.rowCount && i < maxUserCount; i++) {
                        that._userStats.userRanking.push({
                            id: userRankingResult.rows[i].user_id,
                            name: userNames[i],
                            taggedBuildingCount: userRankingResult.rows[i].tag_count
                        });
                    }

                    console.log('User stats updated successfully');
                });
            });
        });
    });
};

StatsManager.prototype.scheduleUserStatsUpdate = function() {
    var that = this;

    var rule = new schedule.RecurrenceRule();
    rule.hour = [ 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23 ];
    rule.minute = 0;
    schedule.scheduleJob(rule, function() {
        that.updateUserStats();
    });
};

var statsManager = new StatsManager();

module.exports = statsManager;