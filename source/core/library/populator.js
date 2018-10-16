/**
 * Placeholders
 *
 * Provides shared populator functionality.
 */

import * as Utils from './utils'

export function selectDataRow (data, usedRows, randomize) {

  let dataRow
  if (data instanceof Array) {
    if (randomize) {

      let lastRandomIndex = usedRows.length ? usedRows[usedRows.length - 1] : -1

      // reset used rows
      if (usedRows.length === data.length) {
        usedRows.length = 0
      }

      // get random index
      let randomIndex
      while (!randomIndex && randomIndex !== 0) {

        // get random in range
        let random = Utils.randomInteger(0, data.length)

        // make sure index doesn't exist in already chosen random indexes
        if (usedRows.indexOf(random) === -1) {

          // make sure it's not the same as the last chosen random index
          if (data.length > 1) {
            if (random !== lastRandomIndex) {
              randomIndex = random
            }
          } else {
            randomIndex = random
          }
        }
      }

      // store selected random index
      usedRows.push(randomIndex)

      // get data row for random index
      dataRow = data[randomIndex]

    } else {

      if (usedRows.length > data.length - 1) {
        usedRows.length = 0
      }

      dataRow = data[usedRows.length]
      usedRows.push(dataRow)
    }
  } else {
    dataRow = data
  }

  return dataRow
}
