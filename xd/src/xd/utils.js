/**
 * Utils
 *
 * Provides utility and miscellaneous functionality.
 */

import * as Utils from '@data-populator/core/utils'
import * as Data from './data'

/**
 * Returns a persisted ID that identifies the device.
 */
export function deviceId() {
  return new Promise(async resolve => {
    let id
    try {
      id = await Data.loadFileInDataFolder('deviceId')
    } catch (e) {
      id = Utils.generateUUID()
      await Data.saveFileInDataFolder('deviceId', id)
    }

    resolve(id)
  })
}

/**
 * Checks if url is valid.
 *
 * @param {String} url
 * @param {Boolean}
 */
export function isValidURL(url, http) {
  if (http) {
    if (
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g.test(
        url
      )
    ) {
      return true
    } else {
      return false
    }
  } else {
    if (
      /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/g.test(
        url
      )
    ) {
      return true
    } else {
      return false
    }
  }
}

/**
 * Capitalize first letter of string.
 *
 * @param {String} string
 * @param {String}
 */
export function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

/**
 * Access object by string.
 *
 * @param {Object} object
 * @param {String} string
 * @param {Object}
 */
export function accessObjectByString(object, string) {
  let newObject = JSON.parse(JSON.stringify(object))
  if (string && string.length) {
    string = string.replace(/\[(\w+)\]/g, '.$1') // convert indices to properties e.g [0] => .0
    string = string.replace(/^\./, '') // strip leading dot

    let splitString = Utils.getArrayForStringPath(string)
    for (let i = 0; i < splitString.length; i++) {
      let key = splitString[i]
      newObject = newObject[key]
    }
  }

  return newObject
}

/**
 * Get the string accessor of the first array in object that contains objects.
 *
 * @param {Object} object
 * @param {String}
 */
export function getArrayStringAccessor(object) {
  // let array
  let strings = []
  findLongestArrayRecursive(object)

  function findLongestArrayRecursive(obj) {
    let newObject = JSON.parse(JSON.stringify(obj))
    let firstLine = JSON.stringify(newObject, null, 4).split('\n')[0].trim()

    if (firstLine === '{') {
      for (const [key, value] of Object.entries(newObject)) {
        if (value === Object(value)) {
          strings.push(key)
          findLongestArrayRecursive(value)
        }
      }
    } else if (firstLine === '[') {
      let objectsInArray = true
      for (let i = 0; i < newObject.length; i++) {
        if (JSON.stringify(newObject[i], null, 4).split('\n')[0].trim() !== '{') {
          objectsInArray = false
        }
      }

      if (!objectsInArray || newObject.length <= 1) {
        for (let i = 0; i < newObject.length; i++) {
          if (newObject[i] === Object(newObject[i])) {
            strings.push(i)
            findLongestArrayRecursive(newObject[i])
          }
        }
      }
    }
  }

  let string = ''
  for (let i = 0; i < strings.length; i++) {
    if (typeof strings[i] === 'number') {
      string += `[${strings[i]}]`
    } else if (typeof strings[i] === 'string') {
      // Wrap string if it contains .
      const s = strings[i].indexOf('.') > 0 ? `\`${strings[i]}\`` : strings[i]

      if (i === 0) string += `${s}`
      if (i !== 0) string += `.${s}`
    }
  }

  // log(string)
  return string
}
