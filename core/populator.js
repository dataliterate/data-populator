/**
 * Populator
 *
 * Provides shared populator functionality.
 */

import * as Utils from './utils'

export function selectDataRow(data, usedRows, randomize) {
  let dataRow
  if (data instanceof Array) {
    if (randomize) {
      let lastRandomIndex = usedRows.length ? usedRows[usedRows.length - 1] : -1

      // Reset used rows
      if (usedRows.length === data.length) {
        usedRows.length = 0
      }

      // Get random index
      let randomIndex
      while (!randomIndex && randomIndex !== 0) {
        // Get random in range
        let random = Utils.randomInteger(0, data.length)

        // Make sure index doesn't exist in already chosen random indexes
        if (usedRows.indexOf(random) === -1) {
          // Make sure it's not the same as the last chosen random index
          if (data.length > 1) {
            if (random !== lastRandomIndex) {
              randomIndex = random
            }
          } else {
            randomIndex = random
          }
        }
      }

      // Store selected random index
      usedRows.push(randomIndex)

      // Get data row for random index
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

  return {
    dataRow
  }
}
