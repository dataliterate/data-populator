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
  authorEmail: 'feedback@datapopulator.com',
  version: '2.3.3',
  identifier: 'com.precious-forever.sketch.datapopulator2',
  compatibleVersion: '48',
  icon: 'icon.png',
  appcast: 'https://raw.githubusercontent.com/preciousforever/sketch-data-populator/master/appcast.xml',
  menu: {
    'isRoot': false,
    'items': [
      'populateWithPreset',
      'populateWithJSON',
      'populateTable',
      'populateAgain',
      'revealPresets',
      'setPresetsLibrary',
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
      description: 'Show Data Populator\'s presets in Finder',
      icon: '../Resources/revealPresets.png',
      run: commands.revealPresets
    },
    setPresetsLibrary: {
      name: 'Set Presets Library',
      shortcut: '',
      description: 'Set the location of Data Populator\'s presets',
      icon: '../Resources/revealPresets.png',
      run: commands.setPresetsLibrary
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
