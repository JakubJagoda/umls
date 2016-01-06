var BUILD_PATH = 'build';

var webpack = require('webpack');
var path = require('path');
var production = (process.env.NODE_ENV === 'production');

var ExtractPlugin = require('extract-text-webpack-plugin');
var CleanPlugin = require('clean-webpack-plugin');

var BUNDLE_NAME = production ? '[name]-[hash]' : 'bundle';

var plugins = [
    new webpack.optimize.CommonsChunkPlugin({
        name: 'main', // Move dependencies to our main file
        children: true, // Look for common dependencies in all children,
        minChunks: 2 // How many times a dependency must come up before being extracted
    })
];

if (production) {
    plugins = plugins.concat([
        new ExtractPlugin(BUNDLE_NAME + '.css', {allChunks: true}),
        // Cleanup the builds/ folder before
        // compiling our final assets
        new CleanPlugin(BUILD_PATH),

        // This plugin looks for similar chunks and files
        // and merges them for better caching by the user
        new webpack.optimize.DedupePlugin(),

        // This plugins optimizes chunks and modules by
        // how much they are used in your app
        new webpack.optimize.OccurenceOrderPlugin(),

        // This plugin prevents Webpack from creating chunks
        // that would be too small to be worth loading separately
        new webpack.optimize.MinChunkSizePlugin({
            minChunkSize: 51200 // ~50kb
        }),

        // This plugin minifies all the Javascript code of the final bundle
        new webpack.optimize.UglifyJsPlugin({
            mangle: true,
            compress: {
                warnings: false // Suppress uglification warnings
            }
        }),

        // This plugins defines various variables that we can set to false
        // in production to avoid code related to them from being compiled
        // in our final bundle
        new webpack.DefinePlugin({
            __SERVER__: !production,
            __DEVELOPMENT__: !production,
            __DEVTOOLS__: !production,
            'process.env': {
                BABEL_ENV: JSON.stringify(process.env.NODE_ENV)
            }
        })
    ]);
}

module.exports = {
    entry: './app',
    output: {
        path: path.join(__dirname, BUILD_PATH),
        filename: production ? BUNDLE_NAME + '.js' : 'bundle.js',
        chunkFilename: '[name]-[chunkhash].js',
        publicPath: BUILD_PATH
    },
    resolve: {
        // Add `.ts` and `.tsx` as a resolvable extension.
        extensions: ['', '.webpack.js', '.web.js', '.ts', '.tsx', '.js']
    },
    module: {
        loaders: [{
            test: /\.tsx?$/,
            loaders: [
                'babel',
                'ts'
            ],
            include: __dirname + '/app'
        }, {
            test: /\.scss/,
            loaders: production ?
                [ExtractPlugin.extract('style', 'css!sass')] :
                ['style', 'css?sourceMap', 'sass?sourceMap']
        }, {
            test: /\.handlebars/,
            loader: 'handlebars'
        }, {
            test: /\.(png|gif|jpe?g|svg)$/i,
            loader: 'url?limit=10000'
        }, {
            test: /\.json$/,
            loader: 'json'
        }]
    },
    node: {
        fs: "empty"
    },
    plugins: plugins,
    debug: !production,
    devtool: production ? false : 'inline-source-map',
    amd: {
        jQuery: true
    }
};
