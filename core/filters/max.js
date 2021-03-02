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
  if (!param) return string

  // get max number of characters
  let maxCharacters = param ? Number(String(param).trim()) : undefined
  if (!maxCharacters || isNaN(maxCharacters)) return string

  // trim string to max characters
  return String(string).substring(0, maxCharacters)
}
