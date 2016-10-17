/**
 * Plugin
 *
 * Defines the plugin structure and metadata.
 */


import * as commands from './commands'

export const HKSketchFusionExtension = {
  name: 'Sketch Data Populator',
  bundleName: 'Sketch Data Populator',
  description: 'Say goodbye to Lorem Ipsum: populate your Sketch documents with meaningful data.',
  author: 'precious design studio',
  authorEmail: 'info@precious-forever.com',
  version: '2.0.0',
  identifier: 'com.precious-forever.sketch.datapopulator2',
  compatibleVersion: '3.7',
  menu: {
    'isRoot': false,
    'items': [
      'populateWithPreset',
      'populateWithJSON',
      'populateTable',
      'populateAgain',
      'revealPresets',
      'clearLayers'
    ]
  },
  commands: {
    populateWithPreset: {
      name: 'Populate with Preset',
      shortcut: '',
      run: commands.populateWithPreset
    },
    populateWithJSON: {
      name: 'Populate with JSON',
      shortcut: '',
      run: commands.populateWithJSON
    },
    populateTable: {
      name: 'Populate Table',
      shortcut: '',
      run: commands.populateTable
    },
    populateAgain: {
      name: 'Populate Again',
      shortcut: 'cmd shift x',
      run: commands.populateAgain
    },
    revealPresets: {
      name: 'Reveal Presets',
      shortcut: '',
      run: commands.revealPresets
    },
    clearLayers: {
      name: 'Clear Layers',
      shortcut: '',
      run: commands.clearLayers
    }
  }
}
