/**
 * Populate Again
 *
 * Populates the selected layers using the same settings as last time.
 */

import log from '@data-populator/core/log'
import Context from '../context'
import Options, * as OPTIONS from '../options'
import * as Data from '../data'
import * as Gui from '../gui'
import * as Utils from '../utils'
import * as Populator from '../populator'
import Strings, * as STRINGS from '@data-populator/core/strings'

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

  // get data
  let data
  try {
    let activeConfiguration = await Data.loadFileInDataFolder('activeConfiguration.json')
    if (activeConfiguration.type === 'preset') {
      try {
        let activeConfigurationPreset = await Data.loadFileInDataFolder(
          'activeConfigurationPreset.json'
        )
        data = JSON.parse(await Data.loadFileWithPathInDataFolder(activeConfigurationPreset.path))
        data = Utils.accessObjectByString(data, activeConfigurationPreset.key)
      } catch (e1) {
        log(e1)
        await Gui.createAlert(
          Strings(STRINGS.POPULATING_FAILED),
          Strings(STRINGS.UNABLE_TO_LOAD_LAST_USED_PRESET)
        )
        return
      }
    } else if (activeConfiguration.type === 'JSON') {
      let activeConfigurationJSON = await Data.loadFileInDataFolder('activeConfigurationJSON.json')
      data = activeConfigurationJSON.json
      data = Utils.accessObjectByString(data, activeConfigurationJSON.key)
    } else if (activeConfiguration.type === 'JSONURL') {
      try {
        let activeConfigurationJSONURL = await Data.loadFileInDataFolder(
          'activeConfigurationJSONURL.json'
        )
        data = await global
          .fetch(activeConfigurationJSONURL.url, {
            headers: activeConfigurationJSONURL.headers
          })
          .then(response => response.json())
        data = Utils.accessObjectByString(data, activeConfigurationJSONURL.key)
      } catch (e1) {
        log(e1)
        await Gui.createAlert(
          Strings(STRINGS.POPULATING_FAILED),
          Strings(STRINGS.UNABLE_TO_LOAD_JSON_AT_LAST_USED_URL)
        )
        return
      }
    }
  } catch (e2) {
    log(e2)
    await Gui.createAlert(
      Strings(STRINGS.NO_ACTIVE_CONFIGURATION),
      Strings(STRINGS.FIRST_TIME_USING_DATA_POPULATOR)
    )
    return
  }

  // populate layers
  let options = await Options()
  await Populator.populateLayers(selection.items, data, {
    randomizeData: options[OPTIONS.RANDOMIZE_DATA],
    trimText: options[OPTIONS.TRIM_TEXT],
    insertEllipsis: options[OPTIONS.INSERT_ELLIPSIS],
    defaultSubstitute: options[OPTIONS.DEFAULT_SUBSTITUTE]
  })

  log('DONE')
}
