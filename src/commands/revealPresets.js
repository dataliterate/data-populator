/**
 * Reveal Presets
 *
 * Opens the presets folder.
 */


import Context from '../context'
import * as Data from '../library/data'


export default (context) => {
  Context(context)

  //get presets dir
  let presetDir = Data.getPresetsDir()

  //open dir
  let url = NSURL.fileURLWithPath(presetDir)

  if(NSFileManager.defaultManager().fileExistsAtPath(url.path())) {
    NSWorkspace.sharedWorkspace().openURL(url)
  }
  else {
    Context().document.showMessage("Your presets library has been moved or deleted. Please set it via 'Set Presets Library'")
  }
}
