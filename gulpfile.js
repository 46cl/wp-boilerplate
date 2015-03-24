'use strict';

/*
 * Requirements
 */

var project = require('./wp-project.json'),
    paths = project['assets-paths'];

var path = require('path');

var babelify = require('babelify'),
    browserify = require('browserify'),
    buffer = require('vinyl-buffer'),
    chalk = require('chalk'),
    combiner = require('stream-combiner2'),
    del = require('del'),
    gulp = require('gulp'),
    source = require('vinyl-source-stream');

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
path.theme = function(paths) {

    var replaceThemePath = function(singlePath) {
        singlePath = singlePath.replace(
            /%theme_path%/g,
            'public/wp-content/themes/' + (project.wordpress.version ? project.slug : 'project-theme')
        );

        return path.normalize(singlePath);
    };

    if (Array.isArray(paths)) {
        return paths.map(replaceThemePath);
    } else {
        return replaceThemePath(paths);
    }

};

path.relativePrepend = function(paths) {

    var prepend = function(singlePath) {
        return './' + path.normalize(singlePath);
    };

    if (Array.isArray(paths)) {
        return paths.map(replaceThemePath);
    } else {
        return prepend(paths);
    }

};

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

    return gulp.src(path.theme(iconsPaths.svgs))
        .pipe(iconfont({
            fontName: name,
            appendCodepoints: true
        }))
        .on('codepoints', function(codepoints, options) {
            gulp.src(path.theme(iconsPaths['stylesheet-tpl']))
                .pipe(swig({
                    defaults: {cache: false},
                    data: {
                        name: name,
                        path: path.relative(path.theme(paths.dest.stylesheets), path.theme(paths.dest.fonts)),
                        glyphs: codepoints
                    }
                }))
                .pipe(rename({
                    basename: name,
                    extname: '.less'
                }))
                .pipe(gulp.dest(path.theme(paths.tmp)))
                .pipe(sourcemaps.init())
                .pipe(less().on('error', error))
                .pipe(minifyCss(gulpOpts.minifyCss).on('error', error))
                .pipe(rename({extname: '.css'}))
                .pipe(sourcemaps.write('./'))
                .pipe(gulp.dest(path.theme(paths.dest.stylesheets)));
        })
        .pipe(gulp.dest(path.theme(paths.dest.fonts)));

}

function stylesheetsTransformer(src, isVendor) {

    return gulp.src(path.theme(src))
        .pipe(sourcemaps.init())
        .pipe(!isVendor ? gutil.noop() : concat('vendor.css'))
        .pipe(!isVendor ? less().on('error', error) : gutil.noop())
        .pipe(minifyCss(gulpOpts.minifyCss).on('error', error))
        .pipe(rename({extname: '.css'}))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(path.theme(paths.dest.stylesheets)));

}

function scriptsTransformer(name, src, isVendor) {

    var dest;

    src = path.theme(src);
    dest = path.theme(paths.dest.scripts);

    if (!isVendor) {
        return browserify({
            entries: path.relativePrepend(src),
            debug: true
        })
            .bundle()
            .pipe(source(name + '.js'))
            .pipe(buffer())
            .pipe(sourcemaps.init({loadMaps: true}))
            .pipe(uglify().on('error', error))
            .pipe(sourcemaps.write('.'))
            .pipe(gulp.dest(dest));
    } else {
        return gulp.src(src)
            .pipe(sourcemaps.init())
            .pipe(concat(name + '.js'))
            .pipe(uglify().on('error', error))
            .pipe(sourcemaps.write('./'))
            .pipe(gulp.dest(dest));
    }
}

/*
 * Tasks
 */

gulp.task('default', ['clean', 'icons', 'vendor/stylesheets', 'vendor/scripts', 'app/stylesheets', 'app/scripts']);

gulp.task('clean', function(cb) {
    del(path.theme(paths.dest.clean), cb);
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
    return scriptsTransformer('vendor', paths.src.vendor.scripts, true);
});

gulp.task('app/stylesheets', ['clean', 'icons'], function() {
    return stylesheetsTransformer(paths.src.app.stylesheets);
});

gulp.task('app/scripts', function() {
    var scripts = paths.src.app.scripts;

    return loopTransformers(Object.keys(scripts), function(name) {
        return scriptsTransformer(name, scripts[name], false);
    });
});

/*
 * Watching tasks
 */

gulp.task('watch', function(cb) {
    var watcher = gulp.watch(path.theme(paths.watch), ['default']);

    watcher.on('change', function(event) {
        var type = event.type.toUpperCase().slice(0, 1) + event.type.toLowerCase().slice(1);
        console.log('\n' + chalk.yellow(type + ': ') + chalk.magenta(event.path) + '\n');
    });
});
