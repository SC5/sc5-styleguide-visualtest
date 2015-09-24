'use strict';

var through = require('through2');
var fs = require('fs-extra');
var Gemini = require('gemini/api');
var spawn = require('child_process').spawn;
var path = require('path');
var gutil = require('gulp-util');

var phantomProcess;
var runPhantom = function() {
    phantomProcess = spawn('phantomjs',  ['--webdriver', '4444', '--disk-cache', 'true'],  {setsid:true});
    phantomProcess.stdout.pipe(process.stdout);
};

function getGenimi = function(options) {
    var gemini = new Gemini({
        rootUrl: options.rootUrl,
        projectRoot: './',
        gridUrl: 'http://127.0.0.1:4444/wd/hub',
        screenshotsDir: options.gridScreenshotsDir,
        browsers: {
          chrome: {
            browserName: 'chrome',
            version: '37.0'
          }
        },
        windowSize: '1024x768'
}

module.exports.test = function(options) {

  // Gemini does not configurate report dir
  options.reportDir = 'gemini-report';

  var test = function(file, enc, callback) {

    var gemini = getGemini(options);

    // Run PhantomJs
    runPhantom();

    // Clean report
    fs.removeSync(options.reportDir);

    // Run tests and create reports
    var runTests = function() {
      var runTestsPromise = gemini.test([path.resolve(options.configDir, './basic-test.js')], {
        reporters: ['html', 'flat'],
        tempDir: options.reportDir
      });
      runTestsPromise.done(result => {
        phantomProcess.kill('SIGTERM');
        spawn('open', [`${options.reportDir}/index.html`])
      });
    };
    // TODO: remake with promises
    setTimeout(runTests, 2000);

  }

  return through.obj(test);

}

module.exports.gather = function(options) {

  var gather = function(file, enc, callback) {

    var gemini = getGemini(options);

    // Run PhantomJs
    runPhantom();

    // Clean screenshot
    fs.removeSync(options.gridScreenshotsDir);

    var runGather = function() {
      gemini.gather([path.resolve(options.configDir, './basic-test.js')], {
        reporters: ['flat'],
      })
      .done(result => {
        phantomProcess.kill('SIGTERM');
      });
    }
    // TODO: remake with promises
    setTimeout(runGather, 2000);

  };

  return through.obj(gather);

};

module.exports.configure = function(options) {

  var configure = function(file, enc, callback) {
    var getPages = function(path) {
      var styleguideData = JSON.parse(fs.readFileSync(`${path}/styleguide.json`));
      var examples = [];
      styleguideData.sections.forEach(section => {
        if (!section.markup) { // For sections with markup only
          return;
        }
        if (section.modifiers.length === 0) {
          // Only for the pages with markup
          // Exclude pages
          if (options.excludePages.indexOf(section.reference) !== -1) {
            return;
          }
          examples.push(section.reference);
        } else {
          for(var m = 1;m<=section.modifiers.length;m++) {
            // Exclude pages
            if (options.excludePages.indexOf(`${section.reference}-${m}`) !== -1) {
              continue;
            }
            examples.push(`${section.reference}-${m}`);
          }
        }
      });
      return examples;
    };

    var styleguidePath = file.path;

    var pages = getPages(styleguidePath);

    // list of pages
    var file = new gutil.File({
      base: path.join(__dirname),
      cwd: __dirname,
      path: path.join(__dirname, './pages-list.js'),
      contents: new Buffer(`module.exports = ${JSON.stringify(pages, null, 4)}`)
    });
    this.push(file);

    // basic test
    var file = new gutil.File({
      base: path.join(__dirname),
      cwd: __dirname,
      path: path.join(__dirname, './basic-test.js'),
      contents: new Buffer(fs.readFileSync(path.join(__dirname, './basic-test.js')))
    });
    this.push(file);

    callback();
  };

  return through.obj(configure);

};
