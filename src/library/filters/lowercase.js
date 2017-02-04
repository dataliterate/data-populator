/**
 * Lowercase filter
 */


export const name = 'lower'
export const alias = ''


/**
 * Converts the input string to lowercase.
 *
 * @param {string} string
 * @param {string} param
 * @returns {string}
 */
export function apply(string, param) {
  return String(string).toLowerCase()
}