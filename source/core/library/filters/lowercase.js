/**
 * Lowercase filter
 */

export const name = 'lower'
export const alias = 'lower'

/**
 * Converts the input string to lowercase.
 *
 * @param {String} string
 * @param {String} param
 * @returns {String}
 */
export function apply (string, param) {
  return String(string).toLowerCase()
}
