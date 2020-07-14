/**
 * Utils library
 */

import base64 from 'base-64'
import utf8 from 'utf8'

export function callPlugin (handler, data, callId) {

  let hash = encode({
    handler,
    data,
    callId
  })

  window.location.hash = hash
}

export function resolvePluginCall (callId, data) {
  callPlugin('resolveCall', data, callId)
}

export function getPropertyValue (object, property, defaultValue) {
  return object.hasOwnProperty(property) ? object[property] : defaultValue
}

export function getArrayStringAccessor (object) {
  let strings = []
  findLongestArrayRecursive(object)

  function findLongestArrayRecursive (obj) {
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
      if (i === 0) string += `${strings[i]}`
      if (i !== 0) string += `.${strings[i]}`
    }
  }

  return string
}

export function accessObjectByString (object, string) {
  let newObject = JSON.parse(JSON.stringify(object))
  if (string && string.length) {
    string = string.replace(/\[(\w+)\]/g, '.$1') // convert indices to properties e.g [0] => .0
    string = string.replace(/^\./, '') // strip leading dot

    let splitString = string.split('.')
    for (let i = 0; i < splitString.length; i++) {
      let key = splitString[i]
      newObject = newObject[key]
    }
  }

  return newObject
}

export function isValidURL (url) {
  if (/((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=+$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=+$,\w]+@)[A-Za-z0-9.-]+)((?:\/[+~%/.\w-_]*)?\??(?:[-+=&;%@.\w_]*)#?(?:[\w]*))?)/g.test(url)) {
    return true
  } else {
    return false
  }
}

export function encode (data) {

  let dataText = JSON.stringify(data)
  let dataBytes = utf8.encode(dataText)
  let encodedData = base64.encode(dataBytes)

  return encodedData
}

export function decode (encodedData) {

  let dataBytes = base64.decode(encodedData)
  let dataText = utf8.decode(dataBytes)
  let data = null
  try {
    data = JSON.parse(dataText)
  } catch (e) {}

  return data
}
