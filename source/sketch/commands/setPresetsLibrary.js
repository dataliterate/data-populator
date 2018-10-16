/**
 * Set Presets Library
 *
 * Sets the location of the presets library.
 */

import Context from '../library/context'
import * as Data from '../library/data'
import Options, * as OPTIONS from '../library/options'
import Strings, * as STRINGS from '../../core/library/strings'

export default (context) => {
  Context(context)

  // get options and data path
  let options = Options()

  // ask for library location
  let newPresetsLibrary = String(Data.askForDirectory(Strings(STRINGS.SET_PRESETS_LIBRARY_TITLE), Strings(STRINGS.SET_PRESETS_LIBRARY_DESCRIPTION), options[OPTIONS.PRESETS_LIBRARY_PATH]))

  // save location
  if (newPresetsLibrary) {

    // set path and save options
    options[OPTIONS.PRESETS_LIBRARY_PATH] = newPresetsLibrary
    Options(options)
  }
}
