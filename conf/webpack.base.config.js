var webpack = require('webpack');
var Config = require('webpack-config').Config;
var CopyWebpackPlugin = require('copy-webpack-plugin');
var GlobalizePlugin = require('globalize-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = new Config().merge({
    entry: "./entry.js",
    output: {
        path: __dirname + "/../../server/public",
        filename: "bundle.js"
    },
    module: {
        loaders: [
            { test: /\.css$/, loader: 'style!css?sourceMap' },
            { test: /\.(png)$/, loader: 'url-loader?limit=100000' },
            { test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: "url-loader?limit=10000" },
            { test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: "url-loader?limit=10000&mimetype=application/font-woff" },
            { test: /\.json$/, loader: 'json-loader' },
        ]
    },
    plugins: [
        new webpack.DefinePlugin({
            ROOFMAPPER_VERSION : JSON.stringify(require("../package.json").version),
            OSM_SERVER_URL : JSON.stringify(process.env.npm_package_config_osm_server_url),
            OSM_AUTH_METHOD : JSON.stringify(process.env.npm_package_config_osm_auth_method)
        }),
        new GlobalizePlugin({
			production: false, // error when true, cf. https://github.com/rxaviers/globalize-webpack-plugin/issues/10
			developmentLocale: "en",
			supportedLocales: [ "en", "fr" ],
			messages: "messages/[locale].json"
        }),
        new HtmlWebpackPlugin({
            title: 'RoofMapper'
        }),
        new CopyWebpackPlugin([
            { from: 'land.html' }
        ])
    ]
});