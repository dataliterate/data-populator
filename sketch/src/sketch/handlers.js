/**
 * Handlers
 *
 * Handlers called from the UI.
 */

import * as Data from './data'
import * as Utils from './utils'

export function readFile(callUI, data) {
  let content = String(Data.readFileAsText(data.path))

  callUI('setData', {
    content,
    keepDataPath: data.keepDataPath
  })
}

export function selectJSON(callUI, data) {
  let path = Data.askForJSON(data.path)
  if (!path) return
  path = String(path)

  callUI('setJSONPath', {
    path
  })
}

export function configureAnalytics(callUI, data) {
  callUI('configureAnalytics', Utils.analyticsConfiguration())
}
