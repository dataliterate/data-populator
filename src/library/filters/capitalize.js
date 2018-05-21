/**
 * Capitalize filter
 */


export const name = 'capitalize'
export const alias = 'capitalize'


/**
 * Converts the input string lowercase with the first char capitalized.
 *
 * @param {string} string
 * @param {string} param
 * @returns {string}
 */
export function apply(string, param) {
  return String(string).charAt(0) + String(string).slice(1).toLowerCase()
  console.log(string)
}
