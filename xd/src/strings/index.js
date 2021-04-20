import rawStrings from './strings.json'

let strings = {}

const exportedObject = {
  ...strings,
  get,
  load,
  resolve
}

load(rawStrings)

export default safe(exportedObject)

function safe(target) {
  return new Proxy(target, {
    get(target, name, receiver) {
      if (!Reflect.has(target, name)) {
        return safe(() => '')
      }
      return Reflect.get(target, name, receiver)
    }
  })
}

export function get(path) {
  const pathComponents = path.split(/\./g)

  let found = strings
  pathComponents.forEach(pathComponent => {
    found = found[pathComponent] || {}
  })

  return safe(found)
}

function load(rawStrings) {
  strings = JSON.parse(JSON.stringify(rawStrings))

  function loadStrings(parent) {
    if (!parent) return

    if (typeof parent === 'object') {
      Object.keys(parent).forEach(key => {
        parent[key] = loadStrings(parent[key])
      })

      return parent
    } else {
      return function (params) {
        return resolve(parent, params)
      }
    }
  }

  loadStrings(strings)

  // Export loaded strings
  Object.keys(strings).forEach(key => {
    exportedObject[key] = strings[key]
  })
}

export function resolve(string, params) {
  // Use regex with /g flag to capture all occurrences
  let matchParenthesisRegEx = /(?<!\^){(.+?)}/g

  // Replace references with corresponding value
  string = string.replace(matchParenthesisRegEx, function (match) {
    let key = match.replace('{', '')
    key = key.replace('}', '').trim()

    // Evaluate conditionals, e.g. someKey?stringIfTrue:stringIfFalse
    if (key.indexOf('?') > -1 || key.indexOf(':') > -1) {
      const components = key.split(/[?:]/g)

      const actualKey = components[0]
      const trueValue = key.indexOf('?') > -1 ? components[1] : ''
      const falseValue =
        key.indexOf('?') > -1 ? (key.indexOf(':') > -1 ? components[2] : '') : components[1] || ''

      return params?.[actualKey] ? trueValue : falseValue
    } else {
      return params?.[key] !== undefined ? params?.[key] : ''
    }
  })

  // Replace escaped placeholders
  string = string.replace(/\^{/g, '{')

  return string
}
