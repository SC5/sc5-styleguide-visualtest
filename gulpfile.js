var gulp = require("gulp");

var sc5StyleguideGemini = require('./');
var styleguide = require('sc5-styleguide');
var concat = require('gulp-concat');
var minimist = require('minimist');

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

var options = minimist(process.argv.slice(2), knownOptions);

gulp.task("test:visual:update", function() {
  gulp.src(styleguidePath, { read: false })
    .pipe(sc5StyleguideGemini.gather({
      configDir: testDirPath + '/config', // Path to configuration and tests
      excludePages: [
        '2.2.1', // Back icon is not shown in prod
        '6.1-2', // picture is not loaded in prod
      ],
      gridScreenshotsDir: testDirPath + '/grid-screenshots',
      rootUrl: 'http://localhost:3000/',
      sections: options.section,
      geminiOptions: {
        browsers: {
            chrome: {
            browserName: 'chrome',
            version: '37.0'
            }
        },
        windowSize: '300x400'
      }
    }))
    .pipe(gulp.dest(testDirPath + '/config'))  // Path to configuration and tests
});

gulp.task("test:visual", function(done){
  gulp.src(styleguidePath, { read: false })
    .pipe(sc5StyleguideGemini.test({
      configDir: testDirPath + '/config', // Path to configuration and tests
      gridScreenshotsDir: testDirPath + '/grid-screenshots',
      rootUrl: 'http://localhost:3000/',
      sections: options.section,
      geminiOptions: {
        browsers: {
            chrome: {
            browserName: 'chrome',
            version: '37.0'
            }
        },
        windowSize: '300x400'
      }
    }));
});

gulp.task("test", ["styleguide", "test:visual:update", "test:visual"]);
