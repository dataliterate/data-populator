/**
 * Populator library
 *
 * Provides functionality to populate layers.
 */


import Context from '../context'
import * as Utils from './utils';
import * as Data from './data'
import * as Layers from './layers';
import * as Placeholders from './placeholders'
import * as Args from './args'
import * as Actions from './actions'


/**
 * Populate types:
 */
export const POPULATE_TYPE = {
  PRESET: 'preset',
  JSON: 'json',
  TABLE: 'table'
}


/**
 * Populates a table layer (layer group with specific structure) using the
 * provided table data.
 *
 * @param {MSLayerGroup} layer
 * @param {Object} data
 * @param {Object} opt
 *
 * opt: {
 *   rootDir: {string},
 *   trimText: {boolean},
 *   insertEllipsis: {boolean},
 *   defaultSubstitute: {string}
 * }
 */
export function populateTable(layer, data, opt) {

  //populate row headers
  let rowsHeader = Layers.findLayerInLayer('rows', true, Layers.GROUP, layer, true, null)
  populateTableHeader(rowsHeader, data.rowGroups, opt)

  //populate column headers
  let columnsHeader = Layers.findLayerInLayer('columns', true, Layers.GROUP, layer, true, null)
  populateTableHeader(columnsHeader, data.columnGroups, opt)

  //populate cells
  let cellsContainer = Layers.findLayerInLayer('cells', true, Layers.GROUP, layer, true, null)
  let rows = Layers.findLayersInLayer('*', false, Layers.GROUP, cellsContainer, true, null)
  for (let i = 0; i < rows.length; i++) {
    let row = rows[i]
    let rowData = data.cells[i]
    if (!rowData) break

    //get all cells for row
    let cells = Layers.findLayersInLayer('*', false, Layers.GROUP, row, true, null)
    for (let j = 0; j < cells.length; j++) {
      let cell = cells[j]
      let cellData = rowData[j]
      if (!cellData) break

      //populate cell
      populateLayer(cell, cellData, {
        rootDir: opt.rootDir,
        trimText: opt.trimText,
        insertEllipsis: opt.insertEllipsis,
        defaultSubstitute: opt.defaultSubstitute
      })
    }
  }
}


/**
 * Populates table column and row headers recursively.
 *
 * @param {MSLayerGroup} header
 * @param {Object} data
 * @param {Object} opt
 *
 * opt: {
 *   rootDir: {string},
 *   trimText: {boolean},
 *   insertEllipsis: {boolean},
 *   defaultSubstitute: {string}
 * }
 */
function populateTableHeader(header, data, opt) {

  //get groups in header
  let groups = Layers.findLayersInLayer('*', false, Layers.GROUP, header, true, null)
  for (let i = 0; i < groups.length; i++) {
    let group = groups[i]
    let groupData = data[i]
    if (!groupData) break

    //get nested header
    let nestedHeader = Layers.findLayerInLayer('groups', true, Layers.GROUP, group, true, null)

    //find other layers to populate
    let groupContent = Layers.findLayersInLayer('*', false, Layers.ANY, group, true, [nestedHeader]);

    //populate content layers
    populateLayers(groupContent, groupData, {
      rootDir: opt.rootDir,
      randomizeData: false,
      trimText: opt.trimText,
      insertEllipsis: opt.insertEllipsis,
      defaultSubstitute: opt.defaultSubstitute
    })

    //populate nested headers
    if (nestedHeader) {
      populateTableHeader(nestedHeader, groupData.groups, opt)
    }
  }
}


/**
 * Populates an array of layers using the provided data array.
 *
 * @param {Array} layers
 * @param {Array} data
 * @param {Object} opt
 *
 * opt: {
 *   rootDir: {string},
 *   randomizeData: {boolean},
 *   trimText: {boolean},
 *   insertEllipsis: {boolean},
 *   defaultSubstitute: {string}
 * }
 */
export function populateLayers(layers, data, opt) {

  //keep track of already selected random indexes
  let randomIndexes = []
  let lastRandomIndex = 0

  //process each layer
  for (let i = 0; i < layers.length; i++) {
    let layer = layers[i]

    //get data row
    let dataRow
    if (data instanceof Array) {
      if (opt.randomizeData) {

        //reset random index tracking
        if (randomIndexes.length == data.length) {
          randomIndexes = []
        }

        //get random index
        let randomIndex
        while (!randomIndex && randomIndex !== 0) {

          //get random in range
          let random = Utils.randomInteger(0, data.length)

          //make sure index doesn't exist in already chosen random indexes
          if (randomIndexes.indexOf(random) == -1) {

            //make sure it's not the same as the last chosen random index
            if (data.length > 1) {
              if (random != lastRandomIndex) {
                randomIndex = random
              }
            }
            else {
              randomIndex = random
            }
          }
        }

        //store selected random index
        lastRandomIndex = randomIndex
        randomIndexes.push(randomIndex)

        //get data row for random index
        dataRow = data[randomIndex]

        //reset random index (so next iteration generates a new one)
        randomIndex = null
      }
      else {
        dataRow = data[i % data.length]
      }
    }
    else {
      dataRow = data
    }

    //populate layer
    populateLayer(layer, dataRow, {
      rootDir: opt.rootDir,
      trimText: opt.trimText,
      insertEllipsis: opt.insertEllipsis,
      defaultSubstitute: opt.defaultSubstitute
    })
  }
}


/**
 * Populates a layers using the provided data.
 *
 * @param {MSLayer} layer
 * @param {Object} data
 * @param {Object} opt
 *
 * opt: {
 *   rootDir: {string},
 *   trimText: {boolean},
 *   insertEllipsis: {boolean},
 *   defaultSubstitute: {string}
 * }
 */
export function populateLayer(layer, data, opt) {

  //populate group layer
  //artboards are also layer groups
  if (Layers.isLayerGroup(layer)) {

    //populate artboard names
    let artboardLayers = Layers.findLayersInLayer('*', false, Layers.ARTBOARD, layer, false, null)
    artboardLayers.forEach((artboardLayer) => {
      populateArtboard(artboardLayer, data, {
        defaultSubstitute: opt.defaultSubstitute
      })
      Actions.performActions(artboardLayer, data)
    })

    //populate text layers
    let textLayers = Layers.findLayersInLayer('*', false, Layers.TEXT, layer, false, null)
    textLayers.forEach((textLayer) => {
      populateTextLayer(textLayer, data, {
        trimText: opt.trimText,
        insertEllipsis: opt.insertEllipsis,
        defaultSubstitute: opt.defaultSubstitute
      })
      Actions.performActions(textLayer, data)
    })

    //populate images
    let imageLayers = Layers.findLayersInLayer('*', false, Layers.SHAPE, layer, false, null)
    imageLayers = imageLayers.concat(Layers.findLayersInLayer('*', false, Layers.BITMAP, layer, false, null))
    imageLayers.forEach((imageLayer) => {
      populateImageLayer(imageLayer, data, {
        rootDir: opt.rootDir
      })
      Actions.performActions(imageLayer, data)
    })

    //populate symbols
    let symbolLayers = Layers.findLayersInLayer('*', false, Layers.SYMBOL, layer, false, null)
    symbolLayers.forEach(function (symbolLayer) {
      populateSymbolLayer(symbolLayer, data, opt)
      Actions.performActions(symbolLayer, data)
    })

    //perform actions on group
    Actions.performActions(layer, data)

    //perform actions on sub-groups
    let groupLayers = Layers.findLayersInLayer('*', false, Layers.GROUP, layer, false, null)
    groupLayers.forEach(function (groupLayer) {
      Actions.performActions(groupLayer, data)
    })
  }

  //populate text layer
  else if (Layers.isLayerText(layer)) {
    populateTextLayer(layer, data, {
      trimText: opt.trimText,
      insertEllipsis: opt.insertEllipsis,
      defaultSubstitute: opt.defaultSubstitute
    })
    Actions.performActions(layer, data)
  }

  //populate image layer
  else if (Layers.isLayerShapeGroup(layer) || Layers.isLayerBitmap(layer)) {

    //populate image placeholder
    if (layer.name().indexOf('{') > -1) {
      populateImageLayer(layer, data, {
        rootDir: opt.rootDir
      })
      Actions.performActions(layer, data)
    }
  }

  //populate symbol
  else if (Layers.isSymbolInstance(layer)) {
    populateSymbolLayer(layer, data, opt)
    Actions.performActions(layer, data)
  }
}


/**
 * Restores the original layer content and clears the metadata.
 *
 * @param {MSLayer} layer
 */
export function clearLayer(layer) {

  //clear group layer
  if (Layers.isLayerGroup(layer)) {

    //clear artboard names
    let artboardLayers = Layers.findLayersInLayer('*', false, Layers.ARTBOARD, layer, false, null)
    artboardLayers.forEach((artboardLayer) => {
      clearArtboard(artboardLayer)
    })

    //clear text layers
    let textLayers = Layers.findLayersInLayer('*', false, Layers.TEXT, layer, false, null)
    textLayers.forEach((textLayer) => {
      clearTextLayer(textLayer)
    })

    //clear images
    let imageLayers = Layers.findLayersInLayer('{*}*', false, Layers.SHAPE, layer, false, null)
    imageLayers = imageLayers.concat(Layers.findLayersInLayer('{*}*', false, Layers.BITMAP, layer, false, null))
    imageLayers.forEach((imageLayer) => {
      clearImageLayer(imageLayer)
    })

    //clear symbols
    let symbolLayers = Layers.findLayersInLayer('*', false, Layers.SYMBOL, layer, false, null)
    symbolLayers.forEach(function (symbolLayer) {
      clearSymbolLayer(symbolLayer)
    })
  }

  //clear text layer
  else if (Layers.isLayerText(layer)) {
    clearTextLayer(layer)
  }

  //clear image layer
  else if (Layers.isLayerShapeGroup(layer) || Layers.isLayerBitmap(layer)) {

    //populate image placeholder
    if (layer.name().indexOf('{') > -1) {
      clearImageLayer(layer)
    }
  }

  //clear symbol
  else if (Layers.isSymbolInstance(layer)) {
    clearSymbolLayer(layer)
  }
}



/**
 * Removes any Data Populator data from a layer's metadata.
 *
 * @param {MSLayer} layer
 */
function removeLayerMetadata(layer) {

  //get user info
  let userInfo = NSMutableDictionary.dictionaryWithDictionary(layer.userInfo())

  //prepare clean user info
  let cleanUserInfo = NSMutableDictionary.alloc().init()

  //get keys
  let keys = Utils.convertToJSArray(userInfo.allKeys())

  //add values other than data populator's
  for(let i = 0; i < keys.length; i++) {
    let key = keys[i]
    if(key.indexOf('datapopulator') == -1) {
      cleanUserInfo.setValue_forKey(userInfo.valueForKey(key), key)
    }
  }

  //set clean user info
  layer.setUserInfo(cleanUserInfo)
}


/**
 * Populates a symbol instance layer.
 *
 * @param {MSSymbolInstance} layer
 * @param {Object} data
 * @param {Object} opt
 *
 * opt: {
 *   rootDir: {string},
 *   trimText: {boolean},
 *   insertEllipsis: {boolean},
 *   defaultSubstitute: {string}
 * }
 */
function populateSymbolLayer(layer, data, opt) {

  //get existing overrides
  let existingOverrides = layer.overrides()
  if (existingOverrides) {
    existingOverrides = layer.overrides().objectForKey(NSNumber.numberWithInt(0))
  } else {
    existingOverrides = NSDictionary.alloc().init()
  }

  //create mutable overrides
  let overrides = NSMutableDictionary.dictionaryWithDictionary(existingOverrides)

  //get master for symbol instance
  let symbolMaster = layer.symbolMaster()

  //populate text layers
  let textLayers = Layers.findLayersInLayer('*', false, Layers.TEXT, symbolMaster, false, null)
  textLayers.forEach((textLayer) => {
    populateTextLayer(textLayer, data, {
      trimText: opt.trimText,
      insertEllipsis: opt.insertEllipsis,
      defaultSubstitute: opt.defaultSubstitute,
      overrides: overrides
    })
  })

  //populate images
  let imageLayers = Layers.findLayersInLayer('{*}', false, Layers.SHAPE, symbolMaster, false, null)
  imageLayers = imageLayers.concat(Layers.findLayersInLayer('{*}', false, Layers.BITMAP, symbolMaster, false, null))
  imageLayers.forEach((imageLayer) => {
    populateImageLayer(imageLayer, data, {
      rootDir: opt.rootDir,
      overrides: overrides
    })
  })

  //populate symbols
  let symbolLayers = Layers.findLayersInLayer('*', false, Layers.SYMBOL, symbolMaster, false, null)
  symbolLayers.forEach(function (symbolLayer) {

    //get overrides from nested symbol
    let nestedOverrides = populateSymbolLayer(symbolLayer, data, opt)
    overrides.setValue_forKey(nestedOverrides, symbolLayer.objectID())
  })

  //set new overrides
  layer.setOverrides(NSDictionary.dictionaryWithObject_forKey(overrides, NSNumber.numberWithInt(0)))

  //return overrides
  return overrides
}


/**
 * Clears the symbol layer.
 *
 * @param {MSSymbolInstance} layer
 */
function clearSymbolLayer(layer) {

  //remove overrides
  layer.setOverrides(null)

  //remove metadata
  removeLayerMetadata(layer)
}


/**
 * Populates a text layer.
 *
 * @param {MSTextLayer} layer
 * @param {Object} data
 * @param {Object} opt
 *
 * opt: {
 *   trimText: {boolean},
 *   insertEllipsis: {boolean},
 *   defaultSubstitute: {string}
 *   overrides: {NSMutableDictionary}
 * }
 */
function populateTextLayer(layer, data, opt) {

  //check if layer is in symbol
  let inSymbol = !!opt.overrides

  //get original text
  let originalText = getOriginalText(layer, inSymbol)

  //set original text
  //set even if inside symbol so that if taken out of symbol, it can be repopulated
  setOriginalText(layer, originalText)

  //extract placeholders from layer name
  let namePlaceholders = Placeholders.extractPlaceholders(layer.name())

  //extract args
  let args = Args.extractArgs(layer.name(), [{
    name: 'lines',
    alias: 'l',
    type: Number
  }])

  //populate with placeholder in layer name
  let populatedString
  if (namePlaceholders.length) {

    //populate first placeholder
    populatedString = Placeholders.populatePlaceholder(namePlaceholders[0], data, opt.defaultSubstitute)
  }

  //populate based on content of text layer
  else {

    //extract placeholders from original text
    let placeholders = Placeholders.extractPlaceholders(originalText)

    //create populated string, starting with the original text and gradually replacing placeholders
    populatedString = originalText
    placeholders.forEach((placeholder) => {

      //populate placeholder found in the original text
      let populatedPlaceholder = Placeholders.populatePlaceholder(placeholder, data, opt.defaultSubstitute)

      //replace original placeholder string (e.g. {firstName}) with populated placeholder string
      populatedString = populatedString.replace(placeholder.string, populatedPlaceholder)
    })
  }

  //trim text, taking into account the lines arg if available
  if (layer.textBehaviour() == 1 && opt.trimText) {
    populatedString = getTrimmedText(layer, populatedString, opt.insertEllipsis, args.lines)
  }

  //set populated string as an override for text layer within a symbol
  if (inSymbol) {

    //make text invisible by setting it to a space
    if (!populatedString.length) {
      populatedString = ' '
    }

    //get id of text layer
    let layerId = layer.objectID()

    //add override for layer
    opt.overrides.setValue_forKey(populatedString, layerId)
  }

  //set populated string for normal text layer
  else {

    //hide text layer if populated string is empty
    if (!populatedString.length) {
      populatedString = '-'
      layer.setIsVisible(false)
    }
    else {
      layer.setIsVisible(true)
    }

    //get current font
    let font = layer.font()

    //set text layer text
    layer.setStringValue(populatedString)

    //set current font back
    layer.setFont(font)

    //resize text layer to fit text
    Layers.refreshTextLayer(layer)
  }
}


/**
 * Clears the text layer.
 *
 * @param {MSTextLayer} layer
 */
function clearTextLayer(layer) {

  //get original text
  let originalText = getOriginalText(layer)

  //check if there is original text stored for the layer
  if(originalText) {

    //set original text
    layer.setStringValue(originalText)

    //refresh and resize
    Layers.refreshTextLayer(layer)
  }

  //clear any data populator metadata
  removeLayerMetadata(layer)
}


/**
 * Gets the original text with placeholders for the layer.
 *
 * @param {MSTextLayer/MSArtboardGroup} layer
 * @returns {string}
 */
function getOriginalText(layer, ignoreMetadata) {

  //get data dictionary
  let dataDict = getDataDictionary(layer)

  //get text stored in layer metadata
  //LEGACY: check old 'textWithPlaceholders' key
  let text = dataDict.valueForKey('textWithPlaceholders')
  if(!text) text = dataDict.valueForKey('originalText')

  //set original text if it doesn't exist
  if (ignoreMetadata || !text || !text.length) {

    //get text from text layer
    if (Layers.isLayerText(layer)) {
      text = String(layer.stringValue())
    }

    //get name of artboard
    else if (Layers.isArtboard(layer)) {
      text = String(layer.name())
    }
  }

  return text
}


/**
 * Sets the original text as metadata on the layer.
 *
 * @param {MSLayer} layer
 * @param {string} text
 */
function setOriginalText(layer, text) {

  //get data dictionary
  let dataDict = getDataDictionary(layer)

  //save new text as the original text in metadata
  dataDict.setValue_forKey(text, 'originalText')

  //LEGACY: remove any old values stored in the dictionary
  dataDict.removeObjectForKey('textWithPlaceholders')

  //set new data dictionary
  setDataDictionary(layer, dataDict)
}


/**
 * Retrieves the data dictionary from layer's userInfo.
 *
 * @param {MSLayer} layer
 * @returns {NSMutableDictionary}
 */
function getDataDictionary(layer) {

  //get user info
  let userInfo = NSMutableDictionary.dictionaryWithDictionary(layer.userInfo())

  //get plugin data dictionary
  let dataDict = userInfo.valueForKey('com.precious-forever.sketch.datapopulator')

  //LEGACY: get values for old versions of data populator
  if(!dataDict) dataDict = userInfo.valueForKey('com.precious-forever.sketch.datapopulator2')
  if(!dataDict) dataDict = userInfo.valueForKey('com.precious-forever.sketch.datapopulatorBETA')

  //get mutable dictionary from dictionary
  dataDict = NSMutableDictionary.dictionaryWithDictionary(dataDict)

  return dataDict
}


/**
 * Sets a new data dictionary in userInfo of the layer.
 *
 * @param {MSLayer} layer
 * @param {NSMutableDictionary} dataDict
 */
function setDataDictionary(layer, dataDict) {

  //get user info
  let userInfo = NSMutableDictionary.dictionaryWithDictionary(layer.userInfo())

  //LEGACY: filter out any data from old data populator versions
  let newUserInfo = NSMutableDictionary.alloc().init()
  let keys = Utils.convertToJSArray(userInfo.allKeys())
  for(let i = 0; i < keys.length; i++) {
    let key = keys[i]
    if(key.indexOf('datapopulator') == -1) {
      newUserInfo.setValue_forKey(userInfo.valueForKey(key), key)
    }
  }
  userInfo = newUserInfo

  //set data dictionary
  userInfo.setValue_forKey(dataDict, 'com.precious-forever.sketch.datapopulator')

  //set new user info
  layer.setUserInfo(userInfo)
}


/**
 * Trims the text to fit in the specified number of lines in the text layer.
 *
 * @param {MSTextLayer} layer
 * @param {string} text
 * @param {boolean} insertEllipsis
 * @param {int} lines
 * @returns {string}
 */
function getTrimmedText(layer, text, insertEllipsis, lines) {

  //trim to one line by default
  if (!lines || lines < 1) lines = 1;

  //create a copy of the layer to prevent changing the actual layer
  layer = Utils.copyLayer(layer);

  //set text to a single character to get height of one line
  layer.setStringValue('-')

  //resize text layer to fit text
  Layers.refreshTextLayer(layer)

  //get original text layer height
  let lineHeight = layer.frame().height()

  //set actual text
  layer.setStringValue(text)

  //resize to fit and get new height
  Layers.refreshTextLayer(layer)
  let actualHeight = layer.frame().height()

  //shorten text to fit
  while (actualHeight > lineHeight * lines) {

    //trim last character
    if (insertEllipsis) {
      text = text.substring(0, text.length - 2) + '…'
    }
    else {
      text = text.substring(0, text.length - 1)
    }

    //set trimmed text and re-evaluate height
    layer.setStringValue(text)
    Layers.refreshTextLayer(layer)
    actualHeight = layer.frame().height()
  }

  return text
}


/**
 * Populates an image layer.
 *
 * @param {MSShapeGroup/MSBitmapLayer} layer
 * @param {Object} data
 * @param {Object} opt
 *
 * opt: {
 *   rootDir: {string},
 *   overrides: {NSMutableDictionary}
 * }
 */
function populateImageLayer(layer, data, opt) {

  //check if layer is in symbol
  let inSymbol = !!opt.overrides

  //extract image placeholder from layer name
  let imagePlaceholder = Placeholders.extractPlaceholders(layer.name())[0]
  if(!imagePlaceholder) return

  //get url by populating the placeholder
  let imageUrl = Placeholders.populatePlaceholder(imagePlaceholder, data, '')

  //get image data
  let imageData
  if (imageUrl) {
    imageData = getImageData(imageUrl, opt.rootDir)
    if (!imageData) {
      return Context().document.showMessage('Some images could not be loaded. Please check the URLs.')
    }
  }

  //get layer fill
  let fill = layer.style().fills().firstObject()
  if (!fill) {

    //create new fill
    fill = layer.style().addStylePartOfType(0)
  }

  //set fill properties
  fill.setFillType(4)
  fill.setPatternFillType(1)

  //set image as an override for image layer within a symbol
  if (inSymbol) {

    //get id of image layer
    let layerId = layer.objectID()

    //add override for layer
    if (imageData) {
      opt.overrides.setValue_forKey(imageData, layerId)
    }
    else {
      opt.overrides.setValue_forKey(null, layerId)
    }
  }

  //set image for normal image layer
  else {

    //set image as fill
    if (imageData) {

      //enable fill
      fill.setIsEnabled(true)
      fill.setImage(imageData)
    }
    else {

      //disable fill and remove image
      fill.setIsEnabled(false)
      fill.setImage(null)
    }
  }
}


/**
 * Clears the image layer.
 *
 * @param {MSShapeGroup/MSBitmapLayer} layer
 */
function clearImageLayer(layer) {

  //TODO: how should images be cleared?

  //remove metadata
  removeLayerMetadata(layer)
}


/**
 * Gets image data from image url. Image can be remote or local.
 *
 * @param {string} imageUrl
 * @param {string} rootDir
 * @returns {MSImageData}
 */
function getImageData(imageUrl, rootDir) {

  //check if url is local or remote
  let image
  if (/(http)[s]?:\/\//g.test(imageUrl)) {

    //download image from url
    image = Data.getImageFromRemoteURL(imageUrl)
  }
  else {

    //remove first slash
    if (imageUrl[0] == '/') imageUrl = imageUrl.substring(1)

    //build full image url by adding the root dir
    imageUrl = NSString.stringWithString(rootDir).stringByAppendingPathComponent(imageUrl)

    //load image from filesystem
    image = Data.getImageFromLocalURL(imageUrl)
  }

  //create image data from NSImage
  return Data.getImageData(image)
}


/**
 * Populates an artboard name.
 *
 * @param {MSArtboard} layer
 * @param {Object} data
 * @param {Object} opt
 *
 * opt: {
 *   defaultSubstitute {string}
 * }
 */
function populateArtboard(layer, data, opt) {

  //get original text
  let originalText = getOriginalText(layer)

  //set original text
  setOriginalText(layer, originalText)

  //extract placeholders from original artboard name
  let placeholders = Placeholders.extractPlaceholders(originalText)

  //create populated string, starting with the original text and gradually replacing placeholders
  let populatedString = originalText
  placeholders.forEach((placeholder) => {

    //populate placeholder found in the original text
    let populatedPlaceholder = Placeholders.populatePlaceholder(placeholder, data, opt.defaultSubstitute)

    //replace original placeholder string (e.g. {firstName}) with populated placeholder string
    populatedString = populatedString.replace(placeholder.string, populatedPlaceholder)
  })

  //set artboard name
  layer.setName(populatedString)
}


/**
 * Clears the artboard layer.
 *
 * @param {MSArtboardGroup} layer
 */
function clearArtboard(layer) {

  //get original text
  let originalText = getOriginalText(layer)

  //check if there is original text stored for the layer
  if(originalText) {

    //set artboard name
    layer.setName(originalText)
  }

  //clear any data populator metadata
  removeLayerMetadata(layer)
}