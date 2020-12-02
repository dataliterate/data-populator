const webpack = require('webpack')
const path = require('path')
const fs = require('fs-extra')
const Zip = require('adm-zip')
const { getLoader, loaderByName } = require('@craco/craco')

const workspaces = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'))).workspaces
const workspacePaths = workspaces.map(workspace => path.join(__dirname, '../', workspace))
const package = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json')))

class FinishBuild {
  apply(compiler) {
    compiler.hooks.done.tap('Finish Build Plugin', () => {
      createPluginBundle()
      installPlugin()
    })
  }
}

function createPluginBundle() {
  // Create plugin folder
  fs.removeSync(path.join(__dirname, 'plugin'))
  fs.ensureDirSync(path.join(__dirname, 'plugin'))
  fs.copySync(path.join(__dirname, 'build/main.js'), path.join(__dirname, 'plugin/main.js'))
  fs.copySync(path.join(__dirname, 'manifest.json'), path.join(__dirname, 'plugin/manifest.json'))
  fs.copySync(path.join(__dirname, 'assets'), path.join(__dirname, 'plugin/'))

  // Create bundle
  fs.removeSync(path.join(__dirname, 'data-populator.xdx'))
  const zip = new Zip()
  zip.addLocalFolder(path.join(__dirname, 'plugin'), '', filename => {
    return filename.indexOf('.DS_Store') === -1
  })
  zip.writeZip(path.join(__dirname, 'data-populator.xdx'))
}

function installPlugin() {
  const name = 'data-populator'
  const home = process.env[process.platform === 'darwin' ? 'HOME' : 'USERPROFILE']

  const locations = {
    darwin: [
      'Library/Application Support/Adobe/Adobe XD/develop',
      'Library/Application Support/Adobe/Adobe XD (Prerelease)/develop'
    ],
    win32: ['AppData/Local/Packages/Adobe.CC.XD_adky2gkssdxte/LocalState/develop']
  }

  for (let location of locations[process.platform]) {
    fs.removeSync(path.join(home, location, name))
    fs.copySync(path.join(__dirname, 'plugin'), path.join(home, location, name))
  }
}

module.exports = {
  webpack: {
    plugins: [new FinishBuild()],
    configure: config => {
      config.externals = {
        application: 'application',
        uxp: 'uxp',
        scenegraph: 'scenegraph',
        viewport: 'viewport',
        os: 'os',
        commands: 'commands'
      }

      config.optimization.splitChunks = false
      config.optimization.runtimeChunk = false
      config.output.path = path.join(__dirname, 'build')
      config.output.filename = 'main.js'
      config.output.libraryTarget = 'commonjs2'
      config.output.publicPath = './'
      config.output.globalObject = 'self'
      config.devtool = 'none'

      // Do not extract comments into separate txt files next to build
      config.optimization.minimizer.filter(
        p => p.constructor.name === 'TerserPlugin'
      )[0].options.extractComments = false

      // Remove react dev client - prevents crashes due to code generation from strings
      config.entry = config.entry.filter(entry => entry.indexOf('DevClient') === -1)

      // Add paths to workspaces to compile all imported code
      const { isFound, match } = getLoader(config, loaderByName('babel-loader'))
      if (isFound) {
        match.loader.include = [
          ...(Array.isArray(match.loader.include) ? match.loader.include : [match.loader.include]),
          ...workspacePaths
        ]
      }

      // Comment out code generation from strings in the build
      config.module.rules.push({
        test: /\.js$/,
        loader: 'string-replace-loader',
        options: {
          multiple: [
            {
              search: /( |{|\b)(Function\(.*;)/g,
              replace: (match, g1, g2) => `${g1}{};`
            }
          ]
        }
      })

      // Remove unwanted plugins
      const usedPlugins = []
      for (let p of config.plugins) {
        if (
          ['HotModuleReplacementPlugin', 'ManifestPlugin', 'GenerateSW'].indexOf(
            p.constructor.name
          ) === -1
        ) {
          // Disable speedy mode because it's not supported in XD
          if (p.constructor.name === 'DefinePlugin') {
            p.definitions.SC_DISABLE_SPEEDY = true
          }

          usedPlugins.push(p)
        }
      }

      // Set plugin version as env variable
      usedPlugins.push(
        new webpack.DefinePlugin({
          'process.env.PLUGIN_VERSION': JSON.stringify(package.version)
        })
      )

      config.plugins = usedPlugins

      return config
    }
  },
  devServer: {
    writeToDisk: true,
    open: false,
    hot: false,
    inline: false,
    liveReload: false,
    port: 5555
  },
  eslint: {
    configure: {
      globals: {
        XMLHttpRequest: false
      }
    }
  }
}
