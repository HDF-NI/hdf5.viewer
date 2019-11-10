var gulp = require('gulp');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var run = require('gulp-run');
var del = require('del');

var jsDest = 'public/js',
    cssDest = 'public/css';

gulp.task('set-java-env', function(done) {
    process.env.JAVA_HOME='/home/roger/jdk1.8.0_151';
    done();
});

gulp.task('jstree-copy', function(done) {
    return gulp.src(['../jstree/dist/**/*'])
        .pipe(gulp.dest(jsDest+'/jstree'));
});

gulp.task('jquery-copy', function(done) {
    return gulp.src(['./node_modules/jquery/dist/**/*'])
        .pipe(gulp.dest(jsDest+'/jquery'));
});

gulp.task('jquery-ui-copy', function(done) {
    return gulp.src(['./node_modules/jquery-ui/dist/**/*'])
        .pipe(gulp.dest(jsDest+'/jquery-ui'));
});

gulp.task('default',gulp.series('set-java-env', gulp.parallel('jstree-copy',gulp.parallel('jquery-copy',gulp.parallel('jquery-ui-copy'))), (done) => {
    }));

gulp.task('buildjquery', function () {

    // run an npm command called `test`, when above js file changes
    run('pnpm run buildjquery').exec();

});

gulp.task('js-delete', function(done) {
  return del([
    'dist/report.csv',
    'public/js/jquery/**/*',
    'public/js/jquery-ui/**/*',
    'public/js/jstree/**/*',
  ]);
});


gulp.task('clean', gulp.series('js-delete'), function (done) {

});