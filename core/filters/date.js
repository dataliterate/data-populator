/**
 * Date / Timestamp filter
 */
import moment from 'moment'

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

  let timestamp = string;

  //get date formatting rules
  // if we have no params, we can default to YYYY-MM-DD
  let dateFormat = param ? String(param.trim() ) : 'YYYY-MM-DD'


  //check if the string is actually a valid date, a unix timestamp, or an invalid entry
  if (!moment(timestamp).isValid())
  {
    //catch non numerical subsitutions and escape.
    if (isNaN(timestamp) === true) {
      return  timestamp      
    }
    else{
      //substitutions might be in string format, so make sure to convert them to integers
      timestamp = moment(parseInt(timestamp) ).format(dateFormat);
    }
  }

return moment(timestamp).format(dateFormat);
}



  