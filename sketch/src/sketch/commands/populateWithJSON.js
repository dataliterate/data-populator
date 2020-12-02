/**
 * Populate with JSON
 *
 * Populates the selected layers with a JSON file.
 */

import Context from '../context'
import * as Data from '../data'
import * as Gui from '../gui'
import * as Layers from '../layers'
import * as Populator from '../populator'
import Options, * as OPTIONS from '../options'
import Strings, * as STRINGS from '@data-populator/core/strings'
import * as Utils from '../utils'
import Analytics from '@data-populator/core/analytics'

export default async (context, populateAgain) => {
  Context(context)

  // configure analytics
  Analytics.configure(Utils.analyticsConfiguration())

  // get selected layers
  let selectedLayers = Layers.getSelectedLayers()
  if (!selectedLayers.length) {
    Context().document.showMessage(Strings(STRINGS.SELECT_LAYERS_TO_POPULATE))

    Analytics.track(populateAgain ? 'populateAgainError' : 'populateError', {
      populateType: 'json',
      reason: 'noSelection'
    })

    return
  }

  // get options and data
  let options = Options()
  options[OPTIONS.POPULATE_TYPE] = OPTIONS.POPULATE_TYPE_JSON
  let data = null
  if (populateAgain) {
    // load preset data
    if (!options[OPTIONS.JSON_PATH]) {
      Analytics.track('populateAgainError', {
        populateType: 'json',
        reason: 'noSelectedJSONFile'
      })
      return
    }
    data = Data.loadJSONData(options[OPTIONS.JSON_PATH])
    if (!data) {
      Analytics.track('populateAgainError', {
        populateType: 'json',
        reason: 'unableToLoadSelectedJSONFile'
      })
      return
    }

    data = Utils.accessObjectByString(data, options[OPTIONS.DATA_PATH] || '')
    if (!data) {
      Analytics.track('populateAgainError', {
        populateType: 'json',
        reason: 'invalidJSONFile'
      })
      return
    }
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
    if (!response) {
      Analytics.track('cancelPopulate', {
        populateType: 'json'
      })
      return
    }

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
      if (!selectedLayers) {
        Analytics.track(populateAgain ? 'populateAgainError' : 'populateError', {
          populateType: 'json',
          reason: 'zeroGridDimension'
        })

        return
      }
    }
  }

  // get root dir used when populating local images
  options.rootDir = NSString.stringWithString(
    options[OPTIONS.JSON_PATH]
  ).stringByDeletingLastPathComponent()

  // save options
  Options(options)

  // store data used to populate the layers
  Utils.documentMetadata(context.document, 'lastUsedData', Utils.encode(data))

  // populate selected layers
  Populator.populateLayers(selectedLayers, data, options)

  // restore selected layers
  Layers.selectLayers(selectedLayers)

  context.document.reloadInspector()

  Analytics.track(populateAgain ? 'populateAgain' : 'populateWithJSON', {
    randomizeData: options[OPTIONS.RANDOMIZE_DATA],
    trimText: options[OPTIONS.TRIM_TEXT],
    insertEllipsis: options[OPTIONS.INSERT_ELLIPSIS],
    useDefaultSubstitute: !!options[OPTIONS.DEFAULT_SUBSTITUTE],
    useDataPath: !!options[OPTIONS.DATA_PATH],
    createGrid: options[OPTIONS.CREATE_GRID],
    populateType: populateAgain ? 'json' : undefined
  })
}
