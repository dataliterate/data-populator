/**
 * Units filter - append a unit to a value e.g. 200 Mbps, 10 lbs, etc.
 */

export const name = 'unit'
export const alias = 'unit'

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
let format = param ? String(param) : ' X' 
//trim leading space character
format = format.substring(1);


//format and return the value
return (string + format);
}
