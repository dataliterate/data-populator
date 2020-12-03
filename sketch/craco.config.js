const webpack = require('webpack')
const path = require('path')
const fs = require('fs')
const { getLoader, loaderByName } = require('@craco/craco')

const workspaces = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'))).workspaces
const workspacePaths = workspaces.map(workspace => path.join(__dirname, '../', workspace))
const package = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json')))

module.exports = {
  webpack: {
    configure: config => {
      config.optimization.splitChunks = false
      config.optimization.runtimeChunk = false
      config.output.path = path.join(__dirname, 'build')
      config.output.filename = 'main.js'
      config.output.publicPath = './'
      config.output.globalObject = 'self'
      if (process.env.NODE_ENV === 'production') {
        config.devtool = 'none'
      }

      // Do not extract comments into separate txt files next to build
      config.optimization.minimizer.filter(
        p => p.constructor.name === 'TerserPlugin'
      )[0].options.extractComments = false

      // Add paths to workspaces to compile all imported code
      const { isFound, match } = getLoader(config, loaderByName('babel-loader'))
      if (isFound) {
        match.loader.include = [
          ...(Array.isArray(match.loader.include) ? match.loader.include : [match.loader.include]),
          ...workspacePaths
        ]
      }

      // Remove unwanted plugins
      const usedPlugins = []
      for (let p of config.plugins) {
        if (['ManifestPlugin', 'GenerateSW'].indexOf(p.constructor.name) === -1) {
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
    open: false,
    port: 4444
  },
  eslint: {
    configure: {
      globals: {
        NSBundle: false,
        MSLayerArray: false,
        NSMutableDictionary: false,
        NSUserDefaults: false
      }
    }
  }
}
