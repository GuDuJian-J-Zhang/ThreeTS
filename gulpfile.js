var gulp = require("gulp");
var ts = require("gulp-typescript");
var tsProjects = ts.createProject("./example/tsconfig.json");

gulp.task("default", function() {
    return tsProjects.src()
           .pipe(tsProjects())
           .js.pipe(gulp.dest("build/example"));
});