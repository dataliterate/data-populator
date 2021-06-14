/**
 * Date / Timestamp filter
 */
import moment from 'moment';
import 'moment/min/locales';

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
  
  let matches
  let indexStart = -1;
  let indexEnd = -1;
  let timestamp = string;
    
  //Seperate out locales within a < > 
  
  // regex with lookahead (Sketch Uses Safari for its JS, and Safari doesn't currently support lookbehind)
  //  const regex = /(?<=\<).+?(?=\>)/g;

  //regex without lookahead
  const regex = /\<.+?\>/;

  if(param) matches = param.match(regex);

  let localeString = "none"; //default
  let formatString = "YYYY-MM-DD"; //default
  let hasLocale = false;
  let localesArray = Object.values(moment.locales() ); //get an array of the locales to check against

  //default to english
  moment.locale('en');

  if (matches){
    localeString = String(matches).slice(1,-1);
    indexStart = param.indexOf('<');
    indexEnd = param.indexOf('>');
    param = param.slice(0, indexStart) + param.slice(indexEnd+1);
  
    // check if we have a locale string and if so, set locale.
    if( localesArray.includes(localeString) )
    {
      hasLocale = true;
      moment.locale(localeString);
    }
  }
  
  //get date formatting rules
  // if we have no params, we can default to YYYY-MM-DD
  formatString = param.trim();
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



  