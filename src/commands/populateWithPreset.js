/**
 * Populate with Preset
 *
 * Populates the selected layers with a preset.
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

  //load presets
  let presets = Data.loadPresets()
  if (!presets.length) {
    return Context().document.showMessage('There are no presets.')
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

    //show dialog
    options = Gui.showPopulatorDialog(Populator.POPULATE_TYPE.PRESET, {
      presets
    })

    //terminate if cancelled
    if (!options) return

    //get preset data path
    dataPath = presets[options.selectedPresetIndex].path

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

  //load preset data
  let presetData = Data.loadJSONData(dataPath)
  if (!presetData) return

  //get root dir used when populating local images
  let presetDir = NSString.stringWithString(dataPath).stringByDeletingLastPathComponent()

  //set path options
  options[OPTIONS.LAST_DATA_PATH] = dataPath
  options.rootDir = presetDir

  //save type of populate command
  options[OPTIONS.LAST_POPULATE_TYPE] = Populator.POPULATE_TYPE.PRESET

  //save options
  Options(options)

  //populate selected layers
  Populator.populateLayers(selectedLayers, presetData, options)

  //restore selected layers
  Layers.selectLayers(selectedLayers)
}



