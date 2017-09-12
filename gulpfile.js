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
gulp.task('clean', function () {
    return gulp.src('build/*', {read: false})
        .pipe(rimraf());
});

/**
 * Lint all custom TypeScript files.
 */
gulp.task('tslint', () => {
    return gulp.src('src/**/*.ts')
        .pipe(tslint({
            formatter: 'prose'
        }))
        .pipe(tslint.report());
});

/**
 * Compile TypeScript.
 */

function compileTS(args, cb) {
    return exec(tscCmd + args, (err, stdout, stderr) => {
        console.log(stdout);

        if (stderr) {
            console.log(stderr);
        }
        cb(err);
    });
}

gulp.task('compile', shell.task([
    'npm run tsc',
]));

/**
 * Watch for changes in TypeScript
 */
gulp.task('watch', shell.task([
    'npm run tsc-watch',
]));
/**
 * Copy config files
 */
gulp.task('configs', (cb) => {
    return gulp.src("src/configurations/*.json")
        .pipe(gulp.dest('./build/src/configurations'));
});

/**
 * Build the project.
 */
gulp.task('build', ['tslint', 'compile', 'configs'], () => {
    console.log('Building the project ...');
});

/**
 * Build the project when there are changes in TypeScript files
 */
gulp.task('develop', function () {
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
})
/**
 * Run tests.
 */
gulp.task('test', ['build'], (cb) => {
    const envs = env.set({
        NODE_ENV: 'test'
    });

    gulp.src(['build/test/**/*.js'])
        .pipe(envs)
        .pipe(mocha())
        .once('error', (error) => {
            console.log(error);
            process.exit(1);
        })
        .once('end', () => {
            process.exit();
        });
});

gulp.task('default', ['build']);