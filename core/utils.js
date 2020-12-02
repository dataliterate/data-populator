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
