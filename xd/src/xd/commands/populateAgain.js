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
import Analytics from '@data-populator/core/analytics'

export default async (selection, root) => {
  Context(selection, root)

  // get data
  let data
  let populateType
  let JSONKey
  let headers
  try {
    let activeConfiguration = await Data.loadFileInDataFolder('activeConfiguration.json')
    if (activeConfiguration.type === 'preset') {
      populateType = 'preset'

      try {
        let activeConfigurationPreset = await Data.loadFileInDataFolder(
          'activeConfigurationPreset.json'
        )
        JSONKey = activeConfigurationPreset.key

        data = JSON.parse(await Data.loadFileWithPathInDataFolder(activeConfigurationPreset.path))
        data = Utils.accessObjectByString(data, activeConfigurationPreset.key)
      } catch (e1) {
        log(e1)
        await Gui.createAlert(
          Strings(STRINGS.POPULATING_FAILED),
          Strings(STRINGS.UNABLE_TO_LOAD_LAST_USED_PRESET)
        )

        Analytics.track('populateAgainError', {
          populateType,
          reason: 'unableToLoadSelectedPreset'
        })

        return
      }
    } else if (activeConfiguration.type === 'JSON') {
      populateType = 'json'

      let activeConfigurationJSON = await Data.loadFileInDataFolder('activeConfigurationJSON.json')
      JSONKey = activeConfigurationJSON.key

      data = activeConfigurationJSON.json
      data = Utils.accessObjectByString(data, activeConfigurationJSON.key)
    } else if (activeConfiguration.type === 'JSONURL') {
      populateType = 'url'

      try {
        let activeConfigurationJSONURL = await Data.loadFileInDataFolder(
          'activeConfigurationJSONURL.json'
        )
        JSONKey = activeConfigurationJSONURL.key
        headers = activeConfigurationJSONURL.headers

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

        Analytics.track('populateAgainError', {
          populateType,
          reason: 'unableToLoadURL'
        })

        return
      }
    }
  } catch (e2) {
    log(e2)
    await Gui.createAlert(
      Strings(STRINGS.NO_ACTIVE_CONFIGURATION),
      Strings(STRINGS.FIRST_TIME_USING_DATA_POPULATOR)
    )

    Analytics.track('populateAgainError', {
      reason: 'noActiveConfiguration'
    })

    return
  }

  // nothing to populate
  if (!selection.items.length) {
    await Gui.createAlert(
      Strings(STRINGS.NO_LAYERS_SELECTED),
      Strings(STRINGS.SELECT_LAYERS_TO_POPULATE)
    )

    Analytics.track('populateAgainError', {
      populateType,
      reason: 'noSelection'
    })

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

  Analytics.track('populateAgain', {
    randomizeData: options[OPTIONS.RANDOMIZE_DATA],
    trimText: options[OPTIONS.TRIM_TEXT],
    insertEllipsis: options[OPTIONS.INSERT_ELLIPSIS],
    useDefaultSubstitute: !!options[OPTIONS.DEFAULT_SUBSTITUTE],
    useDataPath: !!JSONKey,
    useHeaders: !!Object.keys(headers || {}).length,
    populateType
  })

  log('DONE')
}
