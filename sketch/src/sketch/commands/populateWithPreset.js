/**
 * Populate with Preset
 *
 * Populates the selected layers with a preset.
 */

import sketch from 'sketch'
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
      populateType: 'preset',
      reason: 'noSelection'
    })

    return
  }

  // load presets
  let presets = Data.loadPresets()
  if (!presets.length) {
    Context().document.showMessage(Strings(STRINGS.NO_PRESETS_FOUND))

    Analytics.track(populateAgain ? 'populateAgainError' : 'populateError', {
      populateType: 'preset',
      reason: 'noPresets'
    })

    return
  }

  // get options and data
  let options = Options()
  options[OPTIONS.POPULATE_TYPE] = OPTIONS.POPULATE_TYPE_PRESET
  let data = null
  if (populateAgain) {
    // load preset data
    if (!options[OPTIONS.SELECTED_PRESET]) {
      Analytics.track('populateAgainError', {
        populateType: 'preset',
        reason: 'noSelectedPreset'
      })
      return
    }
    data = Data.loadJSONData(options[OPTIONS.SELECTED_PRESET].path)
    data = Utils.accessObjectByString(data, options[OPTIONS.DATA_PATH] || '')
    if (!data) {
      Analytics.track('populateAgainError', {
        populateType: 'preset',
        reason: 'unableToLoadSelectedPreset'
      })
      return
    }
  } else {
    // wait for user response including options and json data to be used
    let response = await Gui.showWindow({
      options,
      presets
    })

    // terminate if cancelled
    if (!response) {
      Analytics.track('cancelPopulate', {
        populateType: 'preset'
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
          populateType: 'preset',
          reason: 'zeroGridDimension'
        })

        return
      }
    }
  }

  // get root dir used when populating local images
  options.rootDir = NSString.stringWithString(
    options[OPTIONS.SELECTED_PRESET].path
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

  Analytics.track(populateAgain ? 'populateAgain' : 'populateWithPreset', {
    randomizeData: options[OPTIONS.RANDOMIZE_DATA],
    trimText: options[OPTIONS.TRIM_TEXT],
    insertEllipsis: options[OPTIONS.INSERT_ELLIPSIS],
    useDefaultSubstitute: !!options[OPTIONS.DEFAULT_SUBSTITUTE],
    useDataPath: !!options[OPTIONS.DATA_PATH],
    createGrid: options[OPTIONS.CREATE_GRID],
    populateType: populateAgain ? 'preset' : undefined
  })
}
