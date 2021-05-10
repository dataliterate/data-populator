/**
 * Units filter - append a unit to a value e.g. 200 Mbps, 10 lbs, etc.
 */

import numeral from 'numeral'
import "numeral/locales/";

export const name = 'unit'
export const alias = 'unit'

/**
 * Apply various numerical formats
 *
 * @param {String} string
 * @param {String} param
 * @returns {String}
 */

function isNumeric(str) {
  if (typeof str != "string") return false // we only process strings!  
  return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
         !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}


export function apply(string, param) {

   //if there is no string return an empty ""
  if (!string) return ""

  if (typeof string === 'number' || isNumeric(string)){
    //its a number, we are good!
  }
  else{
    //it could be a numeral or date?
    let numeralTest = numeral(string);
    let type = typeof(numeralTest.value());
    if ( type !== 'number' )
    {
     //instead of 'undefined', return an empty string
      if (typeof string !== 'undefined') return string
      else return ""
    }
  }

// if we have no params, we can default to 'X' 
let format = param ? String(param) : ' X' 
//trim leading space character
format = format.substring(1);


//format and return the value
return (string + format);
}
