/**
 * Placeholders
 *
 * Provides functionality to extract, parse and populate placeholders.
 */

import * as Filters from './filters'
import * as Utils from './utils'

/**
 * Extracts placeholders from a string. Placeholders are identified by {}.
 *
 * @param {String} string
 * @returns {Array}
 */
export function extractPlaceholders(string) {
  // get placeholders
  let placeholders = []

  // match placeholders identified by {}
  let regex = /(?![^(]*\)|[^[]*]){([^}]+)}/g
  let match = regex.exec(string)
  while (match) {
    // parse placeholder
    if (match[0].split('{').length - 1 === match[0].split('}').length - 1) {
      let parsedPlaceholder = parsePlaceholder(match[0])

      // add to placeholders array
      placeholders.push(parsedPlaceholder)
    }

    // parse next placeholder
    match = regex.exec(string)
  }

  return placeholders
}

/**
 * Parses the placeholder. The string contains the content of the placeholder
 * without being wrapped in () or {}, e.g. firstName, lastName | & •
 *
 * @param {String} placeholderString
 * @returns {Object}
 *
 * Example placeholders (shown with {}):
 *
 * - {firstName}, {name.first} - John
 * - {firstName, lastName | & • } - John • Doe
 * - {(lastName?, firstName | &, ), DOB | & born on } - Doe, John born on 14/07/1970
 * - {firstName | upper} - JOHN
 * - {firstName | upper | max 2} - JO
 * - {(firstName | upper | max 2), (lastName | max 1) | & • } - JO • D
 * - {keypath?} - The default substitute
 * - {keypath?not available} - not available
 * - {firstName?First name not available, lastName?No last name, DOB? | & - }
 * - TODO: quotation marks {firstName?"First name, not | available \" ,,", lastName?'No, \' | last name', DOB? | & - }
 *   TODO:                '{firstName?"First name, not | available \\" ,,", lastName?\'No, \\\' | last name\', DOB? | & - }'
 *
 * Example nesting:
 * - {(lastName?'', firstName | &, ), DOB | & born on }
 *   - (lastName?'', firstName | &, )
 *     - lastName?''
 *     - firstName
 *   - DOB
 *
 * returned placeholder format: [{
 *   string: {String}, - the original text of the placeholder, e.g. {name.first}
 *   keypath: {String}, - the path to the data, e.g. name.first
 *   filters: {Array}, - filters applied through the pipe character, adding in the correct order
 *   substitute: {String}, - string to use in case the placeholder resolves to an empty string
 *   placeholders: {Array} - nested placeholders with the same format as this placeholder
 * }]
 *
 * Example parsed placeholders:
 *
 * [
 *   {
 *     "string":"{firstName}",
 *     "keypath":"firstName"
 *   },
 *
 *   {
 *     "string":"{name.first}",
 *     "keypath":"name.first"
 *   },
 *
 *   {
 *     "string":"{firstName, lastName | & • }",
 *     "filters":[
 *       {
 *         "command":"&",
 *         "param":" • "
 *       }
 *     ],
 *     "placeholders":[
 *       {
 *         "string":"firstName",
 *         "keypath":"firstName"
 *       },
 *       {
 *         "string":"lastName",
 *         "keypath":"lastName"
 *       }
 *     ]
 *   },
 *   {
 *     "string":"{firstName | upper}",
 *     "filters":[
 *       {
 *         "command":"upper"
 *       }
 *     ],
 *     "keypath":"firstName"
 *   },
 *   {
 *     "string":"{firstName | upper | max 2}",
 *     "filters":[
 *       {
 *         "command":"upper"
 *       },
 *       {
 *         "command":"max",
 *         "param":" 2"
 *       }
 *     ],
 *     "keypath":"firstName"
 *   },
 *   {
 *     "string":"{(firstName | upper | max 2), (lastName | max 1) | & • }",
 *     "filters":[
 *       {
 *         "command":"&",
 *         "param":" • "
 *
 *       }
 *     ],
 *     "placeholders":[
 *       {
 *         "string":"(firstName | upper | max 2)",
 *         "filters":[
 *           {
 *             "command":"upper"
 *           },
 *           {
 *             "command":"max",
 *             "param":" 2"
 *           }
 *         ],
 *         "keypath":"firstName"
 *       },
 *       {
 *         "string":"(lastName | max 1)",
 *         "filters":[
 *           {
 *             "command":"max",
 *             "param":" 1"
 *           }
 *         ],
 *         "keypath":"lastName"
 *       }
 *     ]
 *   },
 *   {
 *     "string":"{keypath?}",
 *     "keypath":"keypath",
 *     "substitute":true
 *   },
 *   {
 *
 *     "string":"{keypath?not available}",
 *     "keypath":"keypath",
 *     "substitute":"not available"
 *   },
 *   {
 *
 *     "string":"{firstName?First name not available, lastName?No last name, DOB? | & - }",
 *     "filters":[
 *       {
 *         "command":"&",
 *         "param":" - "
 *
 *       }
 *     ],
 *     "placeholders":[
 *       {
 *         "string":"firstName?First name not available",
 *         "keypath":"firstName",
 *         "substitute":"First name not available"
 *       },
 *       {
 *         "string":"lastName?No last name",
 *         "keypath":"lastName",
 *         "substitute":"No last name"
 *       },
 *       {
 *         "string":"DOB?",
 *         "keypath":"DOB",
 *         "substitute":true
 *       }
 *     ]
 *   }
 * ]
 */
export function parsePlaceholder(placeholderString) {
  // prepare placeholder
  let placeholder = {
    string: placeholderString
  }

  // get placeholder content
  let placeholderContent = placeholderString
  if (isGroupedPlaceholder(placeholderString) || isRootPlaceholder(placeholderString)) {
    placeholderContent = placeholderContent.substr(1, placeholderContent.length - 2)
  }

  // get filters
  let filters = Filters.extractFilters(placeholderContent)
  if (filters.length) {
    // get placeholder filters
    placeholder.filters = filters

    // remove filters string from placeholder content
    placeholderContent = Filters.removeFiltersString(placeholderContent)
  }

  // get nested placeholders
  let groupingLevel = 0
  let nestedPlaceholders = []
  let buffer = ''
  for (let i = 0; i < placeholderContent.length; i++) {
    // get character of content
    let char = placeholderContent[i]

    // adjust placeholder grouping level
    if (char === '(') groupingLevel++
    if (char === ')') groupingLevel--

    // if comma and not nested or if last character
    if ((char === ',' && groupingLevel === 0) || i === placeholderContent.length - 1) {
      // add the character in case it's the last character
      if (char !== ',') buffer += char

      // trim and add placeholder
      nestedPlaceholders.push(buffer.trim())

      // reset placeholder buffer
      buffer = ''
    } else {
      // append the character to buffer
      buffer += char
    }
  }

  // parse nested placeholders if there are more than one or the one is a grouped placeholder
  if (nestedPlaceholders.length > 1 || isGroupedPlaceholder(nestedPlaceholders[0])) {
    // set nested placeholders of the placeholder
    placeholder.placeholders = nestedPlaceholders.map(nestedPlaceholder => {
      // recur to parse nested placeholder
      return parsePlaceholder(nestedPlaceholder)
    })
  }

  // parse a single ungrouped placeholder, the base case for the recursive function
  else if (nestedPlaceholders[0] && nestedPlaceholders[0].length) {
    let nestedPlaceholder = nestedPlaceholders[0]

    // split into components, dividing into the keypath and substitute
    let substituteMarkerIndex = nestedPlaceholder.indexOf('?')
    let placeholderComponents =
      substituteMarkerIndex === -1
        ? [nestedPlaceholder]
        : [
            nestedPlaceholder.slice(0, substituteMarkerIndex),
            nestedPlaceholder.slice(substituteMarkerIndex + 1)
          ]

    // check if has substitute
    if (placeholderComponents.length === 2) {
      // set keypath
      placeholder.keypath = placeholderComponents[0].trim()

      // set substitute
      if (placeholderComponents[1]) {
        placeholder.substitute = placeholderComponents[1].trim()
      } else {
        // set to true to signify that a default substitute should be used
        placeholder.substitute = true
      }
    } else {
      // set keypath to the placeholder itself since there is no substitute
      placeholder.keypath = nestedPlaceholder
    }
  }

  return placeholder
}

/**
 * Populates a placeholder with data, returning the populated string.
 *
 * @param {Object} placeholder
 * @param {Object} data
 * @param {String} defaultSubstitute
 * @returns {String}
 */
export function populatePlaceholder(placeholder, data, defaultSubstitute) {
  // prepare populated string/array
  let populated
  let hasValueForKey = true

  // populate nested placeholders
  if (placeholder.placeholders) {
    // populate and add to array of populated nested placeholders
    populated = placeholder.placeholders.map(nestedPlaceholder => {
      return populatePlaceholder(nestedPlaceholder, data, defaultSubstitute)
    })
  }

  // no nested placeholders, this is the base case
  else {
    // populate with data for keypath
    populated = Utils.accessObjectByString(data, placeholder.keypath)

    //Check to see if 'populated' is a numeric 0
    if( typeof(populated) === 'number' && populated === 0)
    {
      //convert to a string 0 as numeric zero will fail a test like - if (!populated){do something}
      populated = "0";
    } 
    
    // check if substitute is needed
    //NOTE - this check will fail for a numeric zero.
    if (!populated) {
      hasValueForKey = false

      // true signifies to use default substitute
      if (placeholder.substitute === true) {
        populated = defaultSubstitute
      }

      // use specified substitute
      else if (placeholder.substitute && placeholder.substitute.length) {
        if (placeholder.substitute[0] === '?') {
          // iterate over substitute stack in the given order
          // the first substitute key that returns data is used
          let substituteStack = placeholder.substitute.substring(1).split('?')
          for (let i = 0; i < substituteStack.length; ++i) {
            populated = Utils.accessObjectByString(data, substituteStack[i])
            if (populated) break
          }

          // use default if placeholder substitute didn't return any data
          if (!populated) populated = defaultSubstitute
        } else {
          populated = placeholder.substitute
        }
      }

      // return empty string when no substitute should be used
      else {
        populated = ''
      }
    }
  }

  // apply filters
  if (placeholder.filters) {
    placeholder.filters.forEach(filter => {
      populated = Filters.applyFilter(filter, populated)
    })
  }

  // make sure that populated is always a string before returning
  // it could be an array if a filter apply function was not found
  if (populated instanceof Array) {
    populated = populated.join(' ')
  }

  return String(populated)
}

/**
 * Checks if the placeholder is grouped. A placeholder is grouped if it's wrapped
 * within parentheses.
 *
 * @param {String} placeholder
 * @returns {Boolean}
 */
function isGroupedPlaceholder(placeholder) {
  return placeholder && placeholder[0] === '(' && placeholder[placeholder.length - 1] === ')'
}

/**
 * Checks if the placeholder is a root placeholder. A placeholder is root if it's wrapped
 * within {}.
 *
 * @param {String} placeholder
 * @returns {Boolean}
 */
function isRootPlaceholder(placeholder) {
  return placeholder && placeholder[0] === '{' && placeholder[placeholder.length - 1] === '}'
}
