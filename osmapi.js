'use strict';

if (OSM_AUTH_METHOD === 'oauth') {
    module.exports = require('./oauthosmapi.js');
} else if (OSM_AUTH_METHOD === 'basic_auth') {
    module.exports = require('./basicauthosmapi.js');
} else {
    throw 'Unknown or undefined OSM_AUTH_METHOD: ' + OSM_AUTH_METHOD;
}