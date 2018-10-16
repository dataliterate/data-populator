/**
 * Plugin
 *
 * Defines the plugin structure and metadata.
 */

import * as commands from './commands'
import Strings, * as STRINGS from '../core/library/strings'

export const plugin = {
  name: Strings(STRINGS.DATA_POPULATOR_TITLE),
  description: Strings(STRINGS.DATA_POPULATOR_DESCRIPTION),
  author: 'precious design studio',
  authorEmail: 'feedback@datapopulator.com',
  version: '1.1.3',
  identifier: '1c0ce86b',
  compatibleVersion: '13.0.11.19',
  commands: commands,

  icons: [
    {
      width: 96,
      height: 96,
      path: 'resources/icon.png'
    }
  ],

  entryPoints: [{
    type: 'menu',
    label: Strings(STRINGS.DATA_POPULATOR_TITLE),
    menuItems: [
      {
        type: 'menu',
        label: Strings(STRINGS.POPULATE_WITH_PRESET_TITLE),
        commandId: 'populateWithPreset'
      },
      {
        type: 'menu',
        label: Strings(STRINGS.POPULATE_WITH_JSON_TITLE),
        commandId: 'populateWithJSON'
      },
      {
        type: 'menu',
        label: Strings(STRINGS.POPULATE_FROM_URL_TITLE),
        commandId: 'populateFromURL'
      },
      {
        type: 'menu',
        label: Strings(STRINGS.POPULATE_AGAIN_TITLE),
        commandId: 'populateAgain',
        shortcut: {
          mac: 'Cmd+Shift+X',
          win: 'Ctrl+Shift+X'
        }
      },
      {
        type: 'menu',
        label: Strings(STRINGS.LAST_USED_DATA_TITLE),
        commandId: 'lastUsedData'
      },
      {
        type: 'menu',
        label: Strings(STRINGS.CLEAR_LAYERS_TITLE),
        commandId: 'clearLayers'
      },
      {
        type: 'menu',
        label: Strings(STRINGS.NEED_HELP_TITLE),
        commandId: 'needHelp'
      }
    ]
  }]
}
