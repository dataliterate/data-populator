/**
 * Options
 *
 * Provides functionality to get and set user options shared across the plugin.
 */

import {log} from '../../core'
import * as Data from './data'

export const RANDOMIZE_DATA = 'randomizeData'
export const TRIM_TEXT = 'trimText'
export const INSERT_ELLIPSIS = 'insertEllipsis'
export const DEFAULT_SUBSTITUTE = 'defaultSubstitute'

/**
 * Gets or sets the stored options in options artboard.
 *
 * @returns {Object}
 */
export default function (newOptions) {
  return new Promise(async (resolve, reject) => {

    // set new options
    if (newOptions) {
      try {
        await Data.saveFileInDataFolder('options.json', JSON.stringify({
          [RANDOMIZE_DATA]: newOptions[RANDOMIZE_DATA],
          [TRIM_TEXT]: newOptions[TRIM_TEXT],
          [INSERT_ELLIPSIS]: newOptions[INSERT_ELLIPSIS],
          [DEFAULT_SUBSTITUTE]: newOptions[DEFAULT_SUBSTITUTE]
        }))

        resolve(newOptions)
      } catch (e) {
        log(e)
      }
    }

    let options
    try {
      options = JSON.parse(await Data.loadFileInDataFolder('options.json'))
    } catch (e) {
      log(e)
    }

    if (!options) {
      options = {
        [RANDOMIZE_DATA]: true,
        [TRIM_TEXT]: true,
        [INSERT_ELLIPSIS]: true,
        [DEFAULT_SUBSTITUTE]: ''
      }
    }

    resolve(options)
  })
}
