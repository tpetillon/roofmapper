'use strict';

var osmAuth = require('osm-auth');

function OAuthOsmApi() {
    this._auth = osmAuth({
        oauth_consumer_key: 'aF9d6GToknMHKvU7KLo208XCMaHxPo2EtyMxgLtd',
        oauth_secret: '0QrDWTZMCG0IYFnm92iq045HTzv26p1QzwhhItaV',
        auto: false,
        landing: "/land.html"
    });
}

Object.defineProperties(OAuthOsmApi.prototype, {
    authenticated : {
        get : function() {
            return this._auth.authenticated();
        }
    }
});

OAuthOsmApi.prototype.authenticate = function(callback) {
    this._auth.authenticate(callback);
};

OAuthOsmApi.prototype.logout = function() {
    this._auth.logout();
};

OAuthOsmApi.prototype.request = function(url, method, callback) {
    this._auth.xhr({
        method: method,
        path: url
    }, callback);
};

module.exports = OAuthOsmApi;