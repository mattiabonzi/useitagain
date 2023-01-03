var gulp = require('gulp');
var path = require('path');
const fs = require('fs');
const { exec } = require("child_process");
var fileinclude = require('gulp-file-include');
var staticI18nHtml = require('gulp-static-i18n-html');
const sass = require('gulp-sass')(require('sass'));
var autoprefixer = require('gulp-autoprefixer');
const changed = require('gulp-changed');
var sourcemaps = require('gulp-sourcemaps');
var open = require('gulp-open');
var sitemap = require('gulp-sitemap');
const { fileURLToPath } = require('url');


gulp.task('compile-scss', function() {
  return gulp.src('./assets/scss/blk-design-system.scss')
    .pipe(sourcemaps.init())
    .pipe(sass().on('error', sass.logError))
    .pipe(autoprefixer())
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./dist/assets/css'));
});

gulp.task('watch', function() {
  gulp.watch('./assets/scss/**/**', gulp.series(['compile-scss']));
  gulp.watch('./html/**/**', gulp.series(['i18n','fileinclude']));
  gulp.watch('./assets/img/**/**', gulp.series(['optimg']));
 gulp.parallel(['serve', 'open'])();
});

gulp.task('serve', function() {
  return exec('cd ./dist && serve', (e,s,se) => {console.log(e,s,se)});
});

gulp.task('open', function() {
  return exec('open http://localhost:3000', (e,s,se) => {console.log(e,s,se)});
});

gulp.task('deploy', function() {
  gulp.series('build')();
  return exec("firebase deploy", (e,s,se) => {console.log(e,s,se)});
});

gulp.task('build', function(done) {
  gulp.series(['reset_build', 'copy_asset', 'compile-scss', 'optimg', 'i18n', 'fileinclude','delete_parts', 'copy_script_source', 'sitemap'])();
  done();
});

gulp.task('delete_parts', function() {
  return exec('rm -rf ./dist/parts ./dist/*/parts', (e,s,se) => {console.log(e,s,se)});
});

gulp.task('copy_script_source', function() {
  return exec("cp ../install.sh ../hass-requirements.txt ./dist/", (e,s,se) => {console.log(e,s,se)});
});

gulp.task('copy_asset', function() {
   exec("cp -rf ./assets/ ./dist/", (e,s,se) => {console.log(e,s,se)});
   return exec("rm -rf ./dist/assets/scss/* ./dist/assets/img/*", (e,s,se) => {console.log(e,s,se)});
});

gulp.task('reset_build', function() {
  return exec("rm -rf ./dist/*", (e,s,se) => {console.log(e,s,se)});
});


gulp.task('i18n', function() {
  return gulp.src('./html/**/**.html')
    .pipe(staticI18nHtml({
      locale: 'en',
      locales: ['en', 'it']
    }))
    .pipe(gulp.dest('./dist'));
});


gulp.task('optimg', function() {
  return exec('cd ./assets/img && cp -f ./*.gif ../dist/assets/img/ && find . -name "*" -not -name "*.gif" -exec optimizt --webp --force -o ../dist/assets/img/ {} +', 
   (error, stdout, stderr) => {
     if (error) {
         console.log(`error: ${error.message}`);
         return;
     }
     if (stderr) {
         console.log(`stderr: ${stderr}`);
         return;
     }
     console.log(`stdout: ${stdout}`);
     return true;
 });  

});
  

gulp.task('fileinclude', function() {
  return gulp.src('./dist/**/**.html')
    .pipe(fileinclude({
      prefix: '@@',
      basepath: '@file'
    }))
    .pipe(gulp.dest('./dist/'));
});


gulp.task('sitemap', function () {
    return gulp.src('dist/**/*.html', {
            read: false
        })
        .pipe(sitemap({
            siteUrl: 'http://useitagain.io'
        }))
        .pipe(gulp.dest('./dist'));
});