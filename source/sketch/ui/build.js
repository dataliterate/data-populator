import fs from 'fs'
import cheerio from 'cheerio'
import chalk from 'chalk'
import webpack from 'webpack'
import createConfig from './webpack.config'

// check if building for production
const production = process.argv.indexOf('--production') > -1

// production config if not watching
let config = createConfig(production)

// run webpack
if (production) webpack(config).run(buildCompleteHandler)
else webpack(config).watch({}, buildCompleteHandler)

function buildCompleteHandler (error, stats) {
  // stop on a fatal error
  if (error) {
    console.log(chalk.red(error))
    return 1
  }

  // get build stats
  const buildStats = stats.toJson()

  // show build errors
  if (buildStats.errors.length) {
    console.log(chalk.yellow('Errors:'))
    return buildStats.errors.map(error => console.log(chalk.red(error)))
  }

  // show build warnings
  if (buildStats.warnings.length) {
    console.log(chalk.yellow('Warnings:'))
    buildStats.warnings.map(warning => console.log(chalk.red(warning)))
  }

  // get built javascript and css assets
  let mainAssets = buildStats.assetsByChunkName.main

  // get names of bundles
  let bundleName = mainAssets.filter((asset) => {
    return (asset.indexOf('.js') > -1)
  })[0]
  let styleName = mainAssets.filter((asset) => {
    return (asset.indexOf('.css') > -1)
  })[0]

  // create index.html with paths to built bundles
  fs.readFile('./src/index.html', 'utf8', (readError, markup) => {
    if (readError) return console.log(chalk.red(readError))

    // load html into cheerio
    const $ = cheerio.load(markup)

    // add the style tag to the head
    $('head').append('<link rel="stylesheet" href="assets/' + styleName + '">')
    $('body').append('<script src="assets/' + bundleName + '"></script>')

    // write modified html index to distribution directory
    fs.writeFile('./dist/ui/index.html', $.html(), 'utf8', (writeError) => {
      if (writeError) return console.log(chalk.red(writeError))
    })
  })

  // notify build complete
  console.log(chalk.green('Build complete'))

  return 0
}
