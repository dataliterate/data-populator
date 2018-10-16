/**
 * Actions
 *
 * Provides functionality to extract, parse and resolve actions.
 */

import * as Placeholders from './placeholders'
import log from './log'

/**
 * Extracts actions from the string, e.g. ... #show({firstName}.length > 3)
 *
 * @param {String} string
 * @returns {Array}
 */
export function extractActions (string) {

  // get individual actions
  let actionStrings = string.match(/#\w*\[([^\]]+)]/g) || []

  // parse actions
  let extractedActions = actionStrings.map((actionString) => {
    return parseAction(actionString)
  })

  return extractedActions
}

/**
 * Parses the action string, #run({firstName}.length > 3, fnToRun)
 *
 * @param {String} actionString
 * @returns {Object}
 *
 * returned action: {
 *   string: {String},
 *   command: {String},
 *   condition: {
 *     string: {String},
 *     placeholders: [{
 *         string: {String},
 *         keypath: {String},
 *         filters: {Array},
 *         substitute: {String},
 *         placeholders: {Array}
 *       }]
 *   },
 *   params: [{
 *     string: {String},
 *     placeholders: {Array as for condition},
 *   }]
 * }
 */
export function parseAction (actionString) {

  // keep full action string
  // used later on when executing actions
  let fullActionString = actionString

  // get command
  let command = actionString.match(/#(\w+)/g)[0]

  // remove command from string
  actionString = actionString.substring(command.length + 1, actionString.length - 1)

  // remove # from command string
  command = command.substring(1)

  // split action string into components
  let actionComponents = actionString.split(/(?![^(]*\)),/g)

  // get condition string
  let conditionString = actionComponents[0]

  // extract placeholders in condition
  let conditionPlaceholders = Placeholders.extractPlaceholders(conditionString)

  // get params
  actionComponents.shift()
  let params = actionComponents.map((paramString) => {

    // get placeholders in param
    let paramPlaceholders = Placeholders.extractPlaceholders(paramString)

    // return complete param object with placeholders
    return {
      string: paramString.trim(),
      placeholders: paramPlaceholders
    }
  })

  // prepare action
  let action = {
    string: fullActionString,
    command: command,
    condition: {
      string: conditionString,
      placeholders: conditionPlaceholders
    },
    params: params
  }

  return action
}

/**
 * Resolves the placeholders in the action with the supplied data.
 *
 * @param action {Object}
 * @param data {Object}
 */
export function resolveAction (action, data) {

  // copy action object
  action = Object.assign({}, action)

  // create populated condition string
  let populatedConditionString = action.condition.string
  action.condition.placeholders.forEach((placeholder) => {

    // populate placeholder found in the condition string
    let populatedPlaceholder = Placeholders.populatePlaceholder(placeholder, data, 'null')

    // replace original placeholder string
    populatedConditionString = populatedConditionString.replace(placeholder.string, populatedPlaceholder)
  })
  action.condition = populatedConditionString

  // populate params
  let populatedParams = action.params.map((param) => {

    // create populated param string
    let populatedParamString = param.string
    param.placeholders.forEach((placeholder) => {

      // populate placeholder found in the param string
      let populatedPlaceholder = Placeholders.populatePlaceholder(placeholder, data, 'null')

      // replace original placeholder string
      populatedParamString = populatedParamString.replace(placeholder.string, populatedPlaceholder)
    })

    return populatedParamString
  })
  action.params = populatedParams

  // evaluate condition
  let condition
  try {

    // evaluate condition
    // eslint-disable-next-line no-new-func
    condition = false // (new Function('return ' + populatedConditionString))()

  } catch (e) {

    // signify that there was an error resolving the action
    action.resolveError = e
  }
  action.condition = condition

  return action
}
