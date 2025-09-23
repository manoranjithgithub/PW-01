// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html

// Move all the `require()` calls to the top level
const path = require('path');
const karmaJasmine = require('karma-jasmine');
const karmaChromeLauncher = require('karma-chrome-launcher');
const karmaJasmineHtmlReporter = require('karma-jasmine-html-reporter');
const karmaCoverage = require('karma-coverage');
const angularKarmaPlugin = require('@angular-devkit/build-angular/plugins/karma');

module.exports = function karmaConfig(config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      karmaJasmine,
      karmaChromeLauncher,
      karmaJasmineHtmlReporter,
      karmaCoverage,
      angularKarmaPlugin,
    ],
    client: {
      jasmine: {
        // you can add configuration options for Jasmine here
        // the possible options are listed at https://jasmine.github.io/api/edge/Configuration.html
        // for example, you can disable the random execution with `random: false`
        // or set a specific seed with `seed: 4321`
      },
      clearContext: false, // leave Jasmine Spec Runner output visible in browser
    },
    jasmineHtmlReporter: {
      suppressAll: true, // removes the duplicated traces
    },
    coverageReporter: {
      dir: path.join(__dirname, './coverage/nimbuz'),
      subdir: '.',
      reporters: [
        { type: 'html' },
        { type: 'text-summary' },
      ],
    },
    reporters: ['progress', 'kjhtml'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['Chrome'],
    singleRun: false,
    restartOnFileChange: true,
  });
};
