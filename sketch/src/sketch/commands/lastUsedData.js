/**
 * Last used data
 *
 * Shows the last used data that was used to populate.
 */

import Context from '../context'
import * as Gui from '../gui'
import Options from '../options'
import Strings, * as STRINGS from '@data-populator/core/strings'
import * as Utils from '../utils'
import Analytics from '@data-populator/core/analytics'

export default async context => {
  Context(context)

  // configure analytics
  Analytics.configure(Utils.analyticsConfiguration())

  // get last used data
  let lastUsedData = Utils.documentMetadata(context.document, 'lastUsedData')
  if (!lastUsedData) {
    Context().document.showMessage(Strings(STRINGS.NO_LAST_USED_DATA))

    Analytics.track('showLastUsedDataError', {
      reason: 'noActiveConfiguration'
    })

    return
  }
  lastUsedData = Utils.decode(lastUsedData)

  await Gui.showWindow({
    viewOnly: true,
    options: Options(),
    jsonData: lastUsedData
  })

  Analytics.track('showLastUsedData', {
    populateType: Options().populateType
  })
}
