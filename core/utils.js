/**
 * Utils
 *
 * Provides utility and miscellaneous functionality.
 */

import uuid from 'uuid/v4'

/**
 * Generates a random integer between min and max inclusive.
 *
 * @param {Number} min
 * @param {Number} max
 * @returns {Number}
 */
export function randomInteger(min, max) {
  return Math.floor(Math.random() * (max - min)) + min
}

/**
 * Capitalize first letter of string.
 *
 * @param {String} string
 * @param {String}
 */
export function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

/**
 * Checks if url is valid.
 *
 * @param {String} url
 * @param {Boolean}
 */
export function isValidURL(url, http) {
  if (http) {
    if (
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g.test(
        url
      )
    ) {
      return true
    } else {
      return false
    }
  } else {
    if (
      /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/g.test(
        url
      )
    ) {
      return true
    } else {
      return false
    }
  }
}

/**
 * Substitutes the placeholders in the string using the provided values.
 *
 * @param {String} string - String with placeholders in the {placeholder} format.
 * @param {Object} values - Object with values to substitute for placeholders.
 * @returns {String} - String with placeholders substituted for values.
 */
export function mergeStringWithValues(string, values) {
  // get properties in values
  let properties = Object.keys(values)

  properties.forEach(function (property) {
    // escape regex
    let sanitisedProperty = property.replace(/([.*+?^=!:${}()|[\]/\\])/g, '\\$1')
    sanitisedProperty = '{' + sanitisedProperty + '}'

    // build regex
    let exp = RegExp(sanitisedProperty, 'g')

    // replace instances of property placeholder with value
    string = string.replace(exp, values[property])
  })

  return string
}

/**
 * Parses the string and returns the value of the correct type.
 *
 * @param {String} value
 * @returns {*}
 */
export function parsePrimitives(value) {
  if (value === '') {
    return value
  } else if (value === 'true' || value === '1') {
    value = true
  } else if (value === 'false' || value === '0') {
    value = false
  } else if (value === 'null') {
    value = null
  } else if (value === 'undefined') {
    value = undefined
  } else if (!isNaN(value) && value !== '') {
    value = parseFloat(value)
  }

  return value
}

/**
 * Generates a new UUID.
 */
export function generateUUID() {
  return uuid()
}

/**
 * Access object by string.
 *
 * @param {Object} object
 * @param {String} string
 * @param {Object}
 */
export function accessObjectByString(object, string) {
  try {
    let newObject = JSON.parse(JSON.stringify(object))
    if (string && string.length) {
      string = string.replace(/\[(\w+)\]/g, '.$1') // convert indices to properties e.g [0] => .0
      string = string.replace(/^\./, '') // strip leading dot

      let splitString = getArrayForStringPath(string)
      for (let i = 0; i < splitString.length; i++) {
        let key = splitString[i]
        newObject = newObject[key]
      }
    }

    return newObject
  } catch (e) {}
}

/**
 * Returns an array representing the path. Handles property names containing '.'
 *
 * @param {String} stringPath
 */
export function getArrayForStringPath(stringPath) {
  const items = []

  let currentItem = ''
  let insideQuotes = false
  for (let i = 0; i < stringPath.length; i++) {
    const char = stringPath[i]

    if (char === '.') {
      if (!insideQuotes) {
        if (currentItem.length) {
          items.push(currentItem)
          currentItem = ''
        }
      } else {
        currentItem += char
      }
    } else if (char === '`') {
      insideQuotes = !insideQuotes
    } else {
      currentItem += char
    }

    if (i === stringPath.length - 1 && currentItem.length) {
      items.push(currentItem)
    }
  }

  return items
}

export function objectSatisfiesConditions(obj, conditions) {
  if (!obj || !conditions) return false

  // Check all conditions
  const conditionKeys = Object.keys(conditions)
  for (let conditionKey of conditionKeys) {
    const conditionValue = conditions[conditionKey]

    // Nested conditions object
    if (typeof conditionValue === 'object') {
      if (!objectSatisfiesConditions(obj[conditionKey], conditionValue)) return false
    }

    // Required value for key
    else {
      // Boolean checks
      if (typeof conditionValue === 'boolean') {
        if (!!obj[conditionKey] !== conditionValue) return false
      }
      // Specific values
      else {
        if (obj[conditionKey] !== conditionValue) return false
      }
    }
  }

  return true
}

export function arrayBufferToBase64(arrayBuffer) {
  let base64 = ''
  let encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  let bytes = new Uint8Array(arrayBuffer)
  let byteLength = bytes.byteLength
  let byteRemainder = byteLength % 3
  let mainLength = byteLength - byteRemainder
  let a, b, c, d
  let chunk
  // Main loop deals with bytes in chunks of 3
  for (let i = 0; i < mainLength; i = i + 3) {
    // Combine the three bytes into a single integer
    chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2]
    // Use bitmasks to extract 6-bit segments from the triplet
    a = (chunk & 16515072) >> 18 // 16515072 = (2^6 - 1) << 18
    b = (chunk & 258048) >> 12 // 258048   = (2^6 - 1) << 12
    c = (chunk & 4032) >> 6 // 4032     = (2^6 - 1) << 6
    d = chunk & 63 // 63       = 2^6 - 1
    // Convert the raw binary segments to the appropriate ASCII encoding
    base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d]
  }
  // Deal with the remaining bytes and padding
  if (byteRemainder === 1) {
    chunk = bytes[mainLength]
    a = (chunk & 252) >> 2 // 252 = (2^6 - 1) << 2
    // Set the 4 least significant bits to zero
    b = (chunk & 3) << 4 // 3   = 2^2 - 1
    base64 += encodings[a] + encodings[b] + '=='
  } else if (byteRemainder === 2) {
    chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1]
    a = (chunk & 64512) >> 10 // 64512 = (2^6 - 1) << 10
    b = (chunk & 1008) >> 4 // 1008  = (2^6 - 1) << 4
    // Set the 2 least significant bits to zero
    c = (chunk & 15) << 2 // 15    = 2^4 - 1
    base64 += encodings[a] + encodings[b] + encodings[c] + '='
  }
  return base64
}
