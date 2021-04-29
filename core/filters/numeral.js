/**
 * Number format filter
 */

import numeral from 'numeral'
export const name = 'numeral'
export const alias = 'numeral'

/**
 * Apply various numerical formats
 *
 * @param {String} string
 * @param {String} param
 * @returns {String}
 */

export function apply(string, param) {

  if (!string) return

  //catch non numerical subsitutions and escape.
  if (isNaN(string) === true) return string;

// if we have no params, we can default to '0,0' 
let numFormat = param ? String(param) : '0,0' 


//format and return the value
return numeral(string).format(numFormat);

}
