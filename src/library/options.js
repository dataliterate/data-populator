/**
 * Options library
 *
 * Provides functionality to get and set user options shared across the plugin.
 */


import * as Utils from './utils'


//data options
export const RANDOMIZE_DATA = 'randomizeData'
export const TRIM_TEXT = 'trimText'
export const INSERT_ELLIPSIS = 'insertEllipsis'
export const DEFAULT_SUBSTITUTE = 'defaultSubstitute'

//layout options
export const CREATE_GRID = 'createGrid'
export const ROWS_COUNT = 'rowsCount'
export const ROWS_MARGIN = 'rowsMargin'
export const COLUMNS_COUNT = 'columnsCount'
export const COLUMNS_MARGIN = 'columnsMargin'

//populator options
export const LAST_POPULATE_TYPE = 'lastPopulateType'
export const SELECTED_PRESET_INDEX = 'selectedPresetIndex'

//path options
export const LAST_JSON_PATH = 'lastJSONPath'
export const LAST_TSV_PATH = 'lastTSVPath'
export const LAST_DATA_PATH = 'lastDataPath'

// cloudstitch options
export const LAST_CLOUDSTITCH_URL = 'lastCloudstitchURL'
export const LAST_CLOUDSTITCH_USERNAME = 'lastCloudstitchUsername'
export const LAST_CLOUDSTITCH_APPNAME = 'lastCloudstitchAppname'
export const LAST_CLOUDSTITCH_WORKSHEET = 'lastCloudstitchWorksheet'

let OPTIONS = [
  RANDOMIZE_DATA, TRIM_TEXT, INSERT_ELLIPSIS, DEFAULT_SUBSTITUTE,
  CREATE_GRID, ROWS_COUNT, ROWS_MARGIN, COLUMNS_COUNT, COLUMNS_MARGIN,
  LAST_POPULATE_TYPE, SELECTED_PRESET_INDEX,
  LAST_JSON_PATH, LAST_TSV_PATH, LAST_DATA_PATH,
  LAST_CLOUDSTITCH_URL, LAST_CLOUDSTITCH_USERNAME, LAST_CLOUDSTITCH_APPNAME,
  LAST_CLOUDSTITCH_WORKSHEET
]

/**
 * Gets or sets the stored options in user defaults.
 *
 * @returns {Object}
 */
export default function(newOptions) {

  //set new options
  if(newOptions) {
    OPTIONS.forEach((key) => {

      //save into user defaults
      if(newOptions.hasOwnProperty(key)) {
        NSUserDefaults.standardUserDefaults().setObject_forKey(newOptions[key], 'SketchDataPopulator_' + key)
      }
    })

    //sync defaults
    NSUserDefaults.standardUserDefaults().synchronize()
  }

  //get options
  let options = {}
  OPTIONS.map((key) => {

    //get options from user defaults
    let option = NSUserDefaults.standardUserDefaults().objectForKey('SketchDataPopulator_' + key)

    //convert to correct type and set
    if(option) {
      options[key] = Utils.parsePrimitives(String(option))
    }
  })

  return options
}


