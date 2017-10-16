const gulp          = require('gulp');
const jasmine       = require('gulp-jasmine');
const ts            = require('gulp-typescript');
const istanbul      = require('gulp-istanbul');
const SpecReporter  = require('jasmine-spec-reporter').SpecReporter;
const remapIstanbul = require('remap-istanbul/lib/gulpRemapIstanbul');
const p             = require('gulp-load-plugins')();
const merge         = require('merge2');

const tsProject = ts.createProject('tsconfig.json');

function remapCoverageFiles() {
    gulp.src('./coverage/json/coverage.json').pipe(
        remapIstanbul({
            reports: {
                json: './coverage/json/coverage-remapped.json',
                html: './coverage/html'
            }
        })
    );
}

gulp.task('build', () => {
  let tsResult = gulp
    .src('src/**/*.ts')
    .pipe(p.sourcemaps.init())
    .pipe(tsProject());


  return merge([
    tsResult.dts
      .pipe(gulp.dest('dist/')),

    tsResult.js
      .pipe(p.sourcemaps.write())
      .pipe(gulp.dest('dist/'))
  ]);
});

gulp.task('pre-test', ['build'], () => {
    return (
        gulp
        .src(['dist/**/*.js', '!dist/**/*.spec.js'])
        // Covering files
        .pipe(istanbul())
        // Force `require` to return covered files
        .pipe(istanbul.hookRequire())
    );
});

gulp.task('unittest', ['build', 'pre-test'], () => {
    return gulp
        .src('dist/**/test/*.spec.js')
        .pipe(
            jasmine({
                reporter: new SpecReporter({
                    spec: {
                        displayPending: true,
                        displayStacktrace: true
                    }
                }),
                includeStackTrace: true
            })
        )
        .pipe(
            istanbul.writeReports({
                reporters: ['html', 'json', 'text-summary'],
                dir: './coverage',
                reportOpts: {
                    html: {
                        dir: './coverage/html'
                    },
                    json: {
                        dir: './coverage/json',
                        file: 'coverage.json'
                    }
                }
            })
        )
        .pipe(istanbul.enforceThresholds({ thresholds: { global: 90 } }))
        .on('end', remapCoverageFiles);
});

gulp.task('default', ['unittest']);

return gulp;
