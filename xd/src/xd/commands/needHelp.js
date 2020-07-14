/**
 * Need Help?
 *
 * Opens the Data Populator website.
 */

import log from '@data-populator/core/log'
import Strings, * as STRINGS from '@data-populator/core/strings'
const uxp = require('uxp')

export default (selection, root) => {
  uxp.shell.openExternal(Strings(STRINGS.DATA_POPULATOR_URL))
  log('DONE')
}
