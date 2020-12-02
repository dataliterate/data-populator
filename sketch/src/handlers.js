/**
 * Handlers
 *
 * Handlers called from the Sketch plugin.
 */

import * as Utils from './library/utils'
import Analytics from '@data-populator/core/analytics'

export function configureAnalytics(callPlugin, data, rootRef, callId) {
  Analytics.configure(data)
}

export function show(callPlugin, data, rootRef) {
  rootRef.init(data)
}

export function setData(callPlugin, data, rootRef) {
  rootRef.setData(data.content, data.keepDataPath)
}

export function setJSONPath(callPlugin, data, rootRef) {
  rootRef.setJSONPath(data.path)
}

export function loadURLData(callPlugin, data, rootRef, callId) {
  // create an object from all headers
  let headers = {}
  for (let i = 0; i < data.headers.length; i++) {
    let header = data.headers[i]
    if (header.name && header.value) headers[header.name] = header.value
  }

  // get data from url
  global
    .fetch(data.url, {
      headers
    })
    .then(response => response.json())
    .then(data => {
      Utils.resolvePluginCall(callId, data)
    })
    .catch(() => {
      Utils.resolvePluginCall(callId, null)
    })
}
