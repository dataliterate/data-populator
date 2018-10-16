/**
 * Last Used Data
 *
 * Shows the last used data.
 */

import {log} from '../../core'
import Options, * as OPTIONS from '../library/options'
import * as Gui from '../library/gui'
import * as Utils from '../library/utils'
import * as Data from '../library/data'
import Strings, * as STRINGS from '../../core/library/strings'

export default async (selection, root) => {

  // get configuration details
  let options = await Options()
  let activeConfiguration, activeConfigurationSpecific, json
  try {
    activeConfiguration = await Data.loadFileInDataFolder('activeConfiguration.json')
    if (activeConfiguration.type === 'preset') {
      try {
        activeConfigurationSpecific = await Data.loadFileInDataFolder('activeConfigurationPreset.json')
        json = JSON.parse(await Data.loadFileWithPathInDataFolder(activeConfigurationSpecific.path))
        json = Utils.accessObjectByString(json, activeConfigurationSpecific.key)
      } catch (e1) {
        log(e1)
        await Gui.createAlert(Strings(STRINGS.LOADING_FAILED), Strings(STRINGS.UNABLE_TO_LOAD_LAST_USED_PRESET))
        return
      }
    } else if (activeConfiguration.type === 'JSON') {
      activeConfigurationSpecific = await Data.loadFileInDataFolder('activeConfigurationJSON.json')
      json = activeConfigurationSpecific.json
      json = Utils.accessObjectByString(json, activeConfigurationSpecific.key)
    } else if (activeConfiguration.type === 'JSONURL') {
      try {
        activeConfigurationSpecific = await Data.loadFileInDataFolder('activeConfigurationJSONURL.json')
        json = await global.fetch(activeConfigurationSpecific.url, {
          headers: activeConfigurationSpecific.headers
        }).then(response => response.json())
        json = Utils.accessObjectByString(json, activeConfigurationSpecific.key)
      } catch (e1) {
        log(e1)
        await Gui.createAlert(Strings(STRINGS.LOADING_FAILED), Strings(STRINGS.UNABLE_TO_LOAD_JSON_AT_LAST_USED_URL))
        return
      }
    }
  } catch (e2) {
    log(e2)
    await Gui.createAlert(Strings(STRINGS.NO_LAST_USED_DATA), Strings(STRINGS.FIRST_TIME_USING_DATA_POPULATOR))
    return
  }

  // show active configuration dialog
  await Gui.showActiveConfigurationDialog(activeConfiguration, activeConfigurationSpecific, options, json)

  log('DONE')
}
