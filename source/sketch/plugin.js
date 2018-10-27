/**
 * Plugin
 *
 * Defines the plugin structure and metadata.
 */

import Strings, * as STRINGS from '../core/library/strings'
import * as commands from './commands'

export const HKSketchFusionExtension = {
  name: Strings(STRINGS.DATA_POPULATOR_TITLE),
  bundleName: Strings(STRINGS.DATA_POPULATOR_TITLE),
  description: Strings(STRINGS.DATA_POPULATOR_DESCRIPTION),
  author: 'precious design studio',
  authorEmail: 'feedback@datapopulator.com',
  version: '3.0.1',
  identifier: 'com.datapopulator.sketch',
  compatibleVersion: '52',
  icon: 'icon.png',
  appcast: 'https://raw.githubusercontent.com/preciousforever/data-populator/master/appcast.xml',
  menu: {
    'isRoot': false,
    'items': [
      'populateWithPreset',
      'populateWithJson',
      'populateFromUrl',
      'populateAgain',
      'lastUsedData',
      'clearLayers',
      '-',
      'revealPresets',
      'setPresetsLibrary',
      '-',
      'needHelp',

      // debug only
      '-',
      'resetOptions'
    ]
  },
  commands: {
    populateWithPreset: {
      name: Strings(STRINGS.POPULATE_WITH_PRESET_TITLE),
      shortcut: '',
      description: Strings(STRINGS.POPULATE_WITH_PRESET_DESCRIPTION),
      icon: '../Resources/populateWithPreset.png',
      run: commands.populateWithPreset
    },
    populateWithJson: {
      name: Strings(STRINGS.POPULATE_WITH_JSON_TITLE),
      shortcut: '',
      description: Strings(STRINGS.POPULATE_WITH_JSON_DESCRIPTION),
      icon: '../Resources/populateWithJSON.png',
      run: commands.populateWithJSON
    },
    populateFromUrl: {
      name: Strings(STRINGS.POPULATE_FROM_URL_TITLE),
      shortcut: '',
      description: Strings(STRINGS.POPULATE_FROM_URL_DESCRIPTION),
      icon: '../Resources/populateFromURL.png',
      run: commands.populateFromURL
    },
    populateAgain: {
      name: Strings(STRINGS.POPULATE_AGAIN_TITLE),
      shortcut: 'cmd shift x',
      description: Strings(STRINGS.POPULATE_AGAIN_DESCRIPTION),
      icon: '../Resources/populateAgain.png',
      run: commands.populateAgain
    },
    lastUsedData: {
      name: Strings(STRINGS.LAST_USED_DATA_TITLE),
      shortcut: '',
      description: Strings(STRINGS.LAST_USED_DATA_DESCRIPTION),
      icon: '../Resources/lastUsedData.png',
      run: commands.lastUsedData
    },
    clearLayers: {
      name: Strings(STRINGS.CLEAR_LAYERS_TITLE),
      shortcut: '',
      description: Strings(STRINGS.CLEAR_LAYERS_DESCRIPTION),
      icon: '../Resources/clearLayers.png',
      run: commands.clearLayers
    },
    revealPresets: {
      name: Strings(STRINGS.REVEAL_PRESETS_LIBRARY_TITLE),
      shortcut: '',
      description: Strings(STRINGS.REVEAL_PRESETS_LIBRARY_DESCRIPTION),
      icon: '../Resources/revealPresets.png',
      run: commands.revealPresets
    },
    setPresetsLibrary: {
      name: Strings(STRINGS.SET_PRESETS_LIBRARY_TITLE),
      shortcut: '',
      description: Strings(STRINGS.SET_PRESETS_LIBRARY_DESCRIPTION),
      icon: '../Resources/revealPresets.png',
      run: commands.setPresetsLibrary
    },
    needHelp: {
      name: Strings(STRINGS.NEED_HELP_TITLE),
      shortcut: '',
      description: Strings(STRINGS.NEED_HELP_DESCRIPTION),
      icon: '../Resources/needHelp.png',
      run: commands.needHelp
    },
    resetOptions: {
      name: 'Reset Options',
      shortcut: '',
      run: commands.resetOptions
    }
  }
}
