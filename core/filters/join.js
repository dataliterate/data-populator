/**
 * Join filter
 */

export const name = 'join'
export const alias = '&'

/**
 * Joins an array of strings.
 *
 * @param {Array} inputStrings
 * @param {String} param
 * @returns {String}
 */
export function apply(inputStrings, param) {
  // make sure that input strings is an array
  if (!(inputStrings instanceof Array)) return inputStrings

  // TODO fix this upstream, in populator
  inputStrings = inputStrings.map(str => {
    if (str instanceof Object && str.hasOwnProperty('hasValueForKey')) {
      return str.populated
    } else {
      return str
    }
  })

  // get delimiter
  let delimiter = param

  // filter out empty strings
  inputStrings = inputStrings.filter(inputString => {
    return inputString && inputString.length
  })

  // join strings using delimiter
  return inputStrings.join(delimiter)
}
