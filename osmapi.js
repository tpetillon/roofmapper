'use strict';

var osmAuth = require('osm-auth');

function OsmApi() {
    this._auth = osmAuth({
        oauth_consumer_key: 'aF9d6GToknMHKvU7KLo208XCMaHxPo2EtyMxgLtd',
        oauth_secret: '0QrDWTZMCG0IYFnm92iq045HTzv26p1QzwhhItaV',
        auto: true, // show a login form if the user is not authenticated and
                   // you try to do a call
        landing: "/land.html"
    });
}

Object.defineProperties(OsmApi.prototype, {
    authenticated : {
        get : function() {
            return this._auth.authenticated();
        }
    }
});

OsmApi.prototype.logout = function() {
    this._auth.logout();
};

OsmApi.prototype.request = function(url, method, callback) {
    this._auth.xhr({
        method: method,
        path: url
    }, callback);
};

module.exports = OsmApi;