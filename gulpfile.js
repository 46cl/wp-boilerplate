'use strict';

/*
 * Requirements
 */

var project = require('./wp-project.json'),
    paths = project['assets-paths'];

var chalk = require('chalk'),
    combiner = require('stream-combiner2'),
    gulp = require('gulp');

var concat = require('gulp-concat'),
    gutil = require('gulp-util'),
    iconfont = require('gulp-iconfont'),
    less = require('gulp-less'),
    minifyCss = require('gulp-minify-css'),
    rename = require('gulp-rename'),
    sourcemaps = require('gulp-sourcemaps'),
    swig = require('gulp-swig'),
    uglify = require('gulp-uglify');

/*
 * Default options for Gulp plugins
 */

var gulpOpts = {

    minifyCss: {
        compatibility: 'ie8',
        keepSpecialComments: 0,
        roundingPrecision: 4
    }

};

/*
 * Helpers
 */

// Replaces "%theme_path%" by the real path
function path(paths) {

    var replaceThemePath = function(path) {
        return path.replace(
            /%theme_path%/g,
            'public/wp-content/themes/' + (project.wordpress.version ? project.slug : 'project-theme')
        );
    };

    if (Array.isArray(paths)) {
        return paths.map(replaceThemePath);
    } else {
        return replaceThemePath(paths);
    }

}

function error(error) {
    console.log('\n' + chalk.red('Error: ') + error.message + '\n');
    this.emit('end');
}

/*
 * Transformers
 */

function iconsTransformer(name, iconsPaths) {

    return gulp.src(path(iconsPaths.svgs))
        .pipe(iconfont({
            fontName: name,
            appendCodepoints: true
        }))
        .on('codepoints', function(codepoints, options) {
            gulp.src(path(iconsPaths['stylesheet-tpl']))
                .pipe(swig({
                    defaults: {cache: false},
                    data: {
                        name: name,
                        path: iconsPaths['fonts-path-from-css'].replace(/\/$/g, ''),
                        glyphs: codepoints
                    }
                }))
                .pipe(minifyCss(gulpOpts.minifyCss).on('error', error))
                .pipe(rename({
                    basename: name,
                    extname: '.css'
                }))
                .pipe(gulp.dest(path(paths.dest.stylesheets)));
        })
        .pipe(gulp.dest(path(paths.dest.fonts)));

}

function stylesheetsTransformer(src, isVendor) {

    return gulp.src(path(src))
        .pipe(sourcemaps.init())
        .pipe(!isVendor ? gutil.noop() : concat('vendor.css'))
        .pipe(!isVendor ? less().on('error', error) : gutil.noop())
        .pipe(minifyCss(gulpOpts.minifyCss).on('error', error))
        .pipe(rename({extname: '.css'}))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(path(paths.dest.stylesheets)));

}

function scriptsTransformer(src, isVendor) {

    return gulp.src(path(src))
        .pipe(sourcemaps.init())
        .pipe(concat(!isVendor ? 'app.js' : 'vendor.js'))
        .pipe(uglify().on('error', error))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(path(paths.dest.scripts)));

}

/*
 * Tasks
 */

gulp.task('default', ['icons', 'vendor/stylesheets', 'vendor/scripts', 'app/stylesheets', 'app/scripts']);

gulp.task('icons', function() {
    var icons = paths.src.app.icons,
        streams = [];

    Object.keys(icons).forEach(function(name) {
        streams.push(iconsTransformer(name, icons[name]));
    });

    if (streams.length) {
        return combiner.obj(streams);
    }
});

gulp.task('vendor/stylesheets', ['icons'], function() {
    return stylesheetsTransformer(paths.src.vendor.stylesheets, true);
});

gulp.task('vendor/scripts', function() {
    return scriptsTransformer(paths.src.vendor.scripts, true);
});

gulp.task('app/stylesheets', ['icons'], function() {
    return stylesheetsTransformer(paths.src.app.stylesheets);
});

gulp.task('app/scripts', function() {
    return scriptsTransformer(paths.src.app.scripts);
});

/*
 * Watching tasks
 */

gulp.task('watch', function(cb) {
    var watcher = gulp.watch(path(paths.watch), ['default']);

    watcher.on('change', function(event) {
        var type = event.type.toUpperCase().slice(0, 1) + event.type.toLowerCase().slice(1);
        console.log('\n' + chalk.yellow(type + ': ') + chalk.magenta(event.path) + '\n');
    });
});
