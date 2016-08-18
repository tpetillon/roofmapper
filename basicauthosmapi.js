'use strict';

var $ = require('jquery');
var defined = require('./defined');
var store = require('store');

function BasicAuthOsmApi() {
    this._url = 'http://master.apis.dev.openstreetmap.org';
    this._token = store.get('basic_auth_token');
}

Object.defineProperties(BasicAuthOsmApi.prototype, {
    authenticated : {
        get : function() {
            return defined(this._token);
        }
    },
    url : {
        get : function() {
            return this._url;
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
        
        callback();
    });
    $('#basic-auth-popup').modal('show');
};

BasicAuthOsmApi.prototype.logout = function() {
    this._token = undefined;
    store.set('basic_auth_token', undefined);
};

BasicAuthOsmApi.prototype.request = function(url, method, callback, data) {
    $.ajax({
        type: method,
        url: this._url + url,
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