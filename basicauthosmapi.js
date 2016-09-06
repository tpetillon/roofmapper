'use strict';

var $ = require('jquery');
var defined = require('./defined');
var store = require('store');

function BasicAuthOsmApi() {
    this._url = 'http://master.apis.dev.openstreetmap.org';
    this._token = store.get('basic_auth_token');
    
    this._username = undefined;
    this._userId = undefined;
}

Object.defineProperties(BasicAuthOsmApi.prototype, {
    authenticated : {
        get : function() {
            return defined(this._token);
        }
    },
    connected : {
        get : function() {
            return defined(this._userId);
        }
    },
    url : {
        get : function() {
            return this._url;
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

BasicAuthOsmApi.prototype.authenticate = function(callback) {
    var that = this;
    
    $('body').append(require('html!./basicauthpopup.html'));
    $('#basic-auth-popup-login-button').click(function() {
        $('#basic-auth-popup').modal('hide');
        
        var username = $("#basic-auth-popup-username").val();
        var password = $("#basic-auth-popup-password").val();
        
        that._token = "Basic " + btoa(username + ":" + password);
        store.set('basic_auth_token', that._token);
        
        that.connect(callback);
    });
    $('#basic-auth-popup').modal('show');
};

BasicAuthOsmApi.prototype.connect = function(callback) {
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

BasicAuthOsmApi.prototype.logout = function() {
    this._token = undefined;
    store.set('basic_auth_token', undefined);
    
    this._username = undefined;
    this._userId = undefined;
};

BasicAuthOsmApi.prototype.request = function(url, method, callback, data) {
    $.ajax({
        type: method,
        url: this._url + url,
        data : data,
        headers: { "Authorization" : this._token }
    })
    .done(function(data) {
        if (defined(callback)) {
            callback(undefined, data);
        }
    })
    .fail(function(xhr, status, error) {
        if (defined(callback)) {
            callback(xhr, undefined);
        }
    });
};

BasicAuthOsmApi.prototype.requestWithData = function(url, method, data, callback) {
    this.request(url, method, callback, data);
};

module.exports = BasicAuthOsmApi;