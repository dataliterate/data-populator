/**
 * Need Help?
 *
 * Opens the Data Populator website.
 */

import log from '@data-populator/core/log'
import Strings, * as STRINGS from '@data-populator/core/strings'
import Analytics from '@data-populator/core/analytics'
const uxp = require('uxp')

export default (selection, root) => {
  uxp.shell.openExternal(Strings(STRINGS.DATA_POPULATOR_URL))

  Analytics.track('showHelp')

  log('DONE')
}
