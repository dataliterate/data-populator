const path = require('path')
const fs = require('fs')
const execSync = require('child_process').execSync
const { getLoader, loaderByName } = require('@craco/craco')

const workspaces = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'))).workspaces
const workspacePaths = workspaces.map(workspace => path.join(__dirname, '../', workspace))

class FinishBuild {
  apply(compiler) {
    compiler.hooks.done.tap('Finish Build Plugin', () => {
      createPluginBundle()
      installPlugin()
    })
  }
}

function createPluginBundle() {
  execSync(
    `
    # Create plugin folder
    rm -rf plugin
    mkdir plugin
    cp build/main.js plugin/main.js
    cp manifest.json plugin/manifest.json
    cp -r assets/* plugin/

    # Create bundle
    rm -f data-populator.xdx
    cd plugin
    zip -r ../data-populator.xdx ./* -x "*.DS_Store"
  `,
    {
      cwd: __dirname
    }
  )
}

function installPlugin() {
  execSync(
    `
    pluginDir1="/Users/$USER/Library/Application Support/Adobe/Adobe XD (Prerelease)/develop/data-populator/"
    pluginDir2="/Users/$USER/Library/Application Support/Adobe/Adobe XD/develop/data-populator/"

    rm -rf "$pluginDir1"
    rm -rf "$pluginDir2"

    cp -r plugin/ "$pluginDir1"
    cp -r plugin/ "$pluginDir2"
  `,
    {
      cwd: __dirname
    }
  )
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
