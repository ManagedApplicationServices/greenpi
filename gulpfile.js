var gulp = require('gulp'),
  sass = require('gulp-ruby-sass'),
  minifyCSS = require('gulp-minify-css'),
  concat = require('gulp-concat'),
  uglify = require('gulp-uglify'),
  plumber = require('gulp-plumber'),
  jshint = require('gulp-jshint');

var paths = {
  style: 'css/**/*',
  script: [
    'js/vendor/momentjs/min/moment.min.js',
    'js/vendor/socket.io-client/dist/socket.io.min.js',
    'js/vendor/d3/d3.min.js',
    'js/forest.js',
    'js/graph.js',
    'js/cloudMessages.js',
    'js/scrollSkyToForest.js'
  ],
  scriptToLint: [
    'js/graph.js',
    'js/forest.js',
    'js/cloudMessages.js',
    'js/scrollSkyToForest.js'
  ]
};

gulp.task('style', function() {
  return gulp.src(paths.style)
    .pipe(plumber())
    .pipe(sass())
    .pipe(gulp.dest('css'))
    .pipe(concat('style.css'))
    .pipe(minifyCSS())
    .pipe(gulp.dest('public'));
});

gulp.task('script', function() {
  return gulp.src(paths.script)
    .pipe(plumber())
    .pipe(concat('script.js'))
    .pipe(gulp.dest('public'))
    .pipe(uglify())
    .pipe(gulp.dest('public'));
});

gulp.task('jshint', function() {
  return gulp.src(paths.scriptToLint)
    .pipe(plumber())
    .pipe(jshint())
    .pipe(jshint.reporter('default'))
});

gulp.task('watch', function() {
  gulp.watch(paths.style, ['style']);
  gulp.watch(paths.script, ['script']);
  gulp.watch(paths.scriptToLint, ['jshint']);
});

gulp.task('default', ['jshint', 'style', 'script', 'watch']);
