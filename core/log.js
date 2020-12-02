/**
 * Log
 *
 * Convenience logging functionality.
 */

export default function log(...strings) {
  if (!strings.length) return

  let indent = ''
  if (strings[0][0] === '>') {
    for (let i = 0; i < strings[0].length; ++i) {
      indent += '   '
    }
    strings.shift()
  }

  strings = strings.map(string => {
    if (string instanceof Object && !(string instanceof Error)) {
      return JSON.stringify(string, null, 2)
    } else {
      return string
    }
  })

  if (process.env.NODE_ENV === 'development') {
    console.log(`datapop |`, indent + strings.join(' ').trim())
  }
}
