'use strict';

/*
 * Requirements
 */

var project = require('./wp-project.json'),
    paths = project['assets-paths'];

var chalk = require('chalk'),
    combiner = require('stream-combiner2'),
    del = require('del'),
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

function loopTransformers(array, callback) {
    var streams = [];

    array.forEach(function() {
        streams.push(callback.apply(null, Array.prototype.slice.call(arguments)));
    });

    if (streams.length) {
        return combiner.obj(streams);
    }
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
                .pipe(rename({
                    basename: name,
                    extname: '.less'
                }))
                .pipe(gulp.dest(path(paths.tmp)))
                .pipe(sourcemaps.init())
                .pipe(less().on('error', error))
                .pipe(minifyCss(gulpOpts.minifyCss).on('error', error))
                .pipe(rename({extname: '.css'}))
                .pipe(sourcemaps.write('./'))
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

function scriptsTransformer(name, src) {

    return gulp.src(path(src))
        .pipe(sourcemaps.init())
        .pipe(concat(name + '.js'))
        .pipe(uglify().on('error', error))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(path(paths.dest.scripts)));

}

/*
 * Tasks
 */

gulp.task('default', ['clean', 'icons', 'vendor/stylesheets', 'vendor/scripts', 'app/stylesheets', 'app/scripts']);

gulp.task('clean', function(cb) {
    del(path(paths.dest.clean), cb);
});

gulp.task('icons', ['clean'], function() {
    var icons = paths.src.app.icons;

    return loopTransformers(Object.keys(icons), function(name) {
        return iconsTransformer(name, icons[name]);
    });
});

gulp.task('vendor/stylesheets', ['clean', 'icons'], function() {
    return stylesheetsTransformer(paths.src.vendor.stylesheets, true);
});

gulp.task('vendor/scripts', ['clean'], function() {
    return scriptsTransformer('vendor', paths.src.vendor.scripts);
});

gulp.task('app/stylesheets', ['clean', 'icons'], function() {
    return stylesheetsTransformer(paths.src.app.stylesheets);
});

gulp.task('app/scripts', ['clean'], function() {
    var scripts = paths.src.app.scripts;

    return loopTransformers(Object.keys(scripts), function(name) {
        return scriptsTransformer(name, scripts[name]);
    });
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
