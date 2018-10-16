/**
 * Need help
 *
 * Opens the data populator help website
 */

import Context from '../library/context'
import Strings, * as STRINGS from '../../core/library/strings'

export default (context) => {
  Context(context)

  NSWorkspace.sharedWorkspace().openURL(NSURL.URLWithString(Strings(STRINGS.DATA_POPULATOR_URL)))
}
