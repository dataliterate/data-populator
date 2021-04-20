/**
 * Date / Timestamp filter
 */
import moment from 'moment'

export const name = 'date'
export const alias = 'date'

/**
 * Trims the input string to a max number of characters.
 *
 * @param {String} string
 * @param {String} param
 * @returns {String}
 */

export function apply(string, param) {

//   if (!string) return

// if we have no params, we can default to YYYY-MM-DD
//if (!param) return string


  if (!string) {
    console.log("no string...")
    return
    }


  if (!param) {
        console.log("no params...")
        // return string
    }




//TESTING:
console.log("string:" + string);
if (typeof string === 'string' || string instanceof String)
{console.log('its a string');
}
if (typeof string === 'number' || string instanceof number)
{console.log('its a number');
}


//get date formatting rules
let dateFormat = param ? String(param) : 'YYYY-MM-DD'
return moment(string).format(dateFormat);


// return moment.unix(1293683278).format('YYYY-MM-DD');
}



  