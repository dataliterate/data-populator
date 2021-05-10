/**
 * Number format filter
 */

import { has, trim } from 'lodash';
import numeral from 'numeral'
import "numeral/locales/";

export const name = 'numeral'
export const alias = 'numeral'

/**
 * Apply various numerical and locale formats
 *
 * @param {String} string
 * @param {String} param
 * @returns {String}
 */

export function apply(string, param) {

  if (!string) return

  //catch non numerical subsitutions and escape.
  if (isNaN(string) === true) return string;
  // catch empty paramters
  if (!param) return string


  let params = param.split(" "); 

  let localeString = "none"; //default
  let formatString = "0.0"; //default
  let hasLocale = false;
  let localesIndex = -1;

  // check if we have a locale string and if so, set locale.
  params.forEach(function(item, index){
    if (!hasLocale){
      //trim extra characters like spaces, etc.
      localeString = item.trim();  
      if( localeString in numeral.locales)
      {
        hasLocale = true;
        localesIndex = index;
      }
    }
  })
  
  if (hasLocale){
    //set the locale and trime the params array.
    numeral.locale(localeString);
    params.splice(localesIndex, 1);
  }

  //rejoin and trim string:
  formatString = params.join('').trim();
  
  // if we have no params, we can default to '0,0' 
  let numFormat = formatString ? String(formatString) : '0,0' 
  
  //format and return the value
  return numeral(string).format(numFormat);
}
