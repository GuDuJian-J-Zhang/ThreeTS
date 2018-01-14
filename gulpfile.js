var gulp = require("gulp");
var typescript = require("gulp-typescript");
var sourcemaps = require('gulp-sourcemaps');
var replace = require('gulp-replace');
var merge = require('merge2');
var concat = require('gulp-concat');
var header = require('gulp-header');
var clean = require('gulp-clean');

var separator = '// ----------------------------------------------------------------\n';
gulp.task("scene", function() {
    var sourceDir = "./src";
    var typingsDir = "./typings";
    var destinationDir = "./build/debug";
    var tsOptions = typescript.createProject(sourceDir + "/tsconfig.json");
    var tsFiles = typescript.createProject(sourceDir + "/tsconfig.json");

    var tsSourceFile = tsFiles.src()
                              .pipe(header(separator + '// file: <%= file.path %>\n' + separator))
                              .pipe(concat('threets' + '.ts'))
                              .pipe(gulp.dest(sourceDir));

    var tsResults = tsSourceFile.pipe(sourcemaps.init())
                                .pipe(tsOptions());

    return merge(
        [
            tsResults.dts
                    //  .pipe(replace(/\/\/\/ <reference path=.*\/>/g, ''))
                     .pipe(gulp.dest(typingsDir)),
            tsResults.js
                     .pipe(sourcemaps.write('.'))
                     .pipe(gulp.dest(destinationDir)),
                     tsFiles.src()
                     .pipe(header(separator + '// file: <%= file.path %>\n' + separator))
                     .pipe(concat('threets' + '.ts'))
                     .pipe(gulp.dest(destinationDir)),
                     // tsSourceFile.pipe(clean())
        ]
    );
});

gulp.task("default", function() {
    var tsProjects = typescript.createProject("./example/tsconfig.json");
    return tsProjects.src()
           .pipe(tsProjects())
           .js.pipe(gulp.dest("build/example"));
});