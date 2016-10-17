/**
 * Utils library
 *
 * Provides utility and miscellaneous functionality.
 */


/**
 * Converts the native Objective-C array to a Javascript Array.
 *
 * @param {NSArray} nativeArray
 * @returns {Array}
 */
export function convertToJSArray(nativeArray) {
  let length = nativeArray.count();
  let jsArray = [];

  while (jsArray.length < length) {
    jsArray.push(nativeArray.objectAtIndex(jsArray.length));
  }
  return jsArray;
}


/**
 * Creates a copy of the provided layer.
 *
 * @param {MSLayer} layer
 * @returns {MSLayer}
 */
export function copyLayer(layer) {

  //create duplicate
  let layerCopy = layer.duplicate();

  //remove duplicate from parent
  layerCopy.removeFromParent();

  return layerCopy;
}


/**
 * Generates a random integer between min and max inclusive.
 *
 * @param {Number} min
 * @param {Number} max
 * @returns {Number}
 */
export function randomInteger(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}


/**
 * Substitutes the placeholders in the string using the provided values.
 *
 * @param {string} string - String with placeholders in the {placeholder} format.
 * @param {Object} values - Object with values to substitute for placeholders.
 * @returns {string} - String with placeholders substituted for values.
 */
export function mergeStringWithValues(string, values) {

  //get properties in values
  let properties = Object.keys(values);

  properties.forEach(function (property) {

    //escape regex
    let sanitisedProperty = property.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
    sanitisedProperty = '{' + sanitisedProperty + '}';

    //build regex
    let exp = RegExp(sanitisedProperty, 'g');

    //replace instances of property placeholder with value
    string = string.replace(exp, values[property]);
  });

  return string;
}


/**
 * Parses the string and returns the value of the correct type.
 *
 * @param {string} value
 * @returns {*}
 */
export function parsePrimitives(value) {

    if (value == '') {
      return value
    } else if (value == 'true' || value == '1') {
      value = true
    } else if (value == 'false' || value == '0') {
      value = false
    } else if (value == 'null') {
      value = null
    } else if (value == 'undefined') {
      value = undefined
    } else if (!isNaN(value) && value != '') {
      value = parseFloat(value)
    }

    return value
}