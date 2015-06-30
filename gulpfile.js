var gulp = require('gulp');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
 
gulp.task('default', function() {
  return gulp.src('bt.js')
    .pipe(uglify({
        output: {"ascii_only": true},
        preserveComments: "some"
    }))
    .pipe(rename("bt.min.js"))
    .pipe(gulp.dest("."));
});
