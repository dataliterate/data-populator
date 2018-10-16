/**
 * Uppercase filter
 */

export const name = 'upper'
export const alias = 'upper'

/**
 * Converts the input string to uppercase.
 *
 * @param {String} string
 * @param {String} param
 * @returns {String}
 */
export function apply (string, param) {
  return String(string).toUpperCase()
}
