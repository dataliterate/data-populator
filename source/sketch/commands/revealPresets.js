/**
 * Reveal Presets
 *
 * Opens the presets folder.
 */

import Context from '../library/context'
import * as Data from '../library/data'
import Strings, * as STRINGS from '../../core/library/strings'

export default (context) => {
  Context(context)

  // get presets dir
  let presetDir = Data.getPresetsDir()

  // open dir
  let url = NSURL.fileURLWithPath(presetDir)

  if (NSFileManager.defaultManager().fileExistsAtPath(url.path())) {
    NSWorkspace.sharedWorkspace().openURL(url)
  } else {
    Context().document.showMessage(Strings(STRINGS.PRESETS_LIBRARY_NOT_FOUND))
  }
}
