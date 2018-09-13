var gulp = require('gulp');
var sass = require('gulp-sass');
var babel = require('gulp-babel');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var cleanCSS = require('gulp-clean-css');
var del = require('del');

var paths = {
    styles: {
        src: 'src/**/*.scss',
        dest: 'public/'
    },
    scripts: {
        src: 'src/**/*.js',
        dest: 'public/'
    },
    htmls: {
        src: 'src/**/*.html',
        dest: 'public/'
    }
};

function clean() {
    // You can use multiple globbing patterns as you would with `gulp.src`,
    // for example if you are using del 2.0 or above, return its promise
    return del([ 'public' ]);
}

function styles() {
    return gulp.src(paths.styles.src)
        .pipe(sass())
        .pipe(cleanCSS())
        .pipe(gulp.dest(paths.styles.dest));
}

function scripts() {
    return gulp.src(paths.scripts.src, { sourcemaps: true })
        .pipe(babel())
        // .pipe(uglify())
        .pipe(gulp.dest(paths.scripts.dest));
}

function htmls() {
    return gulp.src(paths.htmls.src)
        .pipe(gulp.dest(paths.htmls.dest));
}

function watch() {
    gulp.watch(paths.scripts.src, scripts);
    gulp.watch(paths.styles.src, styles);
    gulp.watch(paths.htmls.src, htmls);
}

/*
 * You can use CommonJS `exports` module notation to declare tasks
 */
exports.clean = clean;
exports.styles = styles;
exports.scripts = scripts;
exports.htmls = htmls;
exports.watch = watch;

/*
 * Specify if tasks run in series or parallel using `gulp.series` and `gulp.parallel`
 */
var build = gulp.series(clean, gulp.parallel(styles, scripts, htmls));

/*
 * You can still use `gulp.task` to expose tasks
 */
gulp.task('build', build);

/*
 * Define default task that can be called by just running `gulp` from cli
 */
gulp.task('default', build);