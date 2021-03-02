import debounce from 'debounce'

const AMPLITUDE_KEYS = {
  development: '6a6183f4a13f66d6165f6fc7e6637788',
  production: '20748e915398f2569e92f47b1ecc2126'
}

const IGNORED_DEVICE_IDS = ['development']

let trackingEnabled
let deviceId
let hostName
let hostVersion
let hostOS
let pluginVersion

function configure(params) {
  console.log('configuring analytics')
  console.log(params)

  trackingEnabled = params.trackingEnabled
  deviceId = params.deviceId
  hostName = params.hostName
  hostVersion = params.hostVersion
  hostOS = params.hostOS
  pluginVersion = params.pluginVersion
}

function setEnabled(isEnabled) {
  console.log('Tracking set to ', isEnabled ? 'enabled' : 'disabled')
  trackingEnabled = isEnabled
}

function track(action, data = {}) {
  console.log('Tracking', action, data)

  if (!trackingEnabled) {
    console.log('Tracking disabled')
    return
  }

  // Ignore events from ignored devices in production
  if (IGNORED_DEVICE_IDS.includes(deviceId) && process.env.NODE_ENV === 'production') {
    console.log('Device ID ignored', deviceId)
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
          user_properties: {
            hostName,
            hostVersion,
            hostOS,
            pluginVersion
          },
          event_properties: data
        }
      ]
    })
  })
}

const trackDebounced = debounce(track, 500)

export default { configure, setEnabled, track, trackDebounced }
