/**
 * Populate with JSON
 *
 * Populates the selected layers with a JSON file.
 */

import {log} from '../../core'
import Context from '../library/context'
import Options, * as OPTIONS from '../library/options'
import * as Data from '../library/data'
import * as Gui from '../library/gui'
import * as Utils from '../library/utils'
import * as Populator from '../library/populator'
import Strings, * as STRINGS from '../../core/library/strings'

export default async (selection, root) => {
  Context(selection, root)

  // nothing to populate
  if (!selection.items.length) {
    await Gui.createAlert(Strings(STRINGS.NO_LAYERS_SELECTED), Strings(STRINGS.SELECT_LAYERS_TO_POPULATE))
    return
  }

  // get last used JSON file & key
  let lastUsedJSONFile, lastUsedJSONKey
  try {
    let activeConfigurationJSON = await Data.loadFileInDataFolder('activeConfigurationJSON.json')
    if (activeConfigurationJSON.nativePath && activeConfigurationJSON.json) {
      lastUsedJSONFile = {
        nativePath: activeConfigurationJSON.nativePath,
        json: activeConfigurationJSON.json
      }
    } else {
      lastUsedJSONFile = {}
    }

    if (activeConfigurationJSON.key) {
      lastUsedJSONKey = activeConfigurationJSON.key
    } else {
      lastUsedJSONKey = ''
    }
  } catch (e) {
    lastUsedJSONFile = {}
    lastUsedJSONKey = ''
    log(e)
  }

  // get json file
  let options = await Options()
  let JSONFile, JSONKey, canceled
  await Gui.showPopulatorDialog('JSON', options, {lastUsedJSONFile, lastUsedJSONKey})
    .then(result => {
      JSONFile = result.file
      JSONKey = result.key
    })
    .catch(async e => {
      log(e)
      canceled = true
    })
  if (canceled) return
  if (!canceled) {
    if (!JSONFile.nativePath) await Gui.createAlert(Strings(STRINGS.NO_FILE_SELECTED), Strings(STRINGS.SELECT_JSON_FILE))
    else if (!JSONFile.json) await Gui.createAlert(Strings(STRINGS.INVALID_JSON_FILE), Strings(STRINGS.SELECTED_JSON_FILE_INVALID))
    if (!JSONFile.nativePath || !JSONFile.json) return
  }

  // set data
  let data = JSONFile.json
  try {
    data = Utils.accessObjectByString(data, JSONKey)
  } catch (e) {
    log(e)
  }
  if (!data) {
    await Gui.createAlert(Strings(STRINGS.POPULATING_FAILED), Strings(STRINGS.UNABLE_TO_LOAD_SELECTED_JSON_FILE))
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
      type: 'JSON'
    })
  } catch (e) {
    log(e)
  }
  try {
    await Data.saveFileInDataFolder('activeConfigurationJSON.json', {
      nativePath: JSONFile.nativePath,
      json: JSONFile.json,
      key: JSONKey
    })
  } catch (e) {
    log(e)
  }

  log('DONE')
}
