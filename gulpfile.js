const gulp         = require('gulp');
const jasmine      = require('gulp-jasmine');
const ts           = require('gulp-typescript');
const istanbul     = require('gulp-istanbul');
const SpecReporter = require('jasmine-spec-reporter').SpecReporter;

const tsProject = ts.createProject('tsconfig.json');

gulp.task('build', () => {
  return gulp.src('src/**/*.ts')
    .pipe(tsProject()).js
    .pipe(gulp.dest('dist/'));
});

gulp.task('pre-test', ['build'], () => {
  return gulp.src(['dist/**/*.js', '!dist/**/*.spec.js'])
    // Covering files
    .pipe(istanbul())
    // Force `require` to return covered files
    .pipe(istanbul.hookRequire());
});

gulp.task('systemtest', ['build', 'pre-test'], () => {
  return gulp.src('dist/**/test/*.spec.js')
    .pipe(jasmine({
      reporter: new SpecReporter({
        spec: {
          displayPending: true,
          displayStacktrace: true
        }
      }),
      includeStackTrace: true
    }))
    .pipe(istanbul.writeReports({
      reporters: ['html', 'json', 'text-summary'],
      dir: './coverage',
      reportOpts: {
        html: {
          dir: './coverage/html'
        },
        json: {
          dir: './coverage/json'
        }
      }
    }))
    .pipe(istanbul.enforceThresholds({ thresholds: { global: 90 } }));
});

gulp.task('default', ['systemtest']);

return gulp;
