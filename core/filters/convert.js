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

var countDecimals = function (value) {
  if(Math.floor(value) === value) return 0;
  return value.toString().split(".")[1].length || 0;
  }

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

  //count the decimals place in the input:
  let decimalPlaces = countDecimals(Number(string));

  let newValue = Number(string) * param
  //trim the decimal places to match the original input 
  return newValue.toFixed(decimalPlaces)
}
