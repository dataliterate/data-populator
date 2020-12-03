import './reactShim'
import commands from './xd/commands'
import * as Utils from './xd/utils'
import Analytics from '@data-populator/core/analytics'

const os = require('os')
const application = require('application')
global.platform = os.platform()
global.pathSeparator = os.platform() === 'darwin' ? '/' : '\\'

void (async function () {
  const deviceId = await Utils.deviceId()

  Analytics.configure({
    trackingEnabled: true,
    deviceId,
    hostName: 'xd',
    hostVersion: application.version,
    hostOS: os.platform() === 'darwin' ? 'mac' : 'win',
    pluginVersion: process.env.PLUGIN_VERSION
  })
})()

export { commands }
