/**
 * Capitalize filter
 */

export const name = 'capitalize'
export const alias = 'capitalize'

/**
 * Converts the input string lowercase with the first char capitalized.
 *
 * @param {String} string
 * @param {String} param
 * @returns {String}
 */
export function apply(string, param) {
  return String(string).charAt(0).toUpperCase() + String(string).slice(1).toLowerCase()
}
