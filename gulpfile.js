'use strict';

var gulp = require('gulp');
var plumber = require('gulp-plumber');
var concat = require('gulp-concat');
var stylus = require('gulp-stylus');
var jshint = require('gulp-jshint');
var jscs = require('gulp-jscs');
var minifyCSS = require('gulp-minify-css');
var clean = require('gulp-rimraf');
var uglify = require('gulp-uglify');

var paths = {
  scriptToLint: [
    'controllers/**/*',
    'models/**/*',
    'lib/**/*',
    'test/**/*.js',

    'js/done.js',
    'js/forest.js',
    'js/graph.js',
    'js/poster.js',
    'js/reset.js',
    'js/scrollSkyToForest.js',
    'js/setting.js',

    'index.js',
    'server.js',
    'gulpfile.js'
  ],
  scriptHome: [
    'js/vendor/jquery/dist/jquery.min.js',
    'js/vendor/momentjs/min/moment.min.js',
    'js/vendor/socket.io-client/socket.io.js',
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
    'js/vendor/socket.io-client/socket.io.js',
    'js/done.js'
  ],
  scriptSettingReset: [
    'js/vendor/socket.io-client/socket.io.js',
    'js/reset.js'
  ],
  css: [
    'css/bootstrap.css',
    'css/**/*.styl'
  ],
  filesToClean: [
    'css/common/layout.css',
    'css/common/poster.css',
    'css/forest/*.css',
    'css/sky/*.css',
    'css/bootstrap.css'
  ]
};

gulp.task('css', function() {
  gulp.src(paths.css)
    .pipe(stylus({
      compress: true,
      errors: true
    }))
    .pipe(gulp.dest('./css'));
});

gulp.task('cssMinify', function() {
  return gulp.src('css/common/bootstrap.css')
    .pipe(minifyCSS())
    .pipe(gulp.dest('./css'));
});

gulp.task('cssConcat', function() {
  return gulp.src([ 'css/bootstrap.css', 'css/style.css' ])
    .pipe(concat('app.css'))
    .pipe(gulp.dest('./public'));
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

gulp.task('scriptHome', function() {
  return gulp.src(paths.scriptHome)
    .pipe(plumber())
    .pipe(concat('script.js'))
    .pipe(gulp.dest('public/js'))
    .pipe(uglify({
      outSourceMap: false,
      preserveComments: false
    }))
    .pipe(gulp.dest('public/js'));
});

gulp.task('scriptSetting', function() {
  return gulp.src(paths.scriptSetting)
    .pipe(plumber())
    .pipe(concat('setting.js'))
    .pipe(gulp.dest('public/js'))
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
    .pipe(gulp.dest('public/js'))
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
    .pipe(gulp.dest('public/js'))
    .pipe(uglify({
      outSourceMap: false,
      preserveComments: false
    }))
    .pipe(gulp.dest('public'));
});

gulp.task('clean', function() {
  return gulp.src(paths.filesToClean, {
    read: false
  })
  .pipe(clean());
});

gulp.task('default', [
  'jshint',
  'jscs',

  'css',
  'cssMinify',
  'cssConcat',

  'scriptHome',
  'scriptSetting',
  'scriptSettingDone',
  'scriptSettingReset',

  'clean'
]);

gulp.task('check', [
  'jshint',
  'jscs'
]);
