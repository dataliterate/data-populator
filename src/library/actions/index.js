/**
 * Actions library
 *
 * Provides functionality to extract, parse and execute actions.
 */


import Context from '../../context'
import * as Placeholders from '../placeholders'


/**
 * Load action functions
 */
import * as ShowAction from './show'
import * as HideAction from './hide'
import * as LockAction from './lock'
import * as UnlockAction from './unlock'
import * as DeleteAction from './delete'
import * as PluginAction from './plugin'

let actions = [
  ShowAction,
  HideAction,
  LockAction,
  UnlockAction,
  DeleteAction,
  PluginAction
]


/**
 * Perform all actions on a layer.
 *
 * @param {MSLayer} layer
 * @param {Object} data
 */
export function performActions(layer, data) {

  //process conditional actions on the layer
  let actions = extractActions(layer.name())

  //perform actions
  actions.forEach((action) => {
    performAction(action, layer, data)
  })
}


/**
 * Extracts actions from the layer name, e.g. ... #show({firstName}.length > 3)
 *
 * @param {string} string
 * @returns {Array}
 */
export function extractActions(string) {

  //get individual actions
  let actionStrings = string.match(/#\w*\[([^\]]+)]/g) || []

  //parse actions
  let extractedActions = actionStrings.map((actionString) => {
    return parseAction(actionString)
  })

  return extractedActions
}


/**
 * Parses the action string, #run({firstName}.length > 3, fnToRun)
 *
 * @param {string} actionString
 * @returns {Object}
 *
 * returned action: {
 *   string: {string},
 *   command: {string},
 *   condition: {
 *     string: {string},
 *     placeholders: [{
 *         string: {string},
 *         keypath: {string},
 *         filters: {Array},
 *         substitute: {string},
 *         placeholders: {Array}
 *       }]
 *   },
 *   params: [{
 *     string: {string},
 *     placeholders: {Array as for condition},
 *   }]
 * }
 */
export function parseAction(actionString) {

  //keep full action string
  //used later on when executing actions
  let fullActionString = actionString

  //get command
  let command = actionString.match(/#(\w+)/g)[0]

  //remove command from string
  actionString = actionString.substring(command.length + 1, actionString.length - 1)

  //remove # from command string
  command = command.substring(1)

  //split action string into components
  let actionComponents = actionString.split(/(?![^(]*\)),/g)

  //get condition string
  let conditionString = actionComponents[0]

  //extract placeholders in condition
  let conditionPlaceholders = Placeholders.extractPlaceholders(conditionString)

  //get params
  actionComponents.shift()
  let params = actionComponents.map((paramString) => {

    //get placeholders in param
    let paramPlaceholders = Placeholders.extractPlaceholders(paramString)

    //return complete param object with placeholders
    return {
      string: paramString.trim(),
      placeholders: paramPlaceholders
    }
  })

  //prepare action
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
 * Performs the supplied action with the data and layer as input.
 *
 * @param {Object} action
 * @param {MSLayer} layer
 * @param {Object} data
 */
export function performAction(action, layer, data) {

  //find action function for the specified action
  let actionFunction
  for (let i = 0; i < actions.length; i++) {
    if (actions[i].name == action.command || actions[i].alias == action.command) {
      actionFunction = actions[i].perform
    }
  }

  //continue only if action found
  if (!actionFunction) {
    return Context().document.showMessage('Conditional action \'' + action.command + '\' on layer \'' + layer.name() + '\' does not exist.')
  }

  //create populated condition string
  let populatedConditionString = action.condition.string
  action.condition.placeholders.forEach((placeholder) => {

    //populate placeholder found in the condition string
    let populatedPlaceholder = Placeholders.populatePlaceholder(placeholder, data, 'null')

    //replace original placeholder string
    populatedConditionString = populatedConditionString.replace(placeholder.string, populatedPlaceholder)
  })

  //populate params
  let populatedParams = action.params.map((param) => {

    //create populated param string
    let populatedParamString = param.string
    param.placeholders.forEach((placeholder) => {

      //populate placeholder found in the param string
      let populatedPlaceholder = Placeholders.populatePlaceholder(placeholder, data, 'null')

      //replace original placeholder string
      populatedParamString = populatedParamString.replace(placeholder.string, populatedPlaceholder)
    })

    return populatedParamString
  })

  //get layer name without action string
  //used within error messages
  let layerName = layer.name().replace(action.string, '').trim()
  if(!layerName.length) layerName = layer.name()

  //evaluate condition
  let condition
  try {

    //evaluate condition
    condition = (new Function('return ' + populatedConditionString))()

  } catch(e) {

    //show error that action could not be evaluated
    Context().document.showMessage('Conditional action on layer \'' + layerName + '\' could not be evaluated.')
  }

  //perform action
  try {
    actionFunction(condition, layer, populatedParams)
  } catch(e) {

    //show error that action could not be performed
    Context().document.showMessage('Conditional action on layer \'' + layerName + '\' could not be performed.')
  }
}