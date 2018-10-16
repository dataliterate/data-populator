/**
 * Need Help?
 *
 * Opens the Data Populator website.
 */

import xd from '../library/xd'
import {log} from '../../core'
import Strings, * as STRINGS from '../../core/library/strings'
const uxp = xd('uxp')

export default (selection, root) => {
  uxp.shell.openExternal(Strings(STRINGS.DATA_POPULATOR_URL))
  log('DONE')
}
