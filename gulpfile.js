'use strict';

/*
 * Requirements
 */

var project = require('./wp-project.json'),
    paths = require('./gulp-paths.json');

var path = require('path');

var babelify = require('babelify'),
    browserify = require('browserify'),
    buffer = require('vinyl-buffer'),
    chalk = require('chalk'),
    del = require('del'),
    gulp = require('gulp'),
    mergeStream = require('merge-stream'),
    source = require('vinyl-source-stream'),
    sprity = require('sprity');

var concat = require('gulp-concat'),
    gulpIf = require('gulp-if'),
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
        return paths.map(prepend);
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
        return mergeStream.apply(null, streams);
    }
}

function watchLog(event) {
    var type = event.type.toUpperCase().slice(0, 1) + event.type.toLowerCase().slice(1),
        filepath = path.relative(__dirname, event.path);

    console.log('\n' + chalk.yellow(type + ': ') + chalk.magenta(filepath) + '\n');
}

/*
 * Transformers
 */

function iconsTransformer(name, iconConf) {

    return gulp.src(path.theme(iconConf.svgs))
        .pipe(iconfont({
            fontName: name,
            normalize: true
        }))
        .on('glyphs', function(glyphs) {
            glyphs = glyphs.map(function(glyph) {
                return {
                    name: glyph.name,
                    codepoint: glyph.unicode[0].charCodeAt(0).toString(16).toUpperCase()
                };
            });

            gulp.src(path.theme(iconConf['stylesheet-tpl']))
                .pipe(swig({
                    defaults: {cache: false},
                    data: {
                        name: name,
                        path: path.relative(path.theme(paths.dest.stylesheets), path.theme(paths.dest.fonts)),
                        glyphs: glyphs
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

function spritesTransformer(name, spriteConf) {

    var options = {
        src: path.theme(spriteConf.path),
        cssPath: path.relative(path.theme(paths.dest.stylesheets), path.theme(paths.dest.images)),
        style: name + '.css',
        name: name,
        prefix: name
    };

    if (spriteConf.dimensions) options.dimension = spriteConf.dimensions;

    return sprity.src(options).pipe(gulpIf(
        '*.css',
        gulp.dest(path.theme(paths.dest.stylesheets)),
        gulp.dest(path.theme(paths.dest.images))
    ));

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
            .transform(babelify)
            .bundle().on('error', error)
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

gulp.task('default', ['common', 'vendor', 'app']);
gulp.task('common', ['common/copy']);
gulp.task('vendor', ['vendor/stylesheets', 'vendor/scripts']);
gulp.task('app', ['app/icons', 'app/sprites', 'app/stylesheets', 'app/scripts']);

gulp.task('clean', function(cb) {
    del(path.theme(paths.clean), cb);
});

gulp.task('common/copy', function() {
    return gulp.src(path.theme(paths.src.common.copy))
        .pipe(gulp.dest(path.theme(paths.dest.copy)));
});

gulp.task('vendor/stylesheets', function() {
    return stylesheetsTransformer(paths.src.vendor.stylesheets, true);
});

gulp.task('vendor/scripts', function() {
    return scriptsTransformer('vendor', paths.src.vendor.scripts, true);
});

gulp.task('app/icons', function() {
    var icons = paths.src.app.icons;

    return loopTransformers(Object.keys(icons), function(name) {
        return iconsTransformer(name, icons[name]);
    });
});

gulp.task('app/sprites', function() {
    var sprites = paths.src.app.sprites;

    return loopTransformers(Object.keys(sprites), function(name) {
        return spritesTransformer(name, sprites[name]);
    });
});

gulp.task('app/stylesheets', ['app/icons'], function() {
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
    gulp.watch(path.theme(paths.watch.common.copy), ['common/copy']).on('change', watchLog);
    gulp.watch(path.theme(paths.watch.vendor), ['vendor']).on('change', watchLog);
    gulp.watch(path.theme(paths.watch.app.icons), ['app/icons', 'app/stylesheets']).on('change', watchLog);
    gulp.watch(path.theme(paths.watch.app.sprites), ['app/sprites', 'app/stylesheets']).on('change', watchLog);
    gulp.watch(path.theme(paths.watch.app.stylesheets), ['app/icons', 'app/stylesheets']).on('change', watchLog);
    gulp.watch(path.theme(paths.watch.app.scripts), ['app/scripts']).on('change', watchLog);
});

