var gulp = require('gulp');
var sass = require('gulp-ruby-sass');
var minifyCSS = require('gulp-minify-css');
var concat = require('gulp-concat');


var paths = {
  style: 'css/**/*'
};

gulp.task('style', function() {
  return gulp.src(paths.style)
    .pipe(sass())
    .pipe(gulp.dest('css'))
    .pipe(concat('green.css'))
    .pipe(minifyCSS())
    .pipe(gulp.dest('public/css'));
});

gulp.task('default', ['style']);