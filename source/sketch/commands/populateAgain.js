/**
 * Populate Again
 *
 * Populates the selected layers using the same settings as last time.
 */

import Context from '../library/context'
import Options, * as OPTIONS from '../library/options'

import PopulateWithPreset from './populateWithPreset'
import PopulateWithJSON from './populateWithJSON'
import PopulateFromURL from './populateFromURL'

export default (context) => {
  Context(context)

  // get options
  let options = Options()

  // get type of last populate command
  switch (options[OPTIONS.POPULATE_TYPE]) {

    // populate with preset
    case OPTIONS.POPULATE_TYPE_PRESET:
      if (options[OPTIONS.SELECTED_PRESET]) PopulateWithPreset(context, true)
      break

    // populate with JSON
    case OPTIONS.POPULATE_TYPE_JSON:
      if (options[OPTIONS.JSON_PATH]) PopulateWithJSON(context, true)
      break

    // populate from URL
    case OPTIONS.POPULATE_TYPE_URL:
      if (options[OPTIONS.URL]) PopulateFromURL(context, true)
      break
  }
}
