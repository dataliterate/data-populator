var gulp = require('gulp');
var browserify = require('browserify');
var babelify = require('babelify');
var source = require('vinyl-source-stream');
var fs = require('fs');
var path = require('path');
var runSequence = require('run-sequence');
var del = require('del');
var async = require('async');
var fse = require('fs-extra');
var expandTilde = require('expand-tilde');

var release = require('gulp-github-release');
var zip = require('gulp-zip');

var SKETCH_PLUGINS_FOLDER = path.join(expandTilde('~'),'/Library/Application Support/com.bohemiancoding.sketch3/Plugins');

var ManifestProcessorOptions = {
    pluginManifestDescriberName: 'HKSketchFusionExtension',
    startingManifestTag: '__$begin_of_manifest_\n',
    endingManifestTag: '__$end_of_manifest_\n',
    scriptFileName: 'plugin.js',
    globalVarName: '__globals'
};

var currentManifest = {};


function extractManifestObject() {
    var data = fs.readFileSync(path.join(__dirname,'build',ManifestProcessorOptions.scriptFileName),'utf8');
    var startTag = ManifestProcessorOptions.startingManifestTag;
    var endTag = ManifestProcessorOptions.endingManifestTag;

    var startIndex = data.indexOf(startTag);
    var endIndex = data.indexOf(endTag);

    if(startIndex === -1 || endIndex === -1) {
        return;
    }

    return JSON.parse(data.substring(startIndex+startTag.length,endIndex));
}

gulp.task('clean', function () {
    return del(['build/**','dist/**']);
});

gulp.task('prepare-manifest',function(callback) {
    var manifest = extractManifestObject();
    fse.outputJsonSync(path.join(__dirname,'build/manifest.json'),manifest);
    currentManifest = manifest;
    callback(null);
});

gulp.task('prepare-folders',function(callback) {
    async.parallel({
        build: function(callback) {
            fse.ensureDir(path.join(__dirname,'build'),callback);
        },
        dist: function(callback) {
            fse.ensureDir(path.join(__dirname,'dist'),callback);
        }
    },callback);
});


gulp.task('assemble-plugin-bundle',function(callback) {

    function normalizePluginFileName(name) {
        return name;
    }

    var bundlePath = path.join(__dirname,'dist',normalizePluginFileName(currentManifest.bundleName || currentManifest.name) + '.sketchplugin');

    async.parallel({
        manifest: function(callback) {
            fse.outputJson(path.join(bundlePath,'Contents','Sketch','manifest.json'),currentManifest,callback);
        },
        runtime: function(callback) {
            var script = fs.readFileSync(path.join(__dirname,'build',ManifestProcessorOptions.scriptFileName),'utf8');
            script = ["var "+ManifestProcessorOptions.globalVarName+" = this;",script].join("");

            fse.outputFile(path.join(bundlePath,'Contents','Sketch',ManifestProcessorOptions.scriptFileName),script,callback);
        }
    },function(err,data) {
        callback(null);
    });
});

gulp.task('assemble-plugin-resources',function(callback) {
    function normalizePluginFileName(name) {
        return name;
    }

    return gulp.src('src/resources/**/*.*')
        .pipe(gulp.dest(path.join(__dirname,'dist',normalizePluginFileName(currentManifest.bundleName || currentManifest.name)+'.sketchplugin','Contents/Resources')));
});

gulp.task('assemble-plugin-presets',function(callback) {
    function normalizePluginFileName(name) {
        return name;
    }

    return gulp.src('src/presets/**/*.*')
        .pipe(gulp.dest(path.join(__dirname,'dist',normalizePluginFileName(currentManifest.bundleName || currentManifest.name)+'.sketchplugin','Presets')));
});

gulp.task('install-plugin',function(){
    return gulp.src("dist/**/*.*")
        .pipe(gulp.dest(SKETCH_PLUGINS_FOLDER));
});

gulp.task('build',function(callback) {
    runSequence('clean','prepare-folders','bundle','prepare-manifest','assemble-plugin-bundle','assemble-plugin-resources','assemble-plugin-presets','install-plugin',callback);
});

gulp.task('bundle',function() {
    var filePath = './src/plugin.js';
    var extensions = ['.js'];

    var bundler = browserify({
        entries: [filePath],
        extensions: extensions,
        debug: false
    });

    bundler.transform({ global: true }, babelify.configure({
        presets: ["es2015"],
        plugins: ["transform-object-rest-spread", ["babel-plugin-sketch-manifest-processor",ManifestProcessorOptions]]
    }));

    return bundler.bundle()
        .pipe(source(ManifestProcessorOptions.scriptFileName))
        .pipe(gulp.dest('./build/'));
});


gulp.task('watch', function(){
    runSequence('build', function() {
        gulp.watch('./src/**/*.*',function() {
            console.log("Watching...");
            runSequence('clean','build',function(){
                console.log("Rebuild complete!");
            });
        });
    });
});

gulp.task('default',function(callback) {
    runSequence('build', callback);
});

gulp.task('zip', ['build'], function() {
  return gulp.src('./dist/*.sketchplugin/**/*')
    .pipe(zip('Sketch Data Populator.zip'))
    .pipe(gulp.dest('dist'))
});

gulp.task('release', ['zip'], function() {
  return gulp.src('./dist/Sketch Data Populator.zip')
    .pipe(release({
      //token: 'token',                     // or you can set an env var called GITHUB_TOKEN instead
      owner: '',                    // if missing, it will be extracted from manifest (the repository.url field)
      repo: '',            // if missing, it will be extracted from manifest (the repository.url field)
      //tag: 'v1.0.0',                      // if missing, the version will be extracted from manifest and prepended by a 'v'
      //name: 'publish-release v1.0.0',     // if missing, it will be the same as the tag
      //notes: 'very good!',                // if missing it will be left undefined
      draft: false,                       // if missing it's false
      prerelease: true,                  // if missing it's false
      manifest: require('./build/manifest.json') // package.json from which default values will be extracted if they're missing
    }));
});
