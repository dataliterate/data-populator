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
  NSWorkspace.sharedWorkspace().openURL(url)
}