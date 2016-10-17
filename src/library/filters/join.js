/**
 * Join filter
 */


export const name = 'join'
export const alias = '&'


/**
 * Joins an array of strings.
 *
 * @param {Array} inputStrings
 * @param {string} param
 * @returns {string}
 */
export function apply(inputStrings, param) {

  //make sure that input strings is an array
  if (!(inputStrings instanceof Array)) return inputStrings

  //get delimiter
  let delimiter = param

  //filter out empty strings
  inputStrings = inputStrings.filter((inputString) => {
    return inputString && inputString.length
  })

  //join strings using delimiter
  return inputStrings.join(delimiter)
}