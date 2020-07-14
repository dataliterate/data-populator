/**
 * Populate with Preset
 *
 * Populates the selected layers with a preset.
 */

import log from '@data-populator/core/log'
import Context from '../context'
import Options, * as OPTIONS from '../options'
import * as Data from '../data'
import * as Gui from '../gui'
import * as Utils from '../utils'
import * as Populator from '../populator'
import Strings, * as STRINGS from '@data-populator/core/strings'
const fs = require('uxp').storage.localFileSystem

export default async (selection, root) => {
  Context(selection, root)

  // nothing to populate
  if (!selection.items.length) {
    await Gui.createAlert(
      Strings(STRINGS.NO_LAYERS_SELECTED),
      Strings(STRINGS.SELECT_LAYERS_TO_POPULATE)
    )
    return
  }

  // get last used path & key
  let lastUsedPath, lastUsedJSONKey
  try {
    let activeConfigurationPreset = await Data.loadFileInDataFolder(
      'activeConfigurationPreset.json'
    )
    if (activeConfigurationPreset.path) {
      lastUsedPath = activeConfigurationPreset.path
    } else {
      lastUsedPath = null
    }

    if (activeConfigurationPreset.key) {
      lastUsedJSONKey = activeConfigurationPreset.key
    } else {
      lastUsedJSONKey = ''
    }
  } catch (e) {
    lastUsedPath = null
    lastUsedJSONKey = ''
    log(e)
  }

  // get path
  let options = await Options()
  let path, JSONKey, canceled
  let presets = await Data.getJSONFilesInPresetsFolder()

  if (!presets.length) {
    try {
      await Data.downloadPresets()
      presets = await Data.getJSONFilesInPresetsFolder()
    } catch (e) {
      await Gui.createAlert(
        Strings(STRINGS.CONNECTION_FAILED),
        Strings(STRINGS.UNABLE_TO_DOWNLOAD_PRESETS)
      )
      return
    }
  }

  if (presets.length) {
    let paths = {}
    for (let i = 0; i < presets.length; i++) {
      paths[presets[i].nativePath] = Data.getPathRelativeToDataFolder(presets[i].nativePath)
    }

    await Gui.showPopulatorDialog('preset', options, {
      lastUsedPath,
      lastUsedJSONKey,
      presets,
      paths
    })
      .then(result => {
        path = result.path
        JSONKey = result.key
      })
      .catch(async e => {
        log(e)
        canceled = true
      })
  } else {
    await Gui.createAlert(
      Strings(STRINGS.NO_PRESETS_FOUND),
      Strings(STRINGS.NO_JSON_FILES_IN_PRESETS_FOLDER)
    )
    return
  }

  if (canceled) return
  if (!canceled && !path) {
    await Gui.createAlert(Strings(STRINGS.INVALID_PRESET), Strings(STRINGS.SELECTED_PRESET_INVALID))
    return
  }

  // load preset data as object
  let data
  try {
    data = JSON.parse(await Data.loadFileWithPathInDataFolder(path))
    data = Utils.accessObjectByString(data, JSONKey)
  } catch (e) {
    log(e)
  }
  if (!data) {
    await Gui.createAlert(
      Strings(STRINGS.POPULATING_FAILED),
      Strings(STRINGS.UNABLE_TO_LOAD_SELECTED_PRESET)
    )
    return
  }

  // populate layers
  options = await Options()
  await Populator.populateLayers(selection.items, data, {
    randomizeData: options[OPTIONS.RANDOMIZE_DATA],
    trimText: options[OPTIONS.TRIM_TEXT],
    insertEllipsis: options[OPTIONS.INSERT_ELLIPSIS],
    defaultSubstitute: options[OPTIONS.DEFAULT_SUBSTITUTE]
  })

  // save active configuration
  try {
    await Data.saveFileInDataFolder('activeConfiguration.json', {
      type: 'preset'
    })
  } catch (e) {
    log(e)
  }
  try {
    await Data.saveFileInDataFolder('activeConfigurationPreset.json', {
      path: path,
      key: JSONKey
    })
  } catch (e) {
    log(e)
  }

  log('DONE')
}
