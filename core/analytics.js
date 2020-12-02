import log from './log'

const AMPLITUDE_KEYS = {
  development: '',
  production: ''
}

let trackingEnabled
let deviceId
let hostName
let hostVersion
let hostOS
let pluginVersion

function configure(params) {
  log('configuring analytics')
  log(params)

  trackingEnabled = params.trackingEnabled
  deviceId = params.deviceId
  hostName = params.hostName
  hostVersion = params.hostVersion
  hostOS = params.hostOS
  pluginVersion = params.pluginVersion
}

function setEnabled(isEnabled) {
  log('Tracking set to ', isEnabled ? 'enabled' : 'disabled')
  trackingEnabled = isEnabled
}

function track(action, data = {}) {
  log('Tracking', action, data)

  if (!trackingEnabled) {
    log('Tracking disabled')
    return
  }

  // Send event to amplitude API
  fetch('https://api.amplitude.com/2/httpapi', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      api_key: AMPLITUDE_KEYS[process.env.NODE_ENV],
      events: [
        {
          device_id: deviceId,
          ip: '$remote',
          event_type: action,
          event_properties: {
            ...data,
            hostName,
            hostVersion,
            hostOS,
            pluginVersion
          }
        }
      ]
    })
  })
}

export default { configure, setEnabled, track }
