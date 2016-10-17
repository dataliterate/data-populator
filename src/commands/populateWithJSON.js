/**
 * Populate with JSON
 *
 * Populates the selected layers with a JSON file.
 */


import Context from '../context'
import * as Data from '../library/data'
import * as Gui from '../library/gui'
import * as Layers from '../library/layers'
import * as Populator from '../library/populator'
import Options, * as OPTIONS from '../library/options'


export default (context, populateAgain) => {
  Context(context)

  //get selected layers
  let selectedLayers = Layers.getSelectedLayers()
  if (!selectedLayers.length) {
    return Context().document.showMessage('Please select the layers you would like to populate.')
  }

  //get options and data path
  let options = Options()
  let dataPath
  if (populateAgain) {

    //get stored data path
    dataPath = options[OPTIONS.LAST_DATA_PATH]
    if (!dataPath) return
  }
  else {

    //ask for JSON file path, passing the last location if available
    dataPath = Data.askForJSON(options[OPTIONS.LAST_JSON_PATH])
    if (!dataPath) return

    //show dialog
    options = Gui.showPopulatorDialog(Populator.POPULATE_TYPE.JSON)

    //terminate if cancelled
    if (!options) return

    //create grid
    if (options[OPTIONS.CREATE_GRID]) {
      selectedLayers = Layers.createGrid(selectedLayers, {
        rowsCount: options[OPTIONS.ROWS_COUNT],
        rowsMargin: options[OPTIONS.ROWS_MARGIN],
        columnsCount: options[OPTIONS.COLUMNS_COUNT],
        columnsMargin: options[OPTIONS.COLUMNS_MARGIN]
      })

      //make sure that grid creation was successful
      //could have failed if zero rows were requested for example
      if (!selectedLayers) return
    }
  }

  //load json data
  let jsonData = Data.loadJSONData(dataPath)
  if (!jsonData) return

  //get root dir used when populating local images
  let jsonDir = NSString.stringWithString(dataPath).stringByDeletingLastPathComponent()

  //set path options
  options[OPTIONS.LAST_DATA_PATH] = dataPath
  options[OPTIONS.LAST_JSON_PATH] = dataPath
  options.rootDir = jsonDir

  //save type of populate command
  options[OPTIONS.LAST_POPULATE_TYPE] = Populator.POPULATE_TYPE.JSON

  //save options
  Options(options)

  //populate selected layers
  Populator.populateLayers(selectedLayers, jsonData, options)

  //restore selected layers
  Layers.selectLayers(selectedLayers)
}