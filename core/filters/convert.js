/**
 * Convert formats filter
 */

export const name = 'convert'
export const alias = 'convert'

/**
 * convert between metrics (e.g m to km, ms to s, etc.)
 *
 * @param {String} string
 * @param {String} param
 * @returns {String}
 */

export function apply(string, param) {

   //if there is no string return an empty ""
  if (!string) return ""
  if (!param) return string

  //catch non numerical subsitutions and escape.
  if (isNaN(string) === true) {
   
    //instead of 'undefined', return an empty string
    if (typeof string !== 'undefined') return string
    // if (string !== undefined )return string
    else return ""
  }

//default to 1 if no params (redundant??)
let factor = param ? parseInt(param) : 1

let newValue = parseInt(string) * param
return newValue;
}
