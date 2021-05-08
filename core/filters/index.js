/**
 * Filters
 *
 * Provides functionality extract, parse and apply filters.
 */

import * as JoinFilter from './join'
import * as MaxFilter from './max'
import * as UppercaseFilter from './uppercase'
import * as LowercaseFilter from './lowercase'
import * as CapitalizeFilter from './capitalize'
import * as NumberFilter from './numeral'
import * as UnitFilter from './unit'
import * as ConvertFilter from './convert'
import * as DateFilter from './date'


let filters = [JoinFilter,
               MaxFilter, 
               UppercaseFilter, 
               LowercaseFilter, 
               CapitalizeFilter, 
               NumberFilter,
               UnitFilter,
               ConvertFilter,
               DateFilter]

/**
 * Extracts filters from the placeholder string, e.g. firstName, lastName | & •
 *
 * @param {String} string
 * @returns {Array}
 */
export function extractFilters(string) {
  // prepare filters array
  let extractedFilters = []

  // get filters string, e.g. & • | upper
  // remove bracketed nested placeholders first, then split on first pipe
  let filtersString = string.replace(/\((.*)\)/g, '').split(/\|(.+)?/g)[1]
  if (filtersString && filtersString.length) {
    // get individual filters
    let filterStrings = filtersString.split(/\|/g)

    // parse filters
    extractedFilters = filterStrings.map(filterString => {
      return parseFilter(filterString)
    })
  }

  return extractedFilters
}

/**
 * Parses the filter string, e.g. & •
 *
 * @param {String} filterString
 * @returns {Object}
 *
 * returned filter: {
 *   command: {String},
 *   param: {String}
 * }
 */
export function parseFilter(filterString) {
  // remove leading spaces in filter string
  while (filterString.substring(0, 1) === ' ') {
    filterString = filterString.substring(1, filterString.length)
  }

  // get command
  let command = null
  for (let i = 0; i < filters.length; i++) {
    if (filterString.startsWith(filters[i].name)) {
      command = filters[i].name
      break
    } else if (filterString.startsWith(filters[i].alias)) {
      command = filters[i].alias
      break
    }
  }

  if (!command || !command.length) return {}

  // get param by removing the command from the string
  let param = filterString.substring(command.length)

  // create filter
  let filter = {
    command: command.trim()
  }

  // add param to filter
  if (param.length && param.trim().length) filter.param = param

  return filter
}

/**
 * Removes the filters part of a placeholder content string.
 *
 * @param {String} string
 * @returns {String}
 */
export function removeFiltersString(string) {
  // get filters string, e.g. & • | upper
  // remove bracketed nested placeholders first, then split on first pipe
  let filtersString = string.replace(/\((.*)\)/g, '').split(/\|(.+)?/g)[1]

  // remove filters string from string
  return string.replace('|' + filtersString, '')
}

/**
 * Applies the supplied filter to the input to produce an output.
 *
 * @param {Object} filter
 * @param {Array/String} input
 */
export function applyFilter(filter, input) {
  // find apply function for the specified filter
  let applyFunction
  for (let i = 0; i < filters.length; i++) {
    if (filters[i].name === filter.command || filters[i].alias === filter.command) {
      applyFunction = filters[i].apply
    }
  }

  // return input back as the apply function doesn't exist
  if (!applyFunction) return input

  // apply filter to input, passing in the param
  return applyFunction(input, filter.param)
}
