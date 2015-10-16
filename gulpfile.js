var gulp = require("gulp");

var sc5StyleguideGemini = require('./');
var styleguide = require('sc5-styleguide');
var concat = require('gulp-concat');
var minimist = require('minimist');
var fs = require('fs-extra');

var testDirPath = './tests/tmp';
var styleguideSource = './tests/data/*.css';
var styleguidePath = './tests/data/styleguide';

gulp.task('styleguide:generate', function() {
  return gulp.src(styleguideSource)
    .pipe(styleguide.generate({
        title: 'SC5 Styleguide',
        server: true,
        rootPath: styleguidePath,
        overviewPath: 'README.md'
      }))
    .pipe(gulp.dest(styleguidePath));
});
gulp.task('styleguide:applystyles', function() {
  return gulp.src(styleguideSource)
    .pipe(concat('all.css'))
    .pipe(styleguide.applyStyles())
    .pipe(gulp.dest(styleguidePath));
});

gulp.task('styleguide', ['styleguide:generate', 'styleguide:applystyles']);

var knownOptions = {
  'string': 'section',
  'default': { 'section': false }
}

var currentList = function() {
  var currentSections;
  if (fs.existsSync(testDirPath + '/config/pages-list.js')) {
    currentSections = require(testDirPath + '/config/pages-list.js');
  }
  return currentSections;
}

var options = minimist(process.argv.slice(2), knownOptions);

gulp.task("test:visual:config", function() {
  gulp.src(styleguidePath, { read: false })
    .pipe(sc5StyleguideGemini.configure({
      excludePages: [
        '2.2.1', // Back icon is not shown in prod
        '6.1-2', // picture is not loaded in prod
      ],
      sections: options.section,
      currentSections: currentList()
    }))
    .pipe(gulp.dest(testDirPath + '/config'))  // Path to configuration and tests
});

gulp.task("test:visual:update", ["test:visual:config"], function() {
  gulp.src(styleguidePath, { read: false })
    .pipe(sc5StyleguideGemini.gather({
      configDir: testDirPath + '/config', // Path to configuration and tests
      gridScreenshotsDir: testDirPath + '/grid-screenshots',
      rootUrl: 'http://localhost:3000/',
      sections: options.section
    }));
});

gulp.task("test:visual", function(done){
  gulp.src(styleguidePath, { read: false })
    .pipe(sc5StyleguideGemini.test({
      configDir: testDirPath + '/config', // Path to configuration and tests
      gridScreenshotsDir: testDirPath + '/grid-screenshots',
      rootUrl: 'http://localhost:3000/'
    }));
});

gulp.task("test", ["styleguide", "test:visual:update", "test:visual"]);
