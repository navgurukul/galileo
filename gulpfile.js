'use strict';

const gulp = require('gulp');
const rimraf = require('gulp-rimraf');
const tslint = require('gulp-tslint');
const mocha = require('gulp-mocha');
const shell = require('gulp-shell');
const env = require('gulp-env');
const nodemon = require('gulp-nodemon');
/**
 * Remove build directory.
 */
// Cleaning/deleting files no longer being used in dist folder
const clean = () => {
    console.log('Removing old files from dist');
    return del('build');
  };
  
/**
 * Lint all custom TypeScript files.
 */
const lint = () => {
    return gulp.src('src/**/*.ts')
        .pipe(tslint({
            formatter: 'prose'
        }))
        .pipe(tslint.report());
}

/**
 * Compile TypeScript.
 */

const compileTS = (args, cb) => {
    return exec(tscCmd + args, (err, stdout, stderr) => {
        //

        if (stderr) {
            console.log(stderr);
        }
        cb(err);
    });
}


/**
 * Watch for changes in TypeScript
 */
const watch = shell.task(['npm run tsc-watch']);

/**
 * Copy config files
 */
const configs = (cb) => {
    return gulp.src("src/configurations/*.json")
        .pipe(gulp.dest('./build/src/configurations'));
};

/**
 * Build the project.
 */
const build = gulp.series(shell.task(['npm run tsc']), configs);

/**
 * Build the project when there are changes in TypeScript files
 */
const develop = () => {
    var stream = nodemon({
        script: 'build/src/index.js',
        ext: 'ts',
        tasks: ['build']
    })
    stream
        .on('restart', function () {
            console.log('restarted the build process')
        })
        .on('crash', function () {
            console.error('Application has crashed!\n')
        })
}

exports.tslint = lint;
exports.build = build;
exports.default = build;
exports.watch = watch;
exports.develop = develop;
