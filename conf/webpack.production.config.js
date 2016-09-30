var webpack = require('webpack');
var Config = require('webpack-config').Config;
 
module.exports = new Config().extend('conf/webpack.base.config.js').merge({
    plugins: [
        new webpack.DefinePlugin({
            ENV : JSON.stringify("production")
        })
    ]
});