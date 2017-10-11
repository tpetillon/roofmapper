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
        if (i >= userIds.length) {
            callback(undefined, userNames);
            return;
        }

        getUserName(userIds[i], function(err, userName) {
            if (err) {
                console.warn(err);
                userNames.push(undefined);
            } else {
                userNames.push(userName);
            }
            
            getUserNameI(i + 1, userNames);
        });
    };

    getUserNameI(0, []);
}

function StatsManager() {
    this._totalTaggedBuildingCount = 0;
    this._userRankings = [];
    this._rankingByUserId = new Map();
    this._usernamesById = new Map();
}

StatsManager.prototype.getTopUserStats = function(callback) {
    var userStats = {
        totalTaggedBuildingCount: this._totalTaggedBuildingCount,
        userRankings: []
    };
    
    for (var i = 0; i < this._userRankings.length && i < maxUserCount; i++) {
        var rankingEntry = this._userRankings[i];

        userStats.userRankings.push({
            id: rankingEntry.userId,
            name: rankingEntry.userName,
            rank: rankingEntry.rank + 1,
            taggedBuildingCount: rankingEntry.taggedBuildingCount
        });
    }

    callback(200, userStats);
};

StatsManager.prototype.getOneUserStats = function(userId, callback) {
    var rankingEntry = this._rankingByUserId.get(userId);

    if (rankingEntry === undefined) {
        callback(404);
        return;
    }

    var userStats = {
        id: rankingEntry.userId,
        name: rankingEntry.userName,
        rank: rankingEntry.rank + 1,
        taggedBuildingCount: rankingEntry.taggedBuildingCount
    };

    callback(200, userStats);
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
            WHERE changeset_id IS NOT NULL \
            GROUP BY user_id \
            ORDER BY tag_count DESC";

        client.query(query, [], function(err, userRankingResult) {
            if (err) {
                done();
                console.error('Error while updating user stats:', err);
                return;
            }
            
            // FIXME It is probably possible to get the total count through
            // the first query, discarding the need for the second one.

            query =
                "SELECT count(*) as tag_count \
                FROM buildings \
                WHERE changeset_id IS NOT NULL";

            client.query(query, [], function(err, totalTagCountResult) {
                done();

                if (err) {
                    console.error('Error while updating user stats:', err);
                    return;
                }
                
                var missingNameIds = [];

                for (var i = 0; i < userRankingResult.rowCount; i++) {
                    var row = userRankingResult.rows[i];
                    var userId = parseInt(row.user_id);

                    if (!that._usernamesById.has(userId)) {
                        missingNameIds.push(userId);
                    }
                }

                getUserNames(missingNameIds, function(err, userNames) {
                    if (!err) {
                        for (var i = 0; i < missingNameIds.length; i++) {
                            var userId = missingNameIds[i];
                            var userName = userNames[i];
                            
                            that._usernamesById.set(userId, userName);
                        }
                    } else {
                        console.error('Error while fetching names for user stats:', err);
                    }

                    that._totalTaggedBuildingCount = parseInt(totalTagCountResult.rows[0].tag_count);
                    that._userRankings = [];
                    that._rankingByUserId.clear();

                    for (var i = 0; i < userRankingResult.rowCount; i++) {
                        var row = userRankingResult.rows[i];
                        var userId = parseInt(row.user_id);
                        var taggedBuildingCount = parseInt(row.tag_count);
    
                        var rankingEntry = {
                            userId: userId,
                            taggedBuildingCount: taggedBuildingCount,
                            userName: that._usernamesById.get(userId)
                        };
    
                        that._rankingByUserId.set(userId, rankingEntry);
                        that._userRankings.push(rankingEntry);
                    }

                    that._userRankings.sort(function(a, b) {
                        if (a.taggedBuildingCount < b.taggedBuildingCount) {
                            return 1;
                        } else if (a.taggedBuildingCount > b.taggedBuildingCount) {
                            return -1;
                        } else {
                            return 0;
                        }
                    });

                    for (var i = 0; i < that._userRankings.length; i++) {
                        var rankingEntry = that._userRankings[i];

                        rankingEntry.rank = i;
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

StatsManager.prototype.incrementTaggedBuildingCount = function(userId, increment) {
    var rankingEntry = this._rankingByUserId.get(userId);

    if (rankingEntry === undefined) {
        rankingEntry = {
            id: userId,
            rank: this._userRankings.length,
            taggedBuildingCount: increment
        };

        var that = this;

        getUserName(userId, function(err, userName) {
            if (err) {
                console.error('Error while retrieving user name: ' + e);
                return;
            }

            rankingEntry.userName = userName;
            that._usernamesById.set(userId, userName);
        });
    } else {
        rankingEntry.taggedBuildingCount += increment;
    }

    while (rankingEntry.rank > 0) {
        var previousRanking = this._userRankings[rankingEntry.rank - 1];

        if (previousRanking.taggedBuildingCount < rankingEntry.taggedBuildingCount) {
            rankingEntry.rank--;
            previousRanking.rank++;

            this._userRankings[rankingEntry.rank] = rankingEntry.rank;
            this._userRankings[previousRanking.rank] = previousRanking.rank;
        } else {
            break;
        }
    }

    this._totalTaggedBuildingCount += increment;

    console.log('Rankings updated');
};

var statsManager = new StatsManager();

module.exports = statsManager;