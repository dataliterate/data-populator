/**
 * Populate from URL
 *
 * Populates the selected layers with a remote JSON file.
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

  // nothing to populate
  if (!selection.items.length) {
    await Gui.createAlert(
      Strings(STRINGS.NO_LAYERS_SELECTED),
      Strings(STRINGS.SELECT_LAYERS_TO_POPULATE)
    )

    Analytics.track('populateError', {
      populateType: 'url',
      reason: 'noSelection'
    })

    return
  }

  // get last used url & key
  let lastUsedUrl, lastUsedJSONKey, lastUsedHeaders, showAdditionalOptions
  try {
    let activeConfigurationJSONURL = await Data.loadFileInDataFolder(
      'activeConfigurationJSONURL.json'
    )
    if (activeConfigurationJSONURL.url) {
      lastUsedUrl = activeConfigurationJSONURL.url
    } else {
      lastUsedUrl = ''
    }

    if (activeConfigurationJSONURL.key) {
      lastUsedJSONKey = activeConfigurationJSONURL.key
    } else {
      lastUsedJSONKey = ''
    }

    if (activeConfigurationJSONURL.headers) {
      lastUsedHeaders = activeConfigurationJSONURL.headers
    } else {
      lastUsedHeaders = {}
    }

    if (activeConfigurationJSONURL.showAdditionalOptions) {
      showAdditionalOptions = activeConfigurationJSONURL.showAdditionalOptions
    } else {
      showAdditionalOptions = false
    }
  } catch (e) {
    lastUsedUrl = ''
    lastUsedJSONKey = ''
    lastUsedHeaders = {}
    showAdditionalOptions = false
    log(e)
  }

  // get url
  let options = await Options()
  let url, JSONKey, headers, canceled
  await Gui.showPopulatorDialog('JSONURL', options, {
    lastUsedUrl,
    lastUsedJSONKey,
    lastUsedHeaders,
    showAdditionalOptions
  })
    .then(result => {
      url = result.url
      JSONKey = result.key
      headers = result.headers
      showAdditionalOptions = result.showAdditionalOptions
    })
    .catch(async e => {
      log(e)
      canceled = true
    })

  if (canceled) {
    Analytics.track('cancelPopulate', {
      populateType: 'url'
    })
    return
  }

  if (!canceled) {
    if (!url) {
      await Gui.createAlert(Strings(STRINGS.NO_URL_ENTERED), Strings(STRINGS.ENTER_URL))

      Analytics.track('populateError', {
        populateType: 'url',
        reason: 'noURL'
      })
    } else if (!Utils.isValidURL(url)) {
      await Gui.createAlert(Strings(STRINGS.INVALID_URL), Strings(STRINGS.URL_ENTERED_INVALID))

      Analytics.track('populateError', {
        populateType: 'url',
        reason: 'invalidURL'
      })
    }

    if (!url || !Utils.isValidURL(url)) return
  }

  // load json data as object
  let data
  try {
    data = await global
      .fetch(url, {
        headers
      })
      .then(response => response.json())
    data = Utils.accessObjectByString(data, JSONKey)
  } catch (e) {
    log(e)
  }
  if (!data) {
    await Gui.createAlert(
      Strings(STRINGS.POPULATING_FAILED),
      Strings(STRINGS.UNABLE_TO_LOAD_JSON_AT_URL)
    )

    Analytics.track('populateError', {
      populateType: 'url',
      reason: 'unableToLoadURL'
    })

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
      type: 'JSONURL'
    })
  } catch (e) {
    log(e)
  }
  try {
    await Data.saveFileInDataFolder('activeConfigurationJSONURL.json', {
      url: url,
      key: JSONKey,
      headers: headers,
      showAdditionalOptions: showAdditionalOptions
    })
  } catch (e) {
    log(e)
  }

  Analytics.track('populateFromURL', {
    randomizeData: options[OPTIONS.RANDOMIZE_DATA],
    trimText: options[OPTIONS.TRIM_TEXT],
    insertEllipsis: options[OPTIONS.INSERT_ELLIPSIS],
    useDefaultSubstitute: !!options[OPTIONS.DEFAULT_SUBSTITUTE],
    useDataPath: !!JSONKey,
    useHeaders: !!Object.keys(headers || {}).length
  })

  log('DONE')
}
