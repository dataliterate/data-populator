/**
 * Date / Timestamp filter
 */
import moment from 'moment/min/moment-with-locales';

export const name = 'date'
export const alias = 'date'

/**
 * Convert timestamps into formatted dates
 *
 * @param {String} string
 * @param {String} param
 * @returns {String}
 */

export function apply(string, param) {



  if (!string) return
  
  let params
  let timestamp = string;
  //split params but keep delimeters (using lookahead)
  if(param) params = param.split(/(?=[.,:; ])|(?<=[.,:; ])/g);

  let localeString = "none"; //default
  let formatString = "YYYY-MM-DD"; //default
  let hasLocale = false;
  let localesIndex = -1;
  let localesArray = Object.values(moment.locales() ); //get an array of the locales to check against

  //default to english
  moment.locale('en');

    // ignore empty paramters
    if (param) {
      // check if we have a locale string and if so, set locale.
      params.forEach(function(item, index){
        if (!hasLocale){
          //trim extra characters like spaces, etc.
          localeString = item.trim();  
          //check if string matches a valid locale:
          if( localesArray.includes(localeString) )
          {
            hasLocale = true;
            localesIndex = index;
          }
        }
      })

      if (hasLocale){
        //set the locale and trime the params array.
        // numeral.locale(localeString);
        moment.locale(localeString);
        params.splice(localesIndex, 1);
      }

      //rejoin and trim string:
      formatString = params.join('').trim();
    }
  
  //get date formatting rules
  // if we have no params, we can default to YYYY-MM-DD
  let dateFormat = formatString ? String(formatString) : 'YYYY-MM-DD'

 
  
  //check if the string is actually a valid date, a unix timestamp, or an invalid entry
  if (!moment(timestamp).isValid())
  {
    //catch non numerical subsitutions and escape.
    if (isNaN(timestamp) === true) {
      return  timestamp      
    }
    else{
      //substitutions might be in string format, so make sure to convert them to integers
      timestamp = parseInt(timestamp);
    }
  }

  //Check for Relative timestamps
  if (dateFormat === "fromNow"){
    return moment(timestamp).fromNow();
  }

  return moment(timestamp).format(dateFormat);
}



  