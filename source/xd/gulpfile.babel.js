const gulp = require('gulp')
const browserify = require('browserify')
const babelify = require('babelify')
const source = require('vinyl-source-stream')
const path = require('path')
const runSequence = require('run-sequence')
const del = require('del')
const async = require('async')
const fse = require('fs-extra')
const expandTilde = require('expand-tilde')
const zip = require('gulp-zip')
const plugin = require('./plugin')['plugin']

let XD_DEVELOP_FOLDER = path.join(expandTilde('~'),
  '/Library/Application Support/Adobe/Adobe XD CC (Prerelease)/develop')

gulp.task('build', function (callback) {
  runSequence(
    'clean',
    'prepare-folders',
    'bundle',
    'prepare-manifest',
    'assemble-plugin-bundle',
    'copy-resources',
    'install-plugin',
    callback)
})

gulp.task('clean', function () {
  return del(['build/**', 'dist/**'])
})

gulp.task('prepare-folders', function (callback) {
  async.parallel({
    build: function (callback) {
      fse.ensureDir(path.join(__dirname, 'build'), callback)
    },
    dist: function (callback) {
      fse.ensureDir(path.join(__dirname, 'dist'), callback)
    }
  }, callback)
})

gulp.task('bundle', function () {
  let filePath = './plugin.js'
  let extensions = ['.js']

  let bundler = browserify({
    entries: [filePath],
    extensions: extensions,
    debug: false
  })

  bundler.transform({
    global: true
  }, babelify.configure({
    presets: [require.resolve('babel-preset-es2015')],
    plugins: [require.resolve('babel-plugin-transform-object-rest-spread')]
  }))

  return bundler.bundle()
    .pipe(source('plugin.js'))
    .pipe(gulp.dest('./build/'))
})

gulp.task('prepare-manifest', function (callback) {

  let manifest = {
    id: plugin.identifier,
    name: plugin.name,
    version: plugin.version,
    description: plugin.description,
    icons: plugin.icons,
    host: {
      app: 'XD',
      minVersion: plugin.compatibleVersion
    },
    uiEntryPoints: plugin.entryPoints.map(entryPoint => {

      return {
        type: entryPoint.type,
        label: entryPoint.label,
        menuItems: entryPoint.menuItems
      }
    })
  }

  fse.outputJsonSync(path.join(__dirname, 'build/manifest.json'), manifest)
  callback(null)
})

gulp.task('assemble-plugin-bundle', function (callback) {

  let bundlePath = path.join(__dirname, 'dist', plugin.identifier)

  async.parallel({
    manifest: function (callback) {
      fse.copy(path.join(__dirname, 'build/manifest.json'), path.join(bundlePath,
        'manifest.json'), callback)
    },
    runtime: function (callback) {
      let script = fse.readFileSync(path.join(__dirname, 'build',
        'plugin.js'), 'utf8').trim()

      let scriptLines = script.split(/\n/g)
      let lastLine = scriptLines.pop()
      script = scriptLines.join('\n')

      // make sure that require is not confused with XD require
      script = script.replace(/require/g, 'require2')
      script = script.replace('var xdRequire = null;', 'var xdRequire = require;')

      script = ['var __global = {}; ', script, `${plugin.entryPoints[0].menuItems.map(entryPoint => {
        return `__global['${entryPoint.commandId}'] = commands['${entryPoint.commandId}'];\n`
      }).join('')}`, lastLine, `module.exports = {commands: {${plugin.entryPoints[0].menuItems.map(entryPoint => {
        return `${entryPoint.commandId}: __global['${entryPoint.commandId}'],`
      }).join('')}}}`
      ].join('')

      fse.outputFile(path.join(bundlePath, 'main.js'), script,
        callback)
    }
  }, function () {
    callback(null)
  })
})

gulp.task('copy-resources', function () {
  return gulp.src('resources/**/*')
    .pipe(gulp.dest(path.join(__dirname, 'dist', plugin.identifier, 'resources')))
})

gulp.task('install-plugin', function () {
  return gulp.src('dist/**/*.*')
    .pipe(gulp.dest(XD_DEVELOP_FOLDER))
})

gulp.task('watch', function () {
  runSequence('build', function () {
    gulp.watch([
      './commands/*.*',
      './library/*.*',
      './library/**/*.*',
      './plugin.js',
      '../core/index.js',
      '../core/library/*.*',
      '../core/library/**/*.*'
    ], function () {
      console.log('Watching...')
      runSequence('clean', 'build', function () {
        console.log('Rebuild complete!')
      })
    })
  })
})

gulp.task('default', function (callback) {
  runSequence('build', callback)
})

gulp.task('zip', ['build'], function () {
  return gulp.src('./dist/**/*')
    .pipe(zip('DataPopulator_XD.zip'))
    .pipe(gulp.dest('dist'))
})
