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
  version: '2.2.2',
  identifier: 'com.precious-forever.sketch.datapopulator2',
  compatibleVersion: '48',
  appcast: 'https://github.com/preciousforever/sketch-data-populator/blob/master/appcast.xml',
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
      description: 'Pick one of Data Populator\'s built in Presets',
      icon: '../Resources/populateWithPreset.png',
      run: commands.populateWithPreset
    },
    populateWithJSON: {
      name: 'Populate with JSON',
      shortcut: '',
      description: 'Pick a local JSON file',
      icon: '../Resources/populateWithJSON.png',
      run: commands.populateWithJSON
    },
    populateTable: {
      name: 'Populate Table',
      shortcut: '',
      description: 'Pick CSV file to populate a table',
      icon: '../Resources/populateTable.png',
      run: commands.populateTable
    },
    populateAgain: {
      name: 'Populate Again',
      shortcut: 'cmd shift x',
      description: 'Populate again with last used setup',
      icon: '../Resources/populateAgain.png',
      run: commands.populateAgain
    },
    revealPresets: {
      name: 'Reveal Presets',
      shortcut: '',
      description: 'Show Data Populator\'s Presets in Finder',
      icon: '../Resources/revealPresets.png',
      run: commands.revealPresets
    },
    clearLayers: {
      name: 'Clear Layers',
      shortcut: '',
      description: 'Remove all populated data from selected Layers',
      icon: '../Resources/clearLayers.png',
      run: commands.clearLayers
    }
  }
}
