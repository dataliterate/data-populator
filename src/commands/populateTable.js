/**
 * Populate Table
 *
 * Populates the selected table layer group with a TSV file.
 */


import Context from '../context'
import * as Data from '../library/data'
import * as Gui from '../library/gui'
import * as Layers from '../library/layers'
import * as Populator from '../library/populator'
import Options, * as OPTIONS from '../library/options'


export default (context, populateAgain) => {
  Context(context)

  //get selected table layer group
  let selectedLayers = Layers.getSelectedLayers()
  if (!selectedLayers.length) {
    return Context().document.showMessage('Please select the table layer group you would like to populate.')
  }
  else if (selectedLayers.length > 1) {
    return Context().document.showMessage('Please select only one table layer group.')
  }
  let tableLayerGroup = selectedLayers[0]

  //get options and data path
  let options = Options()
  let dataPath
  if (populateAgain) {

    //get stored data path
    dataPath = options[OPTIONS.LAST_DATA_PATH]
    if (!dataPath) return
  }
  else {

    //ask for TSV file path, passing the last location if available
    dataPath = Data.askForTableTSV(options[OPTIONS.LAST_TSV_PATH])
    if (!dataPath) return

    //show dialog
    options = Gui.showPopulatorDialog(Populator.POPULATE_TYPE.TABLE)

    //terminate if cancelled
    if (!options) return
  }

  //load tsv table data
  let tableData = Data.loadTableTSV(dataPath)
  if (!tableData) return
  tableData = Data.flattenTable(tableData)

  //get tsv dir to use as the root dir
  let tsvDir = NSString.stringWithString(dataPath).stringByDeletingLastPathComponent()

  //set path options
  options[OPTIONS.LAST_DATA_PATH] = dataPath
  options[OPTIONS.LAST_TSV_PATH] = dataPath
  options.rootDir = tsvDir

  //save type of populate command
  options[OPTIONS.LAST_POPULATE_TYPE] = Populator.POPULATE_TYPE.TABLE

  //save options
  Options(options)

  //populate selected layers
  Populator.populateTable(tableLayerGroup, tableData, options)

  //restore selected layers
  Layers.selectLayers([tableLayerGroup])
}