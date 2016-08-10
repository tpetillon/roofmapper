'use strict';

if (ENV === 'production') {
    module.exports = require('./oauthosmapi.js');
} else {
    module.exports = require('./basicauthosmapi.js');
}