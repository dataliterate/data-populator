import webpack from 'webpack'
import path from 'path'
import ExtractTextPlugin from 'extract-text-webpack-plugin'
import CleanWebpackPlugin from 'clean-webpack-plugin'

export default function (production) {
  // define core plugins
  const plugins = [
    new CleanWebpackPlugin(['dist'], {
      root: __dirname
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(production ? 'production' : 'development'),
      __DEV__: false
    }),
    new webpack.optimize.OccurrenceOrderPlugin(),
    new ExtractTextPlugin('styles-[hash].css')
  ]

  // add production only plugins
  if (production) {
    plugins.push(
      new webpack.optimize.UglifyJsPlugin({
        compress: {
          warnings: false,
          screw_ie8: true,
          conditionals: true,
          unused: true,
          comparisons: true,
          sequences: true,
          dead_code: true,
          evaluate: true,
          if_return: true,
          join_vars: true
        },
        output: {
          comments: false
        }
      })
    )
  }

  // create webpack config object
  return {
    devtool: production ? 'eval' : 'source-map',
    entry: './src/index',
    output: {
      path: `${__dirname}/dist/ui/assets/`,
      publicPath: 'assets/',
      filename: 'bundle-[hash].js'
    },
    resolve: {
      alias: {
        '~': path.resolve('./src')
      }
    },
    module: {
      loaders: [
        {
          enforce: 'pre',
          test: /\.js$/,
          loader: 'standard-loader',
          exclude: /node_modules/
        },
        {
          test: /\.js$/,
          include: path.join(__dirname, 'src'),
          loaders: ['babel-loader']
        },
        {
          test: /\.(svg|jpe?g|png|gif)$/i,
          loaders: ['file-loader']
        },
        {
          test: /\.ico$/,
          loader: 'file-loader?name=[name].[ext]'
        },
        {
          test: /(\.css|\.scss)$/,
          loader: ExtractTextPlugin.extract({
            use: 'css-loader!sass-loader',
            publicPath: ''
          })
        }
      ]
    },
    plugins
  }
}
