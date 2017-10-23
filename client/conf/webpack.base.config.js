var webpack = require('webpack');
var Config = require('webpack-config').Config;
var CopyWebpackPlugin = require('copy-webpack-plugin');
var FaviconsWebpackPlugin = require('favicons-webpack-plugin');
var GlobalizePlugin = require('globalize-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');

var cldrData = require("cldr-data");
var path = require('path');

var supportedLocales = [ 'en', 'fr' ];
var cldrFiles = [ 'ca-gregorian', 'dateFields', 'numbers' ];

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
            OSM_AUTH_METHOD : JSON.stringify(process.env.npm_package_config_osm_auth_method),
            PIC4CARTO_SERVER_URL : JSON.stringify(process.env.npm_package_config_pic4carto_server_url)
        }),
        new GlobalizePlugin({
			production: false, // error when true, cf. https://github.com/rxaviers/globalize-webpack-plugin/issues/10
			developmentLocale: 'en',
            supportedLocales: supportedLocales,
            cldr: function(locale) {
                // Because Globalize is not used the intended way (that is, it is used in "development" mode ) all
                // the time. CLDR files for locals that are not the development locale are not provided by default.
                // To avoid this, the CLDR list is composed here.
                // For the values, cf. https://github.com/rxaviers/globalize-webpack-plugin/blob/master/util.js
                return cldrData.entireSupplemental().concat([].concat.apply([], supportedLocales.map(function(supportedLocale) {
                    return cldrFiles.map(function(mainFile) {
                        return cldrData(path.join('main', supportedLocale, mainFile));
                    });
                })));
            },
			messages: 'messages/[locale].json'
        }),
        new HtmlWebpackPlugin({
            title: 'RoofMapper'
        }),
        new FaviconsWebpackPlugin('./favicon.png'),
        new CopyWebpackPlugin([
            { from: 'land.html' }
        ])
    ]
});