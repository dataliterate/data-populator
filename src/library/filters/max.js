/**
 * Max length filter
 */


export const name = 'max'
export const alias = ''


/**
 * Trims the input string to a max number of characters.
 *
 * @param {string} string
 * @param {string} param
 * @returns {string}
 */
export function apply(string, param) {
  if (!string) return

  //get max number of characters
  let maxCharacters = Number(param.trim())

  //trim string to max characters
  return string.substring(0, maxCharacters)
}