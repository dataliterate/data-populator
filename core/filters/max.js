/**
 * Max length filter
 */

export const name = 'max'
export const alias = 'max'

/**
 * Trims the input string to a max number of characters.
 *
 * @param {String} string
 * @param {String} param
 * @returns {String}
 */
export function apply(string, param) {
  if (!string) return

  // get max number of characters
  let maxCharacters = Number(param.trim())

  // trim string to max characters
  return string.substring(0, maxCharacters)
}
