const gulp = require('gulp')
const browserify = require('browserify')
const babelify = require('babelify')
const source = require('vinyl-source-stream')
const fs = require('fs')
const path = require('path')
const runSequence = require('run-sequence')
const del = require('del')
const async = require('async')
const fse = require('fs-extra')
const expandTilde = require('expand-tilde')
const release = require('gulp-github-release')
const zip = require('gulp-zip')
const sketch = require('gulp-sketch')

const plugin = require('./plugin')['HKSketchFusionExtension']

let SKETCH_PLUGINS_FOLDER = path.join(expandTilde('~'),
  '/Library/Application Support/com.bohemiancoding.sketch3/Plugins')

let ManifestProcessorOptions = {
  pluginManifestDescriberName: 'HKSketchFusionExtension',
  startingManifestTag: '__$begin_of_manifest_\n',
  endingManifestTag: '__$end_of_manifest_\n',
  scriptFileName: 'plugin.js',
  globalVarName: '__globals'
}

let currentManifest = {}

function extractManifestObject () {
  let data = fs.readFileSync(path.join(__dirname, 'build',
    ManifestProcessorOptions.scriptFileName), 'utf8')
  let startTag = ManifestProcessorOptions.startingManifestTag
  let endTag = ManifestProcessorOptions.endingManifestTag

  let startIndex = data.indexOf(startTag)
  let endIndex = data.indexOf(endTag)

  if (startIndex === -1 || endIndex === -1) {
    return
  }

  return JSON.parse(data.substring(startIndex + startTag.length, endIndex))
}

gulp.task('build', function (callback) {
  runSequence(
    'clean',
    'prepare-folders',
    'bundle',
    'prepare-manifest',
    'assemble-plugin-bundle',
    'assemble-plugin-resources',
    'copy-plugin-ui',
    'assemble-plugin-presets',
    'install-plugin',
    callback)
})

gulp.task('build-custom', function (callback) {
  runSequence(
    'clean',
    'assets',
    'prepare-folders',
    'bundle',
    'prepare-manifest',
    'assemble-plugin-bundle',
    'assemble-plugin-resources',
    'copy-plugin-ui',
    'assemble-plugin-presets',
    'assemble-plugin-custompresets',
    callback)
})

gulp.task('clean', function () {
  return del(['build/**', 'dist/**'])
})

gulp.task('assets', function (callback) {
  runSequence('icon', 'commandicons', callback)
})

gulp.task('icon', function () {
  return gulp.src('./images/icon.sketch')
    .pipe(sketch({
      export: 'artboards',
      formats: 'png'
    }))
    .pipe(gulp.dest('./resources/'))
})

gulp.task('commandicons', function () {
  return gulp.src('./images/commands.sketch')
    .pipe(sketch({
      export: 'artboards',
      formats: 'png'
    }))
    .pipe(gulp.dest('./resources/'))
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
    plugins: [require.resolve('babel-plugin-transform-object-rest-spread'), [
      require.resolve('babel-plugin-sketch-manifest-processor'),
      ManifestProcessorOptions
    ]]
  }))

  return bundler.bundle()
    .pipe(source(ManifestProcessorOptions.scriptFileName))
    .pipe(gulp.dest('./build/'))
})

gulp.task('prepare-manifest', function (callback) {

  let manifest = {
    name: plugin.name,
    bundleName: plugin.bundleName,
    description: plugin.description,
    author: plugin.author,
    authorEmail: plugin.authorEmail,
    version: plugin.version,
    identifier: plugin.identifier,
    compatibleVersion: plugin.compatibleVersion,
    icon: plugin.icon,
    appcast: plugin.appcast,
    menu: plugin.menu,
    disableCocoaScriptPreprocessor: true,
    commands: Object.keys(plugin.commands).map(commandIdentifier => {
      return {
        identifier: commandIdentifier,
        handler: `___${commandIdentifier}_run_handler_`,
        script: 'plugin.js',
        name: plugin.commands[commandIdentifier].name,
        shortcut: plugin.commands[commandIdentifier].shortcut,
        description: plugin.commands[commandIdentifier].description,
        icon: plugin.commands[commandIdentifier].icon
      }
    })
  }

  fse.outputJsonSync(path.join(__dirname, 'build/manifest.json'), manifest)
  currentManifest = manifest
  callback(null)
})

gulp.task('assemble-plugin-bundle', function (callback) {

  function normalizePluginFileName (name) {
    return name
  }

  let bundlePath = path.join(__dirname, 'dist', normalizePluginFileName(
    currentManifest.bundleName || currentManifest.name) +
    '.sketchplugin')

  async.parallel({
    manifest: function (callback) {
      fse.outputJson(path.join(bundlePath, 'Contents', 'Sketch',
        'manifest.json'), currentManifest, callback)
    },
    runtime: function (callback) {
      let script = fs.readFileSync(path.join(__dirname, 'build',
        ManifestProcessorOptions.scriptFileName), 'utf8')
      script = ['let ' + ManifestProcessorOptions.globalVarName +
        ' = this;', script
      ].join('')

      fse.outputFile(path.join(bundlePath, 'Contents', 'Sketch',
        ManifestProcessorOptions.scriptFileName), script,
      callback)
    }
  }, function () {
    callback(null)
  })
})

gulp.task('assemble-plugin-resources', function (callback) {
  function normalizePluginFileName (name) {
    return name
  }

  return gulp.src('resources/**/*.*')
    .pipe(gulp.dest(path.join(__dirname, 'dist', normalizePluginFileName(
      currentManifest.bundleName || currentManifest.name) +
      '.sketchplugin', 'Contents/Resources')))
})

gulp.task('copy-plugin-ui', function (callback) {
  function normalizePluginFileName (name) {
    return name
  }

  return gulp.src('ui/dist/**/*.*')
    .pipe(gulp.dest(path.join(__dirname, 'dist', normalizePluginFileName(
      currentManifest.bundleName || currentManifest.name) +
      '.sketchplugin', 'Contents/Resources')))
})

gulp.task('assemble-plugin-presets', function (callback) {
  function normalizePluginFileName (name) {
    return name
  }

  return gulp.src('../../presets/**/*.*')
    .pipe(gulp.dest(path.join(__dirname, 'dist', normalizePluginFileName(
      currentManifest.bundleName || currentManifest.name) +
      '.sketchplugin', 'Presets')))
})

gulp.task('assemble-plugin-custompresets', function (callback) {
  function normalizePluginFileName (name) {
    return name
  }

  return gulp.src('../../custom-presets/**/*.*')
    .pipe(gulp.dest(path.join(__dirname, 'dist', normalizePluginFileName(
      currentManifest.bundleName || currentManifest.name) +
      '.sketchplugin', 'Presets')))
})

gulp.task('install-plugin', function () {
  return gulp.src('dist/**/*.*')
    .pipe(gulp.dest(SKETCH_PLUGINS_FOLDER))
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
  runSequence('assets', 'build', callback)
})

gulp.task('zip', ['build'], function () {
  return gulp.src('./dist/*.sketchplugin/**/*')
    .pipe(zip('DataPopulator_Sketch.zip'))
    .pipe(gulp.dest('dist'))
})

gulp.task('release', ['zip'], function () {
  return gulp.src('./dist/DataPopulator_Sketch.zip')
    .pipe(release({
      // token: 'token',                     // or you can set an env let called GITHUB_TOKEN instead
      owner: 'preciousforever', // if missing, it will be extracted from manifest (the repository.url field)
      repo: 'data-populator', // if missing, it will be extracted from manifest (the repository.url field)
      // tag: 'v1.0.0',                      // if missing, the version will be extracted from manifest and prepended by a 'v'
      // name: 'publish-release v1.0.0',     // if missing, it will be the same as the tag
      // notes: 'Fix for Sketch Version 42',                // if missing it will be left undefined
      draft: true, // if missing it's false
      prerelease: false, // if missing it's false
      manifest: require('./build/manifest.json') // package.json from which default values will be extracted if they're missing
    }))
})
