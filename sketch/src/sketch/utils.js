/**
 * Utils
 *
 * Provides utility and miscellaneous functionality.
 */

import base64 from 'base-64'
import utf8 from 'utf8'
import sketch from 'sketch'

/**
 * Gets the Sketch version.
 *
 * @returns {Number}
 */
export function sketchVersion() {
  let sketchVersion = NSBundle.mainBundle().objectForInfoDictionaryKey('CFBundleShortVersionString')
  return Number(sketchVersion)
}

/**
 * Converts the native Objective-C array to a Javascript Array.
 *
 * @param {NSArray} nativeArray
 * @returns {Array}
 */
export function convertToJSArray(nativeArray) {
  if (nativeArray.class() === MSLayerArray) {
    nativeArray = nativeArray.layers()
  }
  let length = nativeArray.count()
  let jsArray = []

  while (jsArray.length < length) {
    jsArray.push(nativeArray.objectAtIndex(jsArray.length))
  }
  return jsArray
}

/**
 * Creates a copy of the provided layer.
 *
 * @param {MSLayer} layer
 * @returns {MSLayer}
 */
export function copyLayer(layer) {
  // create duplicate
  let layerCopy = layer.duplicate()

  // remove duplicate from parent
  layerCopy.removeFromParent()

  return layerCopy
}

/**
 * Encodes data encoded with base64 and utf8 encodings.
 *
 * @param {Any} data
 * @return {String}
 */
export function encode(data) {
  let dataText = JSON.stringify(data)
  let dataBytes = utf8.encode(dataText)
  let encodedData = base64.encode(dataBytes)

  return encodedData
}

/**
 * Decodes data encoded with base64 and utf8 encodings.
 *
 * @param {String} encodedData
 * @return {Any}
 */
export function decode(encodedData) {
  let dataBytes = base64.decode(encodedData)
  let dataText = utf8.decode(dataBytes)
  let data = null
  try {
    data = JSON.parse(dataText)
  } catch (e) {}

  return data
}

/**
 * Set or get metadata stored in a specific document.
 *
 * @param {MSDocument} doc
 * @param {String} key
 * @param {String} newValue
 * @return {String}
 */
export function documentMetadata(doc, key, newValue) {
  if (newValue) {
    sketch.Settings.setDocumentSettingForKey(doc, key, newValue)
  }

  return sketch.Settings.documentSettingForKey(doc, key)
}

/**
 * Get nested object by string.
 *
 * @param {Object/Array} object
 * @param {String} string
 * @return {Object/Array}
 */
export function accessObjectByString(object, string) {
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
