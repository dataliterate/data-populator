/**
 * Args library
 *
 * Provides functionality to extract and parse args.
 */


import commandLineArgs from 'command-line-args'


/**
 * Extracts standard CLI-style arguments from a string. First removes placeholders
 * from the string.
 *
 * @param {string} string
 * @param {Array} definitions
 */
export function extractArgs(string, definitions) {

  //remove placeholders from string
  string = string.replace(/(?![^(]*\)){([^}]+)}/g, '')

  //parse args in the remaining string
  return parseArgs(string, definitions)
}


/**
 * Parses any args found in the provided string using the given definitions.
 *
 * @param {string} string
 * @param {Array} definitions - object containing the possible option definitions to look for
 *
 * definitions: [{
 *   name: {string}, - the full name of the arg, used as arg name in extracted args
 *   alias: {string} - the short name of the arg, e.g. l, v, etc
 * }]
 */
export function parseArgs(string, definitions) {

  //parse args using the provided definitions
  return commandLineArgs(definitions, string.split(/\s+/g))
}