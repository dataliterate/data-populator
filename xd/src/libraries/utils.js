/**
 * Utils
 *
 * Provides utility and miscellaneous functionality.
 */

import * as coreLibs from '@data-populator/core'
import * as fileSystemLib from './fileSystem'

/**
 * Returns a persisted ID that identifies the device.
 */
export function deviceId() {
  return new Promise(async resolve => {
    let id
    try {
      id = await fileSystemLib.readFile('data', 'deviceId')
    } catch (e) {
      id = coreLibs.utils.generateUUID()
      await fileSystemLib.writeFile('data', 'deviceId', id)
    }

    resolve(id)
  })
}
