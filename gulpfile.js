var gulp = require("gulp");

var styleguide = require('sc5-styleguide');
var concat = require('gulp-concat');

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
