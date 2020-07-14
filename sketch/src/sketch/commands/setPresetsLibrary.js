/**
 * Set Presets Library
 *
 * Sets the location of the presets library.
 */

import Context from '../context'
import * as Data from '../data'
import Options, * as OPTIONS from '../options'
import Strings, * as STRINGS from '@data-populator/core/strings'

export default context => {
  Context(context)

  // get options and data path
  let options = Options()

  // ask for library location
  let newPresetsLibrary = String(
    Data.askForDirectory(
      Strings(STRINGS.SET_PRESETS_LIBRARY_TITLE),
      Strings(STRINGS.SET_PRESETS_LIBRARY_DESCRIPTION),
      options[OPTIONS.PRESETS_LIBRARY_PATH]
    )
  )

  // save location
  if (newPresetsLibrary) {
    // set path and save options
    options[OPTIONS.PRESETS_LIBRARY_PATH] = newPresetsLibrary
    Options(options)
  }
}
