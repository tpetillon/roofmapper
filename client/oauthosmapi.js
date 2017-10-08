'use strict';

var defined = require('./defined');
var osmAuth = require('osm-auth');

function OAuthOsmApi() {
    this._auth = osmAuth({
        url: OSM_SERVER_URL,
        oauth_consumer_key: 'aF9d6GToknMHKvU7KLo208XCMaHxPo2EtyMxgLtd',
        oauth_secret: '0QrDWTZMCG0IYFnm92iq045HTzv26p1QzwhhItaV',
        auto: false,
        landing: "/land.html"
    });
    
    this._username = undefined;
    this._userId = undefined;
}

Object.defineProperties(OAuthOsmApi.prototype, {
    authenticated : {
        get : function() {
            return this._auth.authenticated();
        }
    },
    connected : {
        get : function() {
            return defined(this._userId);
        }
    },
    url : {
        get : function() {
            return this._auth.options().url;
        }
    },
    username : {
        get : function() {
            return this._username;
        }
    },
    userId : {
        get : function() {
            return this._userId;
        }
    }
});

OAuthOsmApi.prototype.authenticate = function(callback) {
    var that = this;
    
    this._auth.authenticate(function() { that.connect(callback); });
};

OAuthOsmApi.prototype.connect = function(callback) {
    var that = this;
    
    this.request('/api/0.6/user/details', 'GET', function(error, details) {
        if (defined(error)) {
            console.log("could not connect: " + error.responseText);            
            
            if (defined(callback)) {
                callback(error);
            }
            
            return;
        }
        
        var u = details.getElementsByTagName('user')[0];
        that._username = u.getAttribute('display_name');
        that._userId = u.getAttribute('id');
    
        if (defined(callback)) {
            callback();
        }
    });
};

OAuthOsmApi.prototype.logout = function() {
    this._auth.logout();
    
    this._username = undefined;
    this._userId = undefined;
};

OAuthOsmApi.prototype.request = function(url, method, callback, contentType, data) {
    var header = {};
    header['Content-Type'] = contentType;

    this._auth.xhr({
        method: method,
        path: url,
        content : data,
        options : {
            header : header
        }
    }, callback);
};

OAuthOsmApi.prototype.requestWithData = function(url, method, data, callback) {
    this.request(url, method, callback, 'application/xml; charset="utf-8"', data);
};

module.exports = OAuthOsmApi;