var webpack = require('webpack');
var Config = require('webpack-config').Config;
 
module.exports = new Config().extend('conf/webpack.base.config.js').merge({
    debug: true,
    devtool: '#source-map',
    output: {
        publicPath: 'http://localhost:8080/'
    },
    plugins: [
        new webpack.DefinePlugin({
            ENV : JSON.stringify("dev")
        })
    ]
});