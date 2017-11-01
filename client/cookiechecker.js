'use strict';

var CookieChecker = {
    areCookiesEnabled: function areCookiesEnabled() {
        // from https://gist.github.com/steveosoule/5679949
        var cookieEnabled = (navigator.cookieEnabled) ? true : false;

        if (typeof navigator.cookieEnabled == 'undefined' && !cookieEnabled) {
            document.cookie = 'testcookie';
            cookieEnabled = (document.cookie.indexOf('testcookie') != -1) ? true : false;
        }

        return cookieEnabled;
    }
}

module.exports = CookieChecker;
