'use strict';

var clean = require('gulp-clean'),
  concat = require('gulp-concat'),
  gulp = require('gulp'),
  jshint = require('gulp-jshint'),
  jscs = require('gulp-jscs'),
  minifyCSS = require('gulp-minify-css'),
  plumber = require('gulp-plumber'),
  sass = require('gulp-ruby-sass'),
  uglify = require('gulp-uglify'),

  paths = {
  style: 'css/**/*',
  script: [
    'js/vendor/jquery/dist/jquery.min.js',
    'js/vendor/momentjs/min/moment.min.js',
    'js/vendor/socket.io-client/dist/socket.io.min.js',
    'js/vendor/d3/d3.min.js',
    'js/setting.js',
    'js/forest.js',
    'js/poster.js',
    'js/graph.js',
    'js/scrollSkyToForest.js'
  ],
  scriptToLint: [
    'controllers/**/*',
    'models/**/*',
    'js/graph.js',
    'js/forest.js',
    'js/poster.js',
    'js/scrollSkyToForest.js',
    'js/setting.js',
    'gulpfile.js'
  ],
  filesToClean: [
    'public/script.js',
    'public/style.css'
  ]
};

gulp.task('clean', function() {
  return gulp.src(paths.filesToClean, {
    read: false
  })
  .pipe(clean());
});

gulp.task('style', function() {
  return gulp
    .src(paths.style)
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

gulp.task('jscs', function() {
  return gulp.src(paths.scriptToLint)
    .pipe(jscs());
});

gulp.task('jshint', function() {
  return gulp.src(paths.scriptToLint)
    .pipe(plumber())
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

gulp.task('watch', function() {
  gulp.watch(paths.style, [ 'style' ]);
  gulp.watch(paths.script, [ 'script' ]);
  gulp.watch(paths.scriptToLint, [ 'jshint' ]);
});

gulp.task('default', [
  'clean',
  'jscs',
  'jshint',
  'style',
  'script',
  'watch'
]);
