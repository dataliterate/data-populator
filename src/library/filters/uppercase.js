/**
 * Uppercase filter
 */


export const name = 'upper'
export const alias = ''


/**
 * Converts the input string to uppercase.
 *
 * @param {string} string
 * @param {string} param
 * @returns {string}
 */
export function apply(string, param) {
  return String(string).toUpperCase()
}