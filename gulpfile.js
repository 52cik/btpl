var gulp = require("gulp");
var uglify = require("gulp-uglify");
var rename = require("gulp-rename");
var jshint = require('gulp-jshint');

// 检查脚本
gulp.task('lint', function() {
    gulp.src("./src/*.js")
    .pipe(jshint({lookup: false, evil: true}))
    .pipe(jshint.reporter("default"));
});

// 压缩文件
gulp.task("build", function() {
    gulp.src("./src/*.js")
    .pipe(uglify({
        output: {"ascii_only": true},
        preserveComments: "some"
    }))
    .pipe(rename({suffix: ".min"}))
    .pipe(gulp.dest("./build"));
});

// 默认任务
gulp.task("default", ["lint", "build"]);
