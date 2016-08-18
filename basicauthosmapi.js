'use strict';

var $ = require('jquery');
var defined = require('./defined');
var store = require('store');

function BasicAuthOsmApi() {
    this._token = store.get('basic_auth_token');
}

Object.defineProperties(BasicAuthOsmApi.prototype, {
    authenticated : {
        get : function() {
            return defined(this._token);
        }
    }
});

BasicAuthOsmApi.prototype.authenticate = function(callback) {
    var w = 600, h = 550;
    var settings = [
        ['width', w], ['height', h],
        ['left', screen.width / 2 - w / 2],
        ['top', screen.height / 2 - h / 2]].map(function(x) {
            return x.join('=');
        }).join(',');
    var popup = window.open('about:blank', 'basic_auth_window', settings);
    popup.document.write(require('html!./basicauthpopup.html'));
    
    var that = this;
    
    window.authComplete = function(authInfo) {
        window.authComplete = undefined;
        
        that._token = "Basic " + btoa(authInfo.username + ":" + authInfo.password);
        store.set('basic_auth_token', that._token);
        
        callback();
    };
};

BasicAuthOsmApi.prototype.logout = function() {
    this._token = undefined;
    store.set('basic_auth_token', undefined);
};

BasicAuthOsmApi.prototype.request = function(url, method, callback, data) {
    $.ajax({
        type: method,
        url: 'http://master.apis.dev.openstreetmap.org' + url,
        data : data,
        headers: { "Authorization" : this._token }
    })
    .done(function(data) {
        callback(undefined, data);
    })
    .fail(function(xhr, status, error) {
        callback(xhr, undefined);
    });
};

BasicAuthOsmApi.prototype.requestWithData = function(url, method, data, callback) {
    this.request(url, method, callback, data);
};

module.exports = BasicAuthOsmApi;