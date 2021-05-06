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

  //check if the string is actually a valid date, and if not escape
  if (!moment(string).isValid())
  {
    return  string
  }

//get date formatting rules
let dateFormat = param ? String(param) : 'YYYY-MM-DD'

return moment(string).format(dateFormat);
}



  