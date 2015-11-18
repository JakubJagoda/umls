// Karma configuration
// http://karma-runner.github.io/0.12/config/configuration-file.html
// Generated on 2014-09-10 using
// generator-karma 0.8.3

var webpackConfig = require('./webpack.config.js');

module.exports = function (config) {
    'use strict';

    config.set({
        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: true,

        // base path, that will be used to resolve files and exclude
        basePath: '.',

        // testing framework to use (jasmine/mocha/qunit/...)
        frameworks: ['jasmine'],

        // list of files / patterns to load in the browser
        files: [
            'app/dependencies.ts',
            'app/**/*.spec.ts',
            'app/**/*.spec.tsx'
        ],

        // list of files / patterns to exclude
        exclude: [],

        plugins: [
            'karma-sourcemap-loader',
            'karma-webpack',
            'karma-jasmine',
            'karma-phantomjs-launcher',
            'karma-phantomjs-shim'
        ],

        preprocessors: {
            'app/dependencies.ts': ['webpack'],
            'app/**/*.{ts,tsx}': ['webpack', 'sourcemap']
        },

        webpack: {
            devtool: 'eval-source-map',
            debug: true,
            module: webpackConfig.module,
            resolve: webpackConfig.resolve
        },

        webpackMiddleware: {
            quiet: true,
            stats: {
                colors: true
            }
        },

        // web server port
        port: 8080,

        // Start these browsers, currently available:
        // - Chrome
        // - ChromeCanary
        // - Firefox
        // - Opera
        // - Safari (only Mac)
        // - PhantomJS
        // - IE (only Windows)
        browsers: [
            'PhantomJS'
        ],

        // Continuous Integration mode
        // if true, it capture browsers, run tests and exit
        singleRun: false,

        colors: true,

        // level of logging
        // possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
        logLevel: config.LOG_INFO

        // Uncomment the following lines if you are using grunt's server to run the tests
        // proxies: {
        //   '/': 'http://localhost:9000/'
        // },
        // URL root prevent conflicts with the site root
        // urlRoot: '_karma_'
    });
};
