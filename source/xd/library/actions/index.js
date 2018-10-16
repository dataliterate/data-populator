/**
 * Actions
 *
 * Provides functionality to perform conditional actions.
 */

import * as Core from '../../../core'
import {log} from '../../../core'

import * as ShowAction from './show'
import * as HideAction from './hide'

let actions = [
  ShowAction,
  HideAction
]

/**
 * Perform all actions on a layer.
 *
 * @param {SceneNode} layer
 * @param {Object} data
 */
export function performActions (layer, data) {

  // process conditional actions on the layer
  let actions = Core.actions.extractActions(layer.name)

  // perform actions
  actions.forEach((action) => {
    performAction(action, layer, data)
  })
}

/**
 * Performs the supplied action with the data and layer as input.
 *
 * @param {Object} action
 * @param {SceneNode} layer
 * @param {Object} data
 */
export function performAction (action, layer, data) {

  // find action function for the specified action
  let actionFunction
  for (let i = 0; i < actions.length; i++) {
    if (actions[i].name === action.command || actions[i].alias === action.command) {
      actionFunction = actions[i].perform
    }
  }

  // continue only if action found
  if (!actionFunction) {
    log('Conditional action \'' + action.command + '\' on layer \'' + layer.name + '\' does not exist.')
    return
  }

  // get layer name without action string
  // used within error messages
  let layerName = layer.name.replace(action.string, '').trim()
  if (!layerName.length) layerName = layer.name

  // resolve action with data
  action = Core.actions.resolveAction(action, data)
  if (action.resolveError) {

    // show error that action could not be evaluated
    log('Conditional action on layer \'' + layerName + '\' could not be evaluated.')
  }
  else {

    try {
      actionFunction(action.condition, layer, action.params)
    } catch (e) {

      // show error that action could not be performed
      log('Conditional action on layer \'' + layerName + '\' could not be performed.')
    }
  }
}
