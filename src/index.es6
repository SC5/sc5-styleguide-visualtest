'use strict';

var through = require('through2');
var fs = require('fs-extra');
var Gemini = require('gemini/api');
var spawn = require('child_process').spawn;
var path = require('path');
var gutil = require('gulp-util');
var _ = require('lodash');

let removeDuplicates = (arr, newArr = []) => {
  arr.forEach(item => newArr.indexOf(item) < 0 && newArr.push(item));
  return newArr;
};

var phantomProcess;
var runPhantom = function() {
    phantomProcess = spawn('phantomjs',  ['--webdriver', '4444', '--disk-cache', 'true'],  {setsid:true});
    phantomProcess.stdout.pipe(process.stdout);
};

var getGemini = function(options) {

    var geminiOptions = {
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
    geminiOptions = _.merge(geminiOptions, options.geminiOptions);
    console.log(geminiOptions)

    return new Gemini(geminiOptions);
}

var normalize = function (options) {
  if (options.sections && Object.prototype.toString.call(options.sections) !== '[object Array]') {
    options.sections = [options.sections];
  }
  return options;
}

var getTestPaths  = function (options, allTests) {
  if (!allTests) {
    var allTests = require(path.resolve(process.cwd(), options.configDir, './pages-list.js'));
  }

  if (options.sections) {
    // For the given sections
    var tests = options.sections;
    allTests.forEach((section) => {
      options.sections.forEach((sectionToInclude) => {
        if (section.startsWith(sectionToInclude)) {
          tests.push(section);
        }
      });
      tests.sort();
      tests = removeDuplicates(tests);
    });
  } else {
    // For all the sections
    var tests = allTests;
  }

  var testPaths = tests.map((sec) => {
    return path.resolve(options.configDir, './test_' + sec + '.js');
  });
  return testPaths;
}

module.exports.test = function(options) {

  // Gemini does not configurate report dir
  options.reportDir = 'gemini-report';

  options = normalize(options);

  var test = function(file, enc, callback) {

    var gemini = getGemini(options);

    // Run PhantomJs
    runPhantom();

    // Clean report
    fs.removeSync(options.reportDir);

    // Run tests and create reports
    var runTests = function() {

      var testPaths = getTestPaths(options);

      var runTestsPromise = gemini.test(testPaths, {
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

  options = normalize(options);

  var gather = function(file, enc, callback) {

    // Provide configuration
    var getPages = function(path) {
      var styleguideData = JSON.parse(fs.readFileSync(`${path}/styleguide.json`));
      var examples = [];
      if (options.sections !== false) {
        // If section is in parameters, take only it and its children
        var res = [];
        styleguideData.sections.forEach(section => {
          options.sections.forEach(sectionToInclude => {
            if (section.reference.startsWith(sectionToInclude)) {
              res.push(section)
            }
          });
        });
        styleguideData.sections = res;
      }
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

    var currentSections = (function(options) {
      var pagesListPath = path.join(process.cwd(), options.configDir, './pages-list.js');
      if (fs.existsSync(pagesListPath)) {
        return require(pagesListPath);
      } else {
        return [];
      }
    })(options);

    // If sections are define, ADD them into existing file
    if (options.sections) {
      pages = currentSections.concat(pages);
      pages = removeDuplicates(pages);
      pages.sort();
    } else {
      // If sections are not defined, rewrite whole file
    }

    var testSource = fs.readFileSync(path.join(__dirname, './basic-test.js'), "utf8");

    var pagesJsonString = JSON.stringify(pages, null, 4);

    // list of pages
    var file = new gutil.File({
      base: path.join(__dirname),
      cwd: __dirname,
      path: path.join(__dirname, './pages-list.js'),
      contents: new Buffer(`module.exports = ${pagesJsonString}`)
    });
    this.push(file);

    pages.forEach((page) => {
        var file = new gutil.File({
        base: path.join(__dirname),
        cwd: __dirname,
        path: path.join(__dirname, `./test_${page}.js`),
        contents: new Buffer(testSource.replace('"<% EXAMPLES %>"', `["${page}"]`))
        });
        this.push(file);
    });

    var gemini = getGemini(options);

    // Run PhantomJs
    runPhantom();

    // Clean screenshot
    if (!options.sections) { // only for full replacement
      fs.removeSync(options.gridScreenshotsDir);
    }

    var runGather = function() {

      var testPaths = getTestPaths(options, pages);

      gemini.gather(testPaths, {
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
