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
    scriptHome: [
      'js/vendor/jquery/dist/jquery.min.js',
      'js/vendor/momentjs/min/moment.min.js',
      'js/vendor/socket.io-client/dist/socket.io.min.js',
      'js/vendor/d3/d3.min.js',
      'js/forest.js',
      'js/poster.js',
      'js/graph.js',
      'js/scrollSkyToForest.js'
    ],
    scriptSetting: [
      'js/vendor/jquery/dist/jquery.min.js',
      'js/setting.js'
    ],
    scriptSettingDone: [
      'js/vendor/socket.io-client/dist/socket.io.min.js',
      'js/done.js'
    ],
    scriptSettingReset: [
      'js/vendor/socket.io-client/dist/socket.io.min.js',
      'js/reset.js'
    ],
    scriptToLint: [
      'controllers/**/*',
      'models/**/*',
      'lib/**/*',
      'js/graph.js',
      'js/forest.js',
      'js/poster.js',
      'js/setting.js',
      'js/scrollSkyToForest.js',
      'js/reset.js',
      'index.js',
      'gulpfile.js'
    ],
    filesToClean: [
      'public/script.js',
      'public/setting.js',
      'public/done.js',
      'public/reset.js',
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
    .pipe(sass({
      sourcemap: false
    }))
    .pipe(gulp.dest('css'))
    .pipe(concat('style.css'))
    .pipe(minifyCSS())
    .pipe(gulp.dest('public'));
});

gulp.task('scriptHome', function() {
  return gulp.src(paths.scriptHome)
    .pipe(plumber())
    .pipe(concat('script.js'))
    .pipe(gulp.dest('public'))
    .pipe(uglify({
      outSourceMap: false,
      preserveComments: false
    }))
    .pipe(gulp.dest('public'));
});

gulp.task('scriptSetting', function() {
  return gulp.src(paths.scriptSetting)
    .pipe(plumber())
    .pipe(concat('setting.js'))
    .pipe(gulp.dest('public'))
    .pipe(uglify({
      outSourceMap: false,
      preserveComments: false
    }))
    .pipe(gulp.dest('public'));
});

gulp.task('scriptSettingDone', function() {
  return gulp.src(paths.scriptSettingDone)
    .pipe(plumber())
    .pipe(concat('done.js'))
    .pipe(gulp.dest('public'))
    .pipe(uglify({
      outSourceMap: false,
      preserveComments: false
    }))
    .pipe(gulp.dest('public'));
});

gulp.task('scriptSettingReset', function() {
  return gulp.src(paths.scriptSettingReset)
    .pipe(plumber())
    .pipe(concat('reset.js'))
    .pipe(gulp.dest('public'))
    .pipe(uglify({
      outSourceMap: false,
      preserveComments: false
    }))
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
  'scriptHome',
  'scriptSetting',
  'scriptSettingDone',
  'scriptSettingReset',
  'watch'
]);
