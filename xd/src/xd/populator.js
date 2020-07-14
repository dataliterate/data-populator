/**
 * Populator
 *
 * Provides functionality to populate layers.
 */

import * as Core from '@data-populator/core'
import log from '@data-populator/core/log'
import * as Data from './data'
import * as Gui from './gui'
import * as Storage from './storage'
import Options, * as OPTIONS from './options'
import Strings, * as STRINGS from '@data-populator/core/strings'
import Context from './context'
import * as Actions from './actions'

const { Artboard, Group, RepeatGrid, Text, Rectangle, ImageFill } = require('scenegraph')
const commands = require('commands')

let fullDataSet
let populatedAtLeastOneLayer
export async function populateLayers(layers, data, opt) {
  fullDataSet = data
  populatedAtLeastOneLayer = false

  // track used data rows
  let usedRows = []

  // track populated layers
  let populatedLayers = []

  await Storage.load()

  // populate each root layer
  for (let i = 0; i < layers.length; i++) {
    let layer = layers[i]
    let dataRow = Core.populator.selectDataRow(data, usedRows, opt.randomizeData)
    populatedLayers.push(await populateLayer(layer, dataRow, opt))
  }

  await Storage.save()

  // restore selection to populated layers
  Context().selection.items = populatedLayers

  if (!populatedAtLeastOneLayer) {
    await Gui.createAlert(Strings(STRINGS.POPULATING_FAILED), Strings(STRINGS.NO_MATCHING_KEYS))
    await clearLayers(populatedLayers)
  }
}

export async function populateLayer(layer, data, opt) {
  if (layer instanceof Artboard) {
    await populateArtboardLayer(layer, data, opt)
    Actions.performActions(layer, data)
  }

  let structure = degroup(layer)

  for (let i = 0; i < Context().selection.items.length; i++) {
    let ungroupedLayer = Context().selection.items[i]

    if (ungroupedLayer instanceof RepeatGrid) {
      await populateRepeatGridLayer(ungroupedLayer, data, opt)
    }
    if (ungroupedLayer instanceof Text) {
      await populateTextLayer(ungroupedLayer, data, opt)
    }
    if (ungroupedLayer instanceof Rectangle) {
      await populateRectangleLayer(ungroupedLayer, data, opt)
    }

    Actions.performActions(ungroupedLayer, data)
  }

  regroup(structure)

  return structure.layer
}

async function populateArtboardLayer(layer, data, opt) {
  let populatedString
  let originalLayerData = Storage.get(layer.guid)
  if (originalLayerData) {
    populatedString = originalLayerData.name
  } else {
    populatedString = layer.name

    Storage.set(layer.guid, {
      name: layer.name
    })
  }

  let placeholders = Core.placeholders.extractPlaceholders(populatedString)
  placeholders.forEach(placeholder => {
    // populate placeholder found in the original text
    let populatedPlaceholder = Core.placeholders.populatePlaceholder(
      placeholder,
      data,
      opt.defaultSubstitute,
      true
    ).populated
    if (
      Core.placeholders.populatePlaceholder(placeholder, data, opt.defaultSubstitute, true)
        .hasValueForKey
    )
      populatedAtLeastOneLayer = true

    // replace original placeholder string (e.g. {firstName}) with populated placeholder string
    populatedString = populatedString.replace(placeholder.string, populatedPlaceholder)
  })

  if (!populatedString.length) populatedString = ' '

  // set new name
  layer.name = populatedString
}

async function populateRepeatGridLayer(layer, data, opt) {
  let dataSeries = {}
  let usedRows = []
  let dataRows = []

  let numberOfDataRows = Math.min(layer.children.length, fullDataSet.length)
  for (let i = 0; i < numberOfDataRows; i++) {
    dataRows.push(Core.populator.selectDataRow(fullDataSet, usedRows, opt.randomizeData))
  }

  await Promise.all(
    layer.children.at(0).children.map(async childLayer => {
      if (childLayer instanceof Text) {
        if (!dataSeries[childLayer.guid]) dataSeries[childLayer.guid] = []

        for (let i = 0; i < dataRows.length; i++) {
          let populatedString
          let originalLayerData = Storage.get(childLayer.guid)
          if (originalLayerData) {
            if (childLayer.name === originalLayerData.text) {
              populatedString = originalLayerData.text
            } else {
              let p = Core.placeholders.extractPlaceholders(childLayer.name)
              if (p.length) {
                populatedString = childLayer.name
              } else {
                populatedString = originalLayerData.text
              }
            }
          } else {
            if (childLayer.name === childLayer.text) {
              populatedString = childLayer.text
            } else {
              let p = Core.placeholders.extractPlaceholders(childLayer.name)
              if (p.length) {
                populatedString = childLayer.name
              } else {
                populatedString = childLayer.text
              }
            }

            Storage.set(childLayer.guid, {
              text: childLayer.text
            })
          }

          let placeholders = Core.placeholders.extractPlaceholders(populatedString)
          placeholders.forEach(placeholder => {
            let populatedPlaceholder = Core.placeholders.populatePlaceholder(
              placeholder,
              dataRows[i],
              opt.defaultSubstitute,
              true
            ).populated
            if (
              Core.placeholders.populatePlaceholder(
                placeholder,
                dataRows[i],
                opt.defaultSubstitute,
                true
              ).hasValueForKey
            )
              populatedAtLeastOneLayer = true

            populatedString = populatedString.replace(placeholder.string, populatedPlaceholder)
          })

          if (!populatedString.length) populatedString = ' '

          dataSeries[childLayer.guid].push(populatedString)

          if (i === dataRows.length - 1)
            layer.attachTextDataSeries(childLayer, dataSeries[childLayer.guid])
        }
      }

      if (childLayer instanceof Rectangle) {
        if (!dataSeries[childLayer.guid]) dataSeries[childLayer.guid] = []

        // extract image placeholder from layer name
        let imagePlaceholder = Core.placeholders.extractPlaceholders(childLayer.name)[0]
        if (!imagePlaceholder) return

        if (
          Core.placeholders.populatePlaceholder(
            imagePlaceholder,
            dataRows[0],
            opt.defaultSubstitute,
            true
          ).hasValueForKey
        ) {
          populatedAtLeastOneLayer = true
        } else {
          return
        }

        let images = await Promise.all(
          dataRows.map(async dataRow => {
            // get url by populating the placeholder
            let imageUrl = Core.placeholders.populatePlaceholder(
              imagePlaceholder,
              dataRow,
              opt.defaultSubstitute,
              true
            ).populated
            imageUrl = imageUrl.replace(/\s/g, '%20')

            //= ================================================
            // get image base64
            if (imageUrl.startsWith('http')) {
              let response
              try {
                response = await global.fetch(imageUrl)
              } catch (e) {
                console.log(e)
              }

              if (response) {
                const buffer = await response.arrayBuffer()
                let base64Flag = 'data:image/jpeg;base64,'
                let imageStr = base64ArrayBuffer(buffer)

                return Promise.resolve(base64Flag + imageStr)
              } else {
                return Promise.resolve(getRectanglePlaceholderBase64(childLayer))
              }
            } else {
              return Promise.resolve(await getLocalImageBase64(childLayer, imageUrl))
            }
          })
        )

        //= ================================================

        images.forEach(image => {
          const imageFill = new ImageFill(image)
          dataSeries[childLayer.guid].push(imageFill)
        })

        if (dataSeries[childLayer.guid].length) {
          await layer.attachImageDataSeries(childLayer, dataSeries[childLayer.guid])
        }
      }
    })
  )
}

async function populateTextLayer(layer, data, opt) {
  let populatedString
  let originalLayerData = Storage.get(layer.guid)
  if (originalLayerData) {
    if (layer.name === originalLayerData.text) {
      populatedString = originalLayerData.text
    } else {
      let p = Core.placeholders.extractPlaceholders(layer.name)
      if (p.length) {
        populatedString = layer.name
      } else {
        populatedString = originalLayerData.text
      }
    }
  } else {
    if (layer.name === layer.text) {
      populatedString = layer.text
    } else {
      let p = Core.placeholders.extractPlaceholders(layer.name)
      if (p.length) {
        populatedString = layer.name
      } else {
        populatedString = layer.text
      }
    }

    Storage.set(layer.guid, {
      text: layer.text
    })
  }

  let placeholders = Core.placeholders.extractPlaceholders(populatedString)
  placeholders.forEach(placeholder => {
    // populate placeholder found in the original text
    let populatedPlaceholder = Core.placeholders.populatePlaceholder(
      placeholder,
      data,
      opt.defaultSubstitute,
      true
    ).populated
    if (
      Core.placeholders.populatePlaceholder(placeholder, data, opt.defaultSubstitute, true)
        .hasValueForKey
    )
      populatedAtLeastOneLayer = true

    // replace original placeholder string (e.g. {firstName}) with populated placeholder string
    populatedString = populatedString.replace(placeholder.string, populatedPlaceholder)
  })

  if (!populatedString.length) populatedString = ' '

  // set new text
  layer.text = populatedString

  // trim text
  if (layer.areaBox && layer.clippedByArea && populatedString.length > 1) {
    if (opt.trimText) trimText(layer, opt.insertEllipsis)
  }
}

function trimText(layer, insertEllipsis) {
  let text = layer.text

  let tooShort = false
  while (layer.clippedByArea && !tooShort) {
    text = text.substring(0, text.length - 1)

    if (insertEllipsis) {
      layer.text = text + '…'
    } else {
      if (text.length > 0) {
        layer.text = text
      } else {
        tooShort = true
        layer.text = ' '
      }
    }
  }
}

async function populateRectangleLayer(layer, data, opt) {
  // extract image placeholder from layer name
  let imagePlaceholder = Core.placeholders.extractPlaceholders(layer.name)[0]
  if (!imagePlaceholder) return

  // get url by populating the placeholder
  let imageUrl = Core.placeholders.populatePlaceholder(
    imagePlaceholder,
    data,
    opt.defaultSubstitute,
    true
  ).populated
  if (
    Core.placeholders.populatePlaceholder(imagePlaceholder, data, opt.defaultSubstitute, true)
      .hasValueForKey
  ) {
    populatedAtLeastOneLayer = true
  } else {
    return
  }

  imageUrl = imageUrl.replace(/\s/g, '%20')

  // get image base64
  let imageBase64 = null
  if (imageUrl.startsWith('http')) {
    // get image from url
    imageBase64 = await new Promise(resolve => {
      let xhr = new XMLHttpRequest()
      xhr.open('GET', imageUrl, true)
      xhr.responseType = 'arraybuffer'
      xhr.onload = function (e) {
        let prefix =
          imageUrl.indexOf('jpg') > -1 ? 'data:image/jpeg;base64,' : 'data:image/png;base64,'

        resolve(prefix + base64ArrayBuffer(xhr.response))
      }
      xhr.onerror = function (e) {
        resolve(getRectanglePlaceholderBase64(layer))
      }
      xhr.send()
    })
  } else {
    imageBase64 = await getLocalImageBase64(layer, imageUrl)
  }

  // set fill
  const imageFill = new ImageFill(imageBase64)
  layer.fill = imageFill
}

function getRectanglePlaceholderBase64(layer) {
  let largePlaceholderImageBase64 =
    'data:image/png;base64,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'
  let mediumPlaceholderImageBase64 =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUAAAAFABAMAAAA/vriZAAAAD1BMVEUAAACsrKz///////////932ND6AAAABHRSTlNAgfz9s3VvAAAABApJREFUeF7t3d1JLEEQgNEyg0EjWJgEBCNYO/+YROblC+E8lHClf6pAzkVdZ7ur5rwG/vg8c97XsB8f95k7hCDg+//fBQO+nk8u4PV8hgEfRxkwhCBgBiZgRiRghiZgxyRgJyZgZyRgpyZg5yRgF0zArpCAXTIBu0YCdtEE7CoJ2GUTsOskYDdMwO6QgN0yAbtHAnbTBOwuCdhtE7D7JGADTMBGkIANMQEbQwI2yARsFAnYMBOwcSRgA03ARpKADTUBG0sCNtgEbDQJ2HATsPEkYBNMwGaQgE0xAZtDAjbJBGwWCdg0E7B5JGATTcBmkoBNNQGbSwI22QRsNgnYdBOw+SRgCU3AEpKAJTQBS0gCltAELCEJWEITsIQkYAlNwBKSgCU0AUtIApbQBCwhCVhCE7CEJGAJTcASkoAlNAFLSAKW0AQsIQlYQhOwhCRgCU3AEpKAJTQBS0gCltAELCEJWEITsIQkYAlNwBKSgCU0AUtIApbQBCwhCVhCE7CEJGAJTcASkoAlNAFLSAKW0AQsIQlYQhOwhCRgCU3AEpKAJTQBS0gCltAELCEJWEITsIQkYAlNwBKSgCU0AUtIApbQBCwhCVhCE7CEJGAJTcASkoAlNAFLSAKW0AQsIQlYQhOwhCRgCU3AEpKAJTQBS0gCltAELCEJWEIZsIQFJAkLKBIWkCQsoEhYQJKwgCJhAUnCApqEATQJA4gSBtAkDCBKGECTMIAk4e9PAElCGnDm65zv2S8Q+C8Wv0n2x0x/UO+vOuDFAvRyy3/Bui/5CxjC/bMT+MMdefSxD48KWMJ9gAk8AkYeou/bEAUsIQpYwn0zEXg7FnhDGzgSsIcqgGMpwMEe4GjUHi4DjucBBxyBI6J7yBY4pgwc9AaOyu9lA+C6BnDhBbgypFy62mtrwMU/4OokcPl0r+8CF6CBK+TAJXy1jMEWggBKaQDFSIByLnJBnC0pBBRlAspauYXB/NJqfnE6v7yfXyDRLzHpF+n0y5z6hWL9Urt+sWK/3LNfMNsvOe4XbffL3vuNA/zWC37zCr/9h99AxW9B4zfx8dsg+Y2k/FZcfjMzvx2c31DPb0noN3X022L6jUX91qx+c1u/PbDfYNlvUe03+fbbpPuN5v1W/U0VCZtJEjZRJGweSdg0kbBZJGGTRMLmkIRNEQmbQRI2QSRsPEnYcJGw0SRhg0XCxpKEDRUJG0kSNlAkbBxJ2DCRsFEkYYNEwsaQhA0RCRtBEjZAJOw+SdhtkbC7JGE3RcLukYTdEgm7QxJ2QyTsOknYZZGwqyRhF0XCrpGEXRIJu0ISdkEk7Jwk7FQk7Iwk7EQk7Jgk7FAk7MgkzMAkDCBKGECTMIAoYQBRwgCShBNAknACSBL+ASIPe+hC7q/+AAAAAElFTkSuQmCC'
  let smallPlaceholderImageBase64 =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHgAAAB4CAMAAAAOusbgAAAADFBMVEUAAADd3d0EBAT///9mYMUjAAAAA3RSTlNAtUBlglJzAAABCUlEQVR42u3ZMQ6DMBQFQYPvf+eUW9FOmpfW3xopIYC1597nPfjzPveemyzde55k6T7nxXJgsnWtHGblKCsHWTnGyiFWjpBywOeCdlvSbovabVm7DWi3Ee02pN3GtNugdhvVbsPabVy7bdBuW7TbJu22TbttVO73Vr9Zu/hn8hem/yv6m4+/3foHDJDBwxy+vgBXvCj6V2N/GPDHH3/g80dcf6gHsnMDtBuh3RDtxmg3SLtR2g3Tbpx2k3OxnIvlXC3n/h/2X7W/uLz7rkuuS65LrkuuS65LrkuuS65LrkuuS65LrkuuS65LrkuuS65LrkuuS65LrkuuS65Lrkt+yblWPrlWPrlW/gFdow25OuXCMgAAAABJRU5ErkJggg=='

  let maxDimension = Math.max(layer.width, layer.height)
  if (maxDimension <= 220) {
    return smallPlaceholderImageBase64
  } else if (maxDimension <= 416) {
    return mediumPlaceholderImageBase64
  } else {
    return largePlaceholderImageBase64
  }
}

async function getLocalImageBase64(layer, imageUrl) {
  // get last used path
  let lastUsedPath
  try {
    let activeConfigurationPreset = await Data.loadFileInDataFolder(
      'activeConfigurationPreset.json'
    )
    if (activeConfigurationPreset.path) {
      lastUsedPath = activeConfigurationPreset.path
    } else {
      lastUsedPath = null
    }
  } catch (e) {
    lastUsedPath = null
    log(e)
  }

  // get image path relative to preset dir
  let presetPath = lastUsedPath
  if (!presetPath) return

  let presetFolderComponents = presetPath.split('/')
  presetFolderComponents.pop()
  let imagePath = `${presetFolderComponents.join('/')}/${imageUrl}`

  // load local data
  let imageData
  try {
    imageData = await Data.loadFileWithPathInDataFolder(imagePath, true)
  } catch (e) {
    console.log(e)
  }

  if (imageData) {
    let prefix =
      imageUrl.indexOf('jpg') > -1 || imageUrl.indexOf('jpeg') > -1
        ? 'data:image/jpeg;base64,'
        : 'data:image/png;base64,'
    return prefix + base64ArrayBuffer(imageData)
  } else {
    return getRectanglePlaceholderBase64(layer)
  }
}

function base64ArrayBuffer(arrayBuffer) {
  let base64 = ''
  let encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  let bytes = new Uint8Array(arrayBuffer)
  let byteLength = bytes.byteLength
  let byteRemainder = byteLength % 3
  let mainLength = byteLength - byteRemainder
  let a, b, c, d
  let chunk
  // Main loop deals with bytes in chunks of 3
  for (let i = 0; i < mainLength; i = i + 3) {
    // Combine the three bytes into a single integer
    chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2]
    // Use bitmasks to extract 6-bit segments from the triplet
    a = (chunk & 16515072) >> 18 // 16515072 = (2^6 - 1) << 18
    b = (chunk & 258048) >> 12 // 258048   = (2^6 - 1) << 12
    c = (chunk & 4032) >> 6 // 4032     = (2^6 - 1) << 6
    d = chunk & 63 // 63       = 2^6 - 1
    // Convert the raw binary segments to the appropriate ASCII encoding
    base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d]
  }
  // Deal with the remaining bytes and padding
  if (byteRemainder === 1) {
    chunk = bytes[mainLength]
    a = (chunk & 252) >> 2 // 252 = (2^6 - 1) << 2
    // Set the 4 least significant bits to zero
    b = (chunk & 3) << 4 // 3   = 2^2 - 1
    base64 += encodings[a] + encodings[b] + '=='
  } else if (byteRemainder === 2) {
    chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1]
    a = (chunk & 64512) >> 10 // 64512 = (2^6 - 1) << 10
    b = (chunk & 1008) >> 4 // 1008  = (2^6 - 1) << 4
    // Set the 2 least significant bits to zero
    c = (chunk & 15) << 2 // 15    = 2^4 - 1
    base64 += encodings[a] + encodings[b] + encodings[c] + '='
  }
  return base64
}

export async function clearLayers(layers) {
  await Storage.load()

  // track cleared layers
  let clearedLayers = []

  // clear each root layer
  for (let i = 0; i < layers.length; i++) {
    let layer = layers[i]
    clearedLayers.push(await clearLayer(layer))
  }

  await Storage.save()

  // restore selection to cleared layers
  Context().selection.items = clearedLayers
}

export async function clearLayer(layer) {
  if (layer instanceof Artboard) {
    await clearArtboardLayer(layer)
  }

  let structure = degroup(layer)

  for (let i = 0; i < Context().selection.items.length; i++) {
    let ungroupedLayer = Context().selection.items[i]

    if (ungroupedLayer instanceof RepeatGrid) {
      await clearRepeatGridLayer(ungroupedLayer)
    }
    if (ungroupedLayer instanceof Text) {
      await clearTextLayer(ungroupedLayer)
    }
    if (ungroupedLayer instanceof Rectangle) {
      await clearRectangleLayer(ungroupedLayer)
    }
  }

  regroup(structure)

  return structure.layer
}

async function clearArtboardLayer(layer) {
  let originalLayerData = Storage.get(layer.guid)
  if (!originalLayerData) return

  Storage.set(layer.guid, null)

  // set original name
  layer.name = originalLayerData.name
}

async function clearRepeatGridLayer(layer) {
  layer.children.at(0).children.forEach(childLayer => {
    if (childLayer instanceof Text) {
      let originalLayerData = Storage.get(childLayer.guid)
      if (!originalLayerData) return

      Storage.set(childLayer.guid, null)

      layer.attachTextDataSeries(childLayer, [originalLayerData.text])
    }
    if (childLayer instanceof Rectangle) {
      let imagePlaceholder = Core.placeholders.extractPlaceholders(childLayer.name)[0]
      if (!imagePlaceholder) return

      // const colorFill = new Color('#ffffff', 0)
      let imageFill = new ImageFill(getRectanglePlaceholderBase64(childLayer))
      layer.attachImageDataSeries(childLayer, [imageFill])
    }
  })
}

async function clearTextLayer(layer) {
  let originalLayerData = Storage.get(layer.guid)
  if (!originalLayerData) return

  Storage.set(layer.guid, null)

  // set original text
  layer.text = originalLayerData.text
}

async function clearRectangleLayer(layer) {
  let imagePlaceholder = Core.placeholders.extractPlaceholders(layer.name)[0]
  if (!imagePlaceholder) return

  let imageFill = new ImageFill(getRectanglePlaceholderBase64(layer))
  layer.fill = imageFill
}

function degroup(layer, nestedCall, parentStructure) {
  parentStructure = parentStructure || {}

  let structure = {
    name: layer.name,
    type: layer.constructor.name,
    guid: layer.guid,
    mask: !!layer.mask,
    layer: layer
  }

  if (layer instanceof Artboard || layer instanceof Group) {
    Context().selection.items = [layer]

    let children = []
    layer.children.forEach(childLayer => {
      children.push(childLayer)
    })

    commands.ungroup()

    structure.children = []
    children.reverse().forEach(childLayer => {
      structure.children.push(degroup(childLayer, true, structure))
    })
  }

  Context().selection.items = []

  if (!nestedCall) selectUngroupedLayers(structure)

  return structure
}

function selectUngroupedLayers(structure) {
  if (structure.children) {
    structure.children.forEach(child => {
      selectUngroupedLayers(child)
    })
  } else if (structure.layer) {
    if (Context().selection.items.indexOf(structure.layer) === -1) {
      Context().selection.items = [structure.layer].concat(Context().selection.items)
    }
  }
}

function regroup(structure) {
  let hasGroups = structure.children && structure.children.filter(child => !!child.children).length

  if (hasGroups) {
    let childGroups = []
    structure.children.forEach(child => {
      regroup(child)
      childGroups.push(child.layer)
    })

    if (structure.type === 'Group') {
      Context().selection.items = childGroups

      if (structure.mask) {
        commands.createMaskGroup()
      } else {
        commands.group()
      }

      structure.layer = Context().selection.items[0]
      structure.layer.name = structure.name
    } else if (structure.type === 'Artboard') {
      structure.layer.name = structure.name
    }
  } else {
    if (structure.children && structure.children.length) {
      Context().selection.items = []
      structure.children.forEach(child => {
        child.layer.name = child.name

        Context().selection.items = [child.layer].concat(Context().selection.items)
      })

      if (structure.mask) {
        commands.createMaskGroup()
      } else {
        commands.group()
      }

      structure.layer = Context().selection.items[0]
      structure.layer.name = structure.name
    } else if (structure.layer) {
      Context().selection.items = [structure.layer]
      structure.layer.name = structure.name
    }
  }
}
