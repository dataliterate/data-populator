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
  let dataUrl
  if (populateAgain) {
    //get stored data path
    dataUrl = options[OPTIONS.LAST_CLOUDSTITCH_URL]
    if (!dataUrl) return
  }
  else {

    //ask for JSON file path, passing the last location if available
    let cOpts = Data.askForCloudstitch(
      options[OPTIONS.LAST_CLOUDSTITCH_USERNAME],
      options[OPTIONS.LAST_CLOUDSTITCH_APPNAME],
      options[OPTIONS.LAST_CLOUDSTITCH_WORKSHEET]
    )

    if (!cOpts) return
    
    dataUrl = `https://api.cloudstitch.com/${cOpts.username}/${cOpts.appname}/${cOpts.worksheet}?dev=true`; 

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

    //set cloudstitch options
    options[OPTIONS.LAST_CLOUDSTITCH_URL] = dataUrl
    options[OPTIONS.LAST_CLOUDSTITCH_USERNAME] = cOpts.username;
    options[OPTIONS.LAST_CLOUDSTITCH_APPNAME] = cOpts.appname;
    options[OPTIONS.LAST_CLOUDSTITCH_WORKSHEET] = cOpts.worksheet;
  }

  //load json data
  let jsonData = Data.loadJSONRemote(dataUrl)
  if (!jsonData) return

  //save type of populate command
  options[OPTIONS.LAST_POPULATE_TYPE] = Populator.POPULATE_TYPE.CLOUDSTITCH

  //save options
  Options(options)

  //populate selected layers
  Populator.populateLayers(selectedLayers, jsonData, options)

  //restore selected layers
  Layers.selectLayers(selectedLayers)
}