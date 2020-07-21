import './reactShim'
import commands from './xd/commands'

const os = require('os')
global.platform = os.platform()
global.pathSeparator = os.platform() === 'darwin' ? '/' : '\\'

export { commands }
