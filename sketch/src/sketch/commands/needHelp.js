/**
 * Need help
 *
 * Opens the data populator help website
 */

import Context from '../context'
import Strings, * as STRINGS from '@data-populator/core/strings'
import * as Utils from '../utils'
import Analytics from '@data-populator/core/analytics'

export default context => {
  Context(context)

  // configure analytics
  Analytics.configure(Utils.analyticsConfiguration())

  NSWorkspace.sharedWorkspace().openURL(NSURL.URLWithString(Strings(STRINGS.DATA_POPULATOR_URL)))

  Analytics.track('showHelp')
}
