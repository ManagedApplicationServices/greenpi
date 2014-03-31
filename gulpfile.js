var gulp = require('gulp'),
  sass = require('gulp-ruby-sass'),
  minifyCSS = require('gulp-minify-css'),
  concat = require('gulp-concat'),
  uglify = require('gulp-uglify');

var paths = {
  style: 'css/**/*',
  script: ['js/lib/socketio.js', 'js/forest.js', 'js/cloudMessages.js', 'js/stars.js', 'js/scrollSkyToForest.js']
};

gulp.task('style', function() {
  return gulp.src(paths.style)
    .pipe(sass())
    .pipe(gulp.dest('css'))
    .pipe(concat('style.css'))
    .pipe(minifyCSS())
    .pipe(gulp.dest('public'));
});

gulp.task('script', function() {
  return gulp.src(paths.script)
    .pipe(concat('script.js'))
    .pipe(gulp.dest('public'))
    // .pipe(uglify())
    // .pipe(gulp.dest('public'));
});

gulp.task('watch', function() {
  gulp.watch(paths.style, ['style']);
});

gulp.task('default', ['style', 'script', 'watch']);
