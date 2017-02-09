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
  version: '2.1.2',
  identifier: 'com.precious-forever.sketch.datapopulator2',
  compatibleVersion: '3.7',
  menu: {
    'isRoot': false,
    'items': [
      'populateWithPreset',
      'populateWithJSON',
      'populateWithCloudstitchSpreadsheet',
      'populateTable',
      'populateAgain',
      'revealPresets',
      'createCloudstitchSpreadsheet',
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
    populateWithCloudstitchSpreadsheet: {
      name: 'Populate with Spreadsheet',
      shortcut: '',
      description: 'Pick a Cloud-hosted Google Sheet or Excel File',
      icon: '../Resources/populateWithCloudstitchSpreadsheet.png',
      run: commands.populateWithCloudstitchSpreadsheet
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
    createCloudstitchSpreadsheet: {
      name: 'Create Spreadsheet',
      shortcut: '',
      description: 'Create a linked spreadsheet to supply data',
      icon: '../Resources/createCloudstitchSpreadsheet.png',
      run: commands.createCloudstitchSpreadsheet
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
