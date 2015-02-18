/*
 * Requirements
 */

var project = require('../wp-project.json'),
    paths = project['assets-paths'];

var chalk = require('chalk'),
    gulp = require('gulp');

/*
 * Gulp plugins
 */

var concat = require('gulp-concat'),
    less = require('gulp-less'),
    rename = require('gulp-rename'),
    uglify = require('gulp-uglify');

/*
 * Helpers
 */

function path(path) {
    return path.replace(/%theme_path%/g, 'public/wp-content/themes/project-theme');
}

function error(error) {
    console.log(chalk.red('\n' + error.message + '\n'));
    this.emit('end');
}

/*
 * Tasks
 */

gulp.task('default', ['stylesheets', 'scripts']);

gulp.task('stylesheets', function() {

    return gulp.src(path(paths.src.stylesheets))
        .pipe(less({ compress: true }).on('error', error))
        .pipe(rename({
            extname: '.css'
        }))
        .pipe(gulp.dest(path(paths.dest.stylesheets)));

});

gulp.task('scripts', function() {

    return gulp.src(path(paths.src.scripts))
        .pipe(concat('app.js'))
        .pipe(uglify().on('error', error))
        .pipe(gulp.dest(path(paths.dest.scripts)));

});

/*
 * Watching tasks
 */

gulp.task('watch', function() {
    var watcher = gulp.watch(paths.watch, ['default']);

    watcher.on('change', function(event) {
        console.log(chalk.yellow('\nFile '+ event.path +' was '+ event.type +', running tasks...\n'));
    });
});
