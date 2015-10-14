var gulp = require("gulp");

var sc5StyleguideGemini = require('./');
var styleguide = require('sc5-styleguide');
var concat = require('gulp-concat');

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

gulp.task("test:visual:config", ["styleguide"], function() {
  gulp.src(styleguidePath, { read: false })
    .pipe(sc5StyleguideGemini.configure({
      excludePages: [
        '2.2.1', // Back icon is not shown in prod
        '6.1-2', // picture is not loaded in prod
      ]
    }))
    .pipe(gulp.dest(testDirPath + '/config'))  // Path to configuration and tests
});

gulp.task("test:visual:update", ["test:visual:config"], function() {
  gulp.src(styleguidePath, { read: false })
    .pipe(sc5StyleguideGemini.gather({
      configDir: testDirPath + '/config', // Path to configuration and tests
      gridScreenshotsDir: testDirPath + '/grid-screenshots',
      rootUrl: 'http://localhost:3000/'
    }));
});

gulp.task("visual:test", ["styleguide"], function(done){
  gulp.src(styleguidePath, { read: false })
    .pipe(sc5StyleguideGemini.test({
      configDir: testDirPath + '/config', // Path to configuration and tests
      gridScreenshotsDir: testDirPath + '/grid-screenshots',
      rootUrl: 'http://localhost:3000/'
    }));
});
