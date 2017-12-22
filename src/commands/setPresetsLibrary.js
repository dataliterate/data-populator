/**
 * Set Presets Library
 *
 * Sets the location of the presets library.
 */


import Context from '../context'
import * as Data from '../library/data'
import Options, * as OPTIONS from '../library/options'


export default (context) => {
  Context(context)

  //get options and data path
  let options = Options()

  //ask for library location
  let newPresetsLibrary = Data.askForDirectory('Select Presets Library', 'Select the folder containing your Data Populator presets.', options[OPTIONS.PRESETS_LIBRARY_PATH])

  //save location
  if(newPresetsLibrary) {

    //set path and save options
    options[OPTIONS.PRESETS_LIBRARY_PATH] = newPresetsLibrary
    Options(options)
  }
}
