/**
 * Populate Again
 *
 * Populates the selected layers using the same settings as last time.
 */


import Context from '../context'
import * as Populator from '../library/populator'
import Options, * as OPTIONS from '../library/options'

import PopulateWithPreset from './populateWithPreset'
import PopulateWithJSON from './populateWithJSON'
import PopulateTable from './populateTable'


export default (context) => {
  Context(context)

  //get options
  let options = Options()

  //check if there is a data path set
  if(options[OPTIONS.LAST_DATA_PATH]) {

    //get type of last populate command
    switch(String(options[OPTIONS.LAST_POPULATE_TYPE])) {

      //populate with preset
      case Populator.POPULATE_TYPE.PRESET:
        PopulateWithPreset(context, true)
        break

      //populate with JSON
      case Populator.POPULATE_TYPE.JSON:
        PopulateWithJSON(context, true)
        break

      //populate table
      case Populator.POPULATE_TYPE.TABLE:
        PopulateTable(context, true)
        break
    }
  }
}