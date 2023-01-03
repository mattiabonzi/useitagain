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

const { fileURLToPath } = require('url');

var Paths = {
  HERE: './',
  DIST: 'dist/',
  CSS: './assets/css/',
  SCSS_TOOLKIT_SOURCES: './assets/scss/blk-design-system.scss',
  SCSS: './assets/scss/**/**'
};

gulp.task('compile-scss', function() {
  return gulp.src('./scss/blk-design-system.scss')
    .pipe(sourcemaps.init())
    .pipe(sass().on('error', sass.logError))
    .pipe(autoprefixer())
    .pipe(sourcemaps.write(Paths.HERE))
    .pipe(gulp.dest('./dist/assets/css'));
});

gulp.task('watch', function() {
  gulp.watch('./scss/**/**', gulp.series(['compile-scss']));
  gulp.watch('./html/**/**.html', gulp.series(['i18n','fileinclude']));
  gulp.watch('./html/locales/**/**', gulp.series(['i18n']));
  gulp.watch('./img/**/**', gulp.series(['optimg']));
 gulp.parallel(['serve', 'open'])();
});

gulp.task('serve', function() {
  exec('cd ./dist && serve', (e,s,se) => {console.log(e,s,se)});
});

gulp.task('open', function() {
  exec('open http://localhost:3000', (e,s,se) => {console.log(e,s,se)});
});

gulp.task('deploy', function() {
  gulp.series('init');
return exec("cp ../install.sh ../hass-requirements.txt ./dist/ && \
  rm -rf ./dist/parts ./dist/*/parts \
 firebase deploy && \
 rm -f ./dist/install.sh ./dist/hass-requirements.txt", 
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

gulp.task('init', function() {
 
  gulp.parallel(['compile-scss', 'optimg', 'i18n'])();
  gulp.parallel([ 'fileinclude'])();
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
  return exec('cd ./img && cp -f ./*.gif ../dist/assets/img/ && find . -name "*" -not -name "*.gif" -exec optimizt --webp --force -o ../dist/assets/img/ {} +', 
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