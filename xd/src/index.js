import './reactShim'
import React from 'react'
import ReactDOM from 'react-dom'

import * as utilsLib from './libraries/utils'
import context from './libraries/context'
import analytics from '@data-populator/core/analytics'

import App from './App'

// Configure based on OS
const os = require('os')
const application = require('application')
global.platform = os.platform()

// Configure analytics
void (async function () {
  // Get or generate a new device ID to identify plugin installation
  const deviceId = await utilsLib.deviceId()

  analytics.configure({
    trackingEnabled: true,
    deviceId,
    hostName: 'xd',
    hostVersion: application.version,
    hostOS: os.platform() === 'darwin' ? 'mac' : 'win',
    pluginVersion: process.env.PLUGIN_VERSION
  })
})()

let panelNode = document.createElement('div')
panelNode.id = 'root'
ReactDOM.render(<App />, panelNode)

function show(event) {
  event.node.appendChild(panelNode)
}

function update(selection, root) {
  context(selection, root)
  document.dispatchEvent(new Event('update'))
}

const panels = {
  panel: {
    show,
    update
  }
}

export { panels }
