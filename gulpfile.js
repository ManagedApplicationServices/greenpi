var gulp = require('gulp');
var sass = require('gulp-ruby-sass');

var paths = {
  styles: 'sass/**/*.sass'
};

gulp.task('sass', function() {
  return gulp.src(paths.styles)
    .pipe(sass())
    .pipe(gulp.dest('public/css'));
});
