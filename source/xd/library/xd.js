/**
 * XD
 *
 * Trick to use XD require and not affect the build process.
 */

export default function (name) {

  let xdRequire = null

  let require = xdRequire || function () { return {} }

  let components = name.split('.')
  let mainModule = components.shift()

  let resolved = require(mainModule) || {}
  components.forEach(component => {
    resolved = resolved[component] || {}
  })

  return resolved
}
