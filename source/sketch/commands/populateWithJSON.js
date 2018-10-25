/**
 * Populate with JSON
 *
 * Populates the selected layers with a JSON file.
 */

import Context from '../library/context'
import * as Data from '../library/data'
import * as Gui from '../library/gui'
import * as Layers from '../library/layers'
import * as Populator from '../library/populator'
import Options, * as OPTIONS from '../library/options'
import Strings, * as STRINGS from '../../core/library/strings'
import * as Utils from '../library/utils'

export default async (context, populateAgain) => {
  Context(context)

  // get selected layers
  let selectedLayers = Layers.getSelectedLayers()
  if (!selectedLayers.length) {
    return Context().document.showMessage(Strings(STRINGS.SELECT_LAYERS_TO_POPULATE))
  }

  // get options and data
  let options = Options()
  options[OPTIONS.POPULATE_TYPE] = OPTIONS.POPULATE_TYPE_JSON
  let data = null
  if (populateAgain) {

    // load preset data
    if (!options[OPTIONS.JSON_PATH]) return
    data = Data.loadJSONData(options[OPTIONS.JSON_PATH])
    if (!data) return
    data = Utils.accessObjectByString(data, options[OPTIONS.DATA_PATH] || '')
    if (!data) return

  } else {

    // check that any existing JSON file still exists
    if (options[OPTIONS.JSON_PATH]) {
      if (!Data.readFileAsText(options[OPTIONS.JSON_PATH])) {
        options[OPTIONS.JSON_PATH] = null
      }
    }

    // wait for user response including options and json data to be used
    let response = await Gui.showWindow({
      options
    })

    // terminate if cancelled
    if (!response) return

    // get updated options and json data
    options = response.options
    data = response.data

    // create grid
    if (options[OPTIONS.CREATE_GRID]) {
      selectedLayers = Layers.createGrid(selectedLayers, {
        rowsCount: options[OPTIONS.ROWS_COUNT],
        rowsMargin: options[OPTIONS.ROWS_MARGIN],
        columnsCount: options[OPTIONS.COLUMNS_COUNT],
        columnsMargin: options[OPTIONS.COLUMNS_MARGIN]
      })

      // make sure that grid creation was successful
      // could have failed if zero rows were requested for example
      if (!selectedLayers) return
    }
  }

  // get root dir used when populating local images
  options.rootDir = NSString.stringWithString(options[OPTIONS.JSON_PATH]).stringByDeletingLastPathComponent()

  // save options
  Options(options)

  // store data used to populate the layers
  Utils.documentMetadata(context.document, 'lastUsedData', Utils.encode(data))

  // populate selected layers
  Populator.populateLayers(selectedLayers, data, options)

  // restore selected layers
  Layers.selectLayers(selectedLayers)
}
