/**
 * Reveal Presets
 *
 * Opens the presets folder.
 */

import Context from '../context'
import * as Data from '../data'
import Strings, * as STRINGS from '@data-populator/core/strings'
import * as Utils from '../utils'
import Analytics from '@data-populator/core/analytics'

export default context => {
  Context(context)

  // configure analytics
  Analytics.configure(Utils.analyticsConfiguration())

  // get presets dir
  let presetDir = Data.getPresetsDir()

  // open dir
  let url = NSURL.fileURLWithPath(presetDir)

  if (NSFileManager.defaultManager().fileExistsAtPath(url.path())) {
    NSWorkspace.sharedWorkspace().openURL(url)

    Analytics.track('revealPresets')
  } else {
    Context().document.showMessage(Strings(STRINGS.PRESETS_LIBRARY_NOT_FOUND))

    Analytics.track('revealPresetsError', {
      reason: 'noPresetsLibrary'
    })
  }
}
