/**
 * Metrics filter
 */

export const name = 'metric'
export const alias = 'metric'

/**
 * Apply various numerical formats
 *
 * @param {String} string
 * @param {String} param
 * @returns {String}
 */

export function apply(string, param) {

   //if there is no string return an empty ""
  if (!string) return ""

  //catch non numerical subsitutions and escape.
  if (isNaN(string) === true) {
   
    //instead of 'undefined', return an empty string
    if (typeof string !== 'undefined') return string
    // if (string !== undefined )return string
    else return ""
  }

// if we have no params, we can default to 'X' 
let format = param ? String(param) : 'X' 


//format and return the value
return (string + " " + format);
}
