/**
 * Last used data
 *
 * Shows the last used data that was used to populate.
 */

import Context from '../library/context'
import * as Gui from '../library/gui'
import Options from '../library/options'
import Strings, * as STRINGS from '../../core/library/strings'
import * as Utils from '../library/utils'

export default async (context) => {
  Context(context)

  // get last used data
  let lastUsedData = Utils.documentMetadata(context.document, 'lastUsedData')
  if (!lastUsedData) {
    return Context().document.showMessage(Strings(STRINGS.NO_LAST_USED_DATA))
  }
  lastUsedData = Utils.decode(lastUsedData)

  await Gui.showWindow({
    viewOnly: true,
    options: Options(),
    jsonData: lastUsedData
  })
}
