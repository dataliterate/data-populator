/**
 * Last Used Data
 *
 * Shows the last used data.
 */

import log from '@data-populator/core/log'
import Options, * as OPTIONS from '../options'
import * as Gui from '../gui'
import * as Utils from '../utils'
import * as Data from '../data'
import Strings, * as STRINGS from '@data-populator/core/strings'
import Analytics from '@data-populator/core/analytics'

export default async (selection, root) => {
  // get configuration details
  let options = await Options()
  let activeConfiguration, activeConfigurationSpecific, json
  let populateType
  try {
    activeConfiguration = await Data.loadFileInDataFolder('activeConfiguration.json')
    if (activeConfiguration.type === 'preset') {
      populateType = 'preset'

      try {
        activeConfigurationSpecific = await Data.loadFileInDataFolder(
          'activeConfigurationPreset.json'
        )
        json = JSON.parse(await Data.loadFileWithPathInDataFolder(activeConfigurationSpecific.path))
        json = Utils.accessObjectByString(json, activeConfigurationSpecific.key)
      } catch (e1) {
        log(e1)
        await Gui.createAlert(
          Strings(STRINGS.LOADING_FAILED),
          Strings(STRINGS.UNABLE_TO_LOAD_LAST_USED_PRESET)
        )

        Analytics.track('showLastUsedDataError', {
          populateType,
          reason: 'unableToLoadSelectedPreset'
        })

        return
      }
    } else if (activeConfiguration.type === 'JSON') {
      populateType = 'json'

      activeConfigurationSpecific = await Data.loadFileInDataFolder('activeConfigurationJSON.json')
      json = activeConfigurationSpecific.json
      json = Utils.accessObjectByString(json, activeConfigurationSpecific.key)
    } else if (activeConfiguration.type === 'JSONURL') {
      populateType = 'url'

      try {
        activeConfigurationSpecific = await Data.loadFileInDataFolder(
          'activeConfigurationJSONURL.json'
        )
        json = await global
          .fetch(activeConfigurationSpecific.url, {
            headers: activeConfigurationSpecific.headers
          })
          .then(response => response.json())
        json = Utils.accessObjectByString(json, activeConfigurationSpecific.key)
      } catch (e1) {
        log(e1)
        await Gui.createAlert(
          Strings(STRINGS.LOADING_FAILED),
          Strings(STRINGS.UNABLE_TO_LOAD_JSON_AT_LAST_USED_URL)
        )

        Analytics.track('showLastUsedDataError', {
          populateType,
          reason: 'unableToLoadURL'
        })

        return
      }
    }
  } catch (e2) {
    log(e2)
    await Gui.createAlert(
      Strings(STRINGS.NO_LAST_USED_DATA),
      Strings(STRINGS.FIRST_TIME_USING_DATA_POPULATOR)
    )

    Analytics.track('showLastUsedDataError', {
      reason: 'noActiveConfiguration'
    })

    return
  }

  // show active configuration dialog
  await Gui.showActiveConfigurationDialog(
    activeConfiguration,
    activeConfigurationSpecific,
    options,
    json
  )

  Analytics.track('showLastUsedData', {
    populateType
  })

  log('DONE')
}
