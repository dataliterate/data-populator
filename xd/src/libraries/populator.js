/**
 * Populator
 *
 * Provides functionality to populate layers.
 */

import scenegraph, { ImageFill } from 'scenegraph'
import * as coreLibs from '@data-populator/core'
import * as dataSourcesLib from './dataSources'
import * as fileSystemLib from './fileSystem'
import * as layersLib from './layers'

//
// Populating layers
//

export async function populateLayers(layers) {
  // Keep memory while populating all layers
  const memory = {}

  // Clear all cached data to populate with fresh data
  dataSourcesLib.removeCachedData()

  let populatedLayers = []
  for (let layer of layers) {
    populatedLayers = populatedLayers.concat(await populateLayer(layer, memory))
  }

  return populatedLayers
}

export async function populateLayer(layer, memory = {}, repeatGridSeries) {
  // Get data
  const data = await getDataForLayer(layer, memory)

  // Get layer type based on constructor
  const layerType = layer.constructor.name

  // Collect all layers that were successfully populated
  let populatedLayers = []

  // Layers with children
  if (['Artboard', 'Group'].includes(layerType)) {
    if (layerType === 'Artboard') {
      if (await populateArtboardLayer(layer, data)) populatedLayers.push(layer)
    }

    // Get child layers and reverse them
    // XD orders children from bottom to top but we need top to bottom
    const children = layer.children.map(l => l).reverse()

    // Recursively populate children
    for (let childLayer of children) {
      populatedLayers = populatedLayers.concat(
        await populateLayer(childLayer, memory, repeatGridSeries)
      )
    }
  }

  // Repeat grid
  else if (['RepeatGrid'].includes(layerType)) {
    // Nested repeat grids cannot be populated due to edit context restrictions
    if (repeatGridSeries) return populatedLayers

    // Collect populated data as data series to apply to the repeat grid
    const dataSeries = layersLib.getLayerData(layer, 'originalSeries') || {}

    // Get child layers - the layers of the first child of the repeat grid
    const modelChild = layer.children.at(0)
    const children = modelChild.children.map(l => l).reverse()

    // Recursively populate repeat grid children
    // Loop over as many times as there are copies of the model child in the repeat grid
    for (let i = 0; i < layer.children.length; i++) {
      for (let childLayer of children) {
        populatedLayers = populatedLayers.concat(
          await populateLayer(childLayer, memory, dataSeries)
        )
      }

      // Modify memory after each iteration to give each repeat grid child separate data
      // Otherwise, the same data would be used because of the memory
      Object.keys(memory).forEach(ancestorGuid => {
        Object.keys(memory[ancestorGuid]).forEach(nextAncestorGuid => {
          if (layer.guid === nextAncestorGuid) {
            memory[ancestorGuid][`${nextAncestorGuid}-${i}`] =
              memory[ancestorGuid][nextAncestorGuid]
            delete memory[ancestorGuid][nextAncestorGuid]
          }
        })

        if (layer.guid === ancestorGuid) {
          Object.keys(memory[ancestorGuid]).forEach(childGuid => {
            memory[ancestorGuid][`${childGuid}-${i}`] = memory[ancestorGuid][childGuid]
            delete memory[ancestorGuid][childGuid]
          })
        }
      })
    }

    // Assign data series
    Object.keys(dataSeries).forEach(layerGuid => {
      const layerSeries = dataSeries[layerGuid]
      if (layerSeries.textData) layer.attachTextDataSeries(layerSeries.layer, layerSeries.textData)
      if (layerSeries.imageData)
        layer.attachImageDataSeries(layerSeries.layer, layerSeries.imageData)
    })

    // Store original data series on the repeat grid
    const originalDataSeries = {}
    Object.keys(dataSeries).forEach(layerGuid => {
      const layerSeries = dataSeries[layerGuid]

      if (layerSeries.originalTextData) {
        originalDataSeries[layerGuid] = {
          originalTextData: layerSeries.originalTextData
        }
      }
    })

    layersLib.setLayerData(layer, 'originalSeries', originalDataSeries)
  }

  // Text
  else if (['Text'].includes(layerType)) {
    if (await populateTextLayer(layer, data, repeatGridSeries)) populatedLayers.push(layer)
  }

  // Shape
  else if (['Rectangle', 'Ellipse', 'Polygon', 'Path', 'BooleanGroup'].includes(layerType)) {
    if (await populateShapeLayer(layer, data, repeatGridSeries)) populatedLayers.push(layer)
  }

  return populatedLayers
}

async function populateArtboardLayer(layer, data) {
  const populateOptions = getPopulateOptions(layer)
  if (!populateOptions) return

  // Set original name if no name template
  if (!populateOptions.nameTemplate?.length) {
    const originalContent = getOriginalContent(layer)
    if (originalContent) {
      layer.name = originalContent
    }
    return
  }

  let populatedString = getPopulatedString(
    populateOptions.nameTemplate,
    populateOptions.defaultDataFallback,
    data?.data
  )
  if (!populatedString?.length) populatedString = ' '

  // Store original content if layer was not populated yet
  const originalContent = getOriginalContent(layer)
  if (!originalContent) {
    setOriginalContent(layer, layer.name)
  }

  // Set populated string
  layer.name = populatedString

  return true
}

async function populateTextLayer(layer, data, repeatGridSeries) {
  const populateOptions = getPopulateOptions(layer)
  if (!populateOptions) return

  let populatedString = getPopulatedString(
    populateOptions.contentTemplate,
    populateOptions.defaultDataFallback,
    data?.data
  )
  if (!populatedString?.length) populatedString = ' '

  // Repeat grid layer
  if (repeatGridSeries) {
    if (!repeatGridSeries[layer.guid]) repeatGridSeries[layer.guid] = {}
    repeatGridSeries[layer.guid].layer = layer
    repeatGridSeries[layer.guid].textData = repeatGridSeries[layer.guid].textData || []
    repeatGridSeries[layer.guid].originalTextData =
      repeatGridSeries[layer.guid].originalTextData || layer.text

    repeatGridSeries[layer.guid].textData.push(populatedString)
  }

  // Real layer
  else {
    const originalContent = getOriginalContent(layer)

    if (!originalContent) {
      setOriginalContent(layer, layer.text)
    }

    // Set populated string
    layer.text = populatedString

    // Trim text
    if (layer.areaBox && layer.clippedByArea && populatedString.length > 1) {
      if (populateOptions.trimOverflowingText) {
        trimText(layer, populateOptions.insertEllipsisAfterTrimmingText)
      }
    }
  }

  return true
}

async function populateShapeLayer(layer, data, repeatGridSeries) {
  const populateOptions = getPopulateOptions(layer)
  if (!populateOptions) return

  // Get image URL
  let imageUrl
  if (populateOptions.imagePath?.length)
    imageUrl =
      coreLibs.utils.accessObjectByString(data?.data, populateOptions.imagePath) ||
      populateOptions.imagePath
  if (!imageUrl) imageUrl = populateOptions.fallbackImageUrl

  // Get data for URL
  let imageBase64 = await getImageBase64(imageUrl, data?.dataSource?.id)
  if (!imageBase64 && populateOptions.fallbackImageUrl) {
    imageUrl = populateOptions.fallbackImageUrl
    imageBase64 = await getImageBase64(imageUrl, data?.dataSource?.id)
  }
  if (!imageBase64) imageBase64 = getPlaceholderImageBase64(layer)

  // Fill shape layer with image fill
  const imageFill = new ImageFill(imageBase64)

  // Repeat grid layer
  if (repeatGridSeries) {
    if (!repeatGridSeries[layer.guid]) repeatGridSeries[layer.guid] = {}
    repeatGridSeries[layer.guid].layer = layer
    repeatGridSeries[layer.guid].imageData = repeatGridSeries[layer.guid].imageData || []

    repeatGridSeries[layer.guid].imageData.push(imageFill)
  }

  // Real layer
  else {
    layer.fill = imageFill
  }

  return true
}

export function getPopulatedString(template, defaultDataFallback, data) {
  let populatedString = template || ''
  const placeholders = coreLibs.placeholders.extractPlaceholders(populatedString)

  // Populate all placeholders found in the template
  placeholders.forEach(placeholder => {
    let populatedPlaceholder = coreLibs.placeholders.populatePlaceholder(
      placeholder,
      data,
      defaultDataFallback
    )

    // Replace original placeholder string (e.g. {firstName}) with populated placeholder string
    populatedString = populatedString.replace(placeholder.string, populatedPlaceholder)
  })

  if (!populatedString.length) populatedString = ''

  return populatedString
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

//
// Clearing layers
//

export async function clearLayers(layers, options) {
  for (let layer of layers) {
    await clearLayer(layer, options)
  }
}

export async function clearLayer(layer, options, repeatGridOriginalSeries) {
  // Get layer type based on constructor
  const layerType = layer.constructor.name

  // Layers with children
  if (['Artboard', 'Group'].includes(layerType)) {
    if (layerType === 'Artboard') {
      if (options.clearPopulatedData) await clearArtboardLayer(layer)
    }

    // Get child layers and reverse them
    if (options.applyToChildren) {
      const children = layer.children.map(l => l).reverse()

      // Recursively clear children
      for (let childLayer of children) {
        await clearLayer(childLayer, options)
      }
    }
  }

  // Repeat grid
  else if (['RepeatGrid'].includes(layerType)) {
    // Nested repeat grids cannot be cleared due to edit context restrictions
    if (repeatGridOriginalSeries) return

    // Get child layers
    const children = layer.children.at(0).children.map(l => l)

    const originalDataSeries = layersLib.getLayerData(layer, 'originalSeries') || {}

    // Recursively clear repeat grid children
    for (let childLayer of children) {
      await clearLayer(childLayer, options, originalDataSeries)
    }

    // Assign original data series
    if (options.clearPopulatedData) {
      Object.keys(originalDataSeries).forEach(layerGuid => {
        const layerSeries = originalDataSeries[layerGuid]
        if (layerSeries.textData)
          layer.attachTextDataSeries(layerSeries.layer, layerSeries.textData)
        if (layerSeries.imageData)
          layer.attachImageDataSeries(layerSeries.layer, layerSeries.imageData)
      })

      layersLib.setLayerData(layer, 'originalSeries', undefined)
    }
  }

  // Text
  else if (['Text'].includes(layerType)) {
    if (options.clearPopulatedData) await clearTextLayer(layer, repeatGridOriginalSeries)
  }

  // Shape
  else if (['Rectangle', 'Ellipse', 'Polygon', 'Path', 'BooleanGroup'].includes(layerType)) {
    if (options.clearPopulatedData) await clearShapeLayer(layer, repeatGridOriginalSeries)
  }

  // Delete settings
  // Skip if child of repeat grid - currently not in edit context
  if (options.clearOptions && !repeatGridOriginalSeries) {
    setPopulateOptions(layer, undefined)
    setDataOptions(layer, undefined)
  }
}

async function clearArtboardLayer(layer) {
  // Restore original name if layer was populated
  const originalContent = getOriginalContent(layer)
  if (originalContent) {
    layer.name = originalContent

    setOriginalContent(layer, undefined)
  }

  return true
}

async function clearTextLayer(layer, repeatGridOriginalSeries) {
  // Set original content for repeat grid series
  if (repeatGridOriginalSeries) {
    if (repeatGridOriginalSeries[layer.guid]) {
      repeatGridOriginalSeries[layer.guid] = {
        layer,
        textData: [repeatGridOriginalSeries[layer.guid].originalTextData]
      }
    }
  } else {
    // Restore original content if layer was populated
    const originalContent = getOriginalContent(layer)
    if (originalContent) {
      layer.text = originalContent

      setOriginalContent(layer, undefined)
    }
  }
}

async function clearShapeLayer(layer, repeatGridOriginalSeries) {
  if (!getPopulateOptions(layer)) return

  const imageBase64 = getPlaceholderImageBase64(layer)
  const imageFill = new ImageFill(imageBase64)

  // Set placeholder image for repeat grid series
  if (repeatGridOriginalSeries) {
    repeatGridOriginalSeries[layer.guid] = {
      layer,
      imageData: [imageFill]
    }
  } else {
    // Fill shape layer with image fill
    layer.fill = imageFill
  }
}

//
// Getting images
//

export async function getImageBase64(url, dataSourceId) {
  if (!url) return

  let response
  let imageData
  if (url.startsWith('http')) {
    try {
      response = await global.fetch(url, {})
      if (response.ok) {
        imageData = await response.arrayBuffer()
      }
    } catch (e) {
      console.log('Failed to get remote image', e)
    }
  } else {
    try {
      imageData = await fileSystemLib.readFile(
        'data',
        `data sources/${dataSourceId}/images/${url}`,
        true
      )
    } catch (e) {
      console.log('Failed to get local image', e)
    }
  }
  if (!imageData) return

  const headerContentType = response?.headers?.get('Content-Type')

  const prefix =
    url.includes('.jpg') ||
    url.includes('.jpeg') ||
    headerContentType?.includes('.jpg') ||
    headerContentType?.includes('.jpeg')
      ? 'data:image/jpeg;base64,'
      : 'data:image/png;base64,'

  const base64 = prefix + coreLibs.utils.arrayBufferToBase64(imageData)

  return base64
}

function getPlaceholderImageBase64(layer, usePlaceholder) {
  // Return placeholder image
  if (usePlaceholder) {
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

  // Return empty/transparent image
  else {
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQMAAAAl21bKAAAAA1BMVEUAAACnej3aAAAAAXRSTlMAQObYZgAAAApJREFUCNdjYAAAAAIAAeIhvDMAAAAASUVORK5CYII='
  }
}

//
// Data access and operations
//

export async function getDataForLayer(layer, memory) {
  const dataOptions = getDataOptions(layer)

  // Layer has its own data source, use it directly
  if (dataOptions?.dataSource) {
    // 1. Get data source
    const dataSource = await dataSourcesLib.getDataSource(dataOptions.dataSource.id)

    // 2. Get data
    let data = await dataSource?.getData({
      variableOverrides: dataOptions?.urlVariableOverrides
    })

    // 3. Apply root path
    data = coreLibs.utils.accessObjectByString(data, dataOptions.rootPath)

    return {
      layerPath: [layer],
      layer,
      dataSource,
      data,
      path: dataOptions.rootPath
    }
  }

  // Consider any available ancestor data source
  else {
    // 1. Get nearest ancestor with data source
    const ancestor = findNearestAncestorWithDataSource(layer)

    // 2. Get all ancestors of this layer up to the ancestor with data source
    const intermediateAncestors = layersLib.getAncestors(layer, ancestor)

    // 3. Create list of all layers in the path from this target layer to the ancestor with data source
    const layerPath = [layer, ...intermediateAncestors, ancestor].reverse()

    // 4. Get data options
    const ancestorDataOptions = getDataOptions(ancestor)

    // 5. Get data source
    const dataSource = await dataSourcesLib.getDataSource(ancestorDataOptions?.dataSource.id)

    // 6. Get data
    let data = await dataSource?.getData({
      variableOverrides: ancestorDataOptions?.urlVariableOverrides
    })

    // 7. Traverse through layer path starting from ancestor all the way to this target layer
    let currentLayer
    let currentLayerIndex
    let currentDataOptions
    let pathSegments = []

    const selectDataRow = () => {
      if (data instanceof Array) {
        // Get memorized data row if one is assigned
        // Check if memory for current layer has a value for the next layer in the layer path
        let memorizedDataRow =
          memory?.[currentLayer.guid]?.[layerPath[currentLayerIndex + 1].guid]?.dataRow

        if (memorizedDataRow) {
          data = data[memorizedDataRow.index]
          pathSegments.push(memorizedDataRow.index)
        }

        // No memorized row so get a new one
        else {
          // Get all selected rows that were memorized by by current layer for any child/next layer in a layer path
          const memorizedDataRows = Object.keys(memory?.[currentLayer.guid] || {})?.map(
            nextLayerId => memory?.[currentLayer.guid]?.[nextLayerId]?.dataRow
          )

          // Use memorized data rows to get a list of used row indexes, ordered by when they were picked
          const usedRowIndexes = memorizedDataRows
            .sort((dataRowA, dataRowB) => dataRowA.order - dataRowB.order)
            .map(dataRow => dataRow.index)

          // Check whether current layer has control over data options
          // Only ancestor with data source or an ancestor with root path can apply data options
          const canApplyDataOptions =
            currentLayerIndex === 0 || currentDataOptions?.rootPath?.length

          // Select next row index
          let selectedIndex = selectRowIndex(
            data,
            usedRowIndexes,

            // Can only shuffle items if also has a root path
            // The parent ancestor already decided whether to shuffle or not
            canApplyDataOptions ? currentDataOptions?.shuffleItems : false
          )

          // Set special index pointing to undefined data if rows should not repeat
          if (canApplyDataOptions) {
            if (!currentDataOptions?.repeatItems && usedRowIndexes.length >= data.length)
              selectedIndex = -1
          }

          if (memory) {
            // Memorize selected data row
            // Ensure memory structure
            if (!memory[currentLayer.guid]) memory[currentLayer.guid] = {}
            if (!memory[currentLayer.guid][layerPath[currentLayerIndex + 1].guid])
              memory[currentLayer.guid][layerPath[currentLayerIndex + 1].guid] = {}

            // Set data row
            memory[currentLayer.guid][layerPath[currentLayerIndex + 1].guid].dataRow = {
              order: usedRowIndexes.length,
              index: selectedIndex
            }
          }

          data = data[selectedIndex]
          pathSegments.push(selectedIndex)
        }
      }
    }

    const applyRootPath = () => {
      if (currentDataOptions?.rootPath?.length) {
        data = coreLibs.utils.accessObjectByString(data, currentDataOptions.rootPath)
        pathSegments.push(currentDataOptions.rootPath)
      }
    }

    for (currentLayerIndex = 0; currentLayerIndex < layerPath.length; currentLayerIndex++) {
      currentLayer = layerPath[currentLayerIndex]
      currentDataOptions = getDataOptions(currentLayer)

      // Current layer is an ancestor
      if (currentLayer !== layer) {
        applyRootPath()
        selectDataRow()
      }

      // Current layer is the target layer
      else {
        applyRootPath()
      }
    }

    return {
      layerPath: layersLib.getLayerPath(ancestor),
      layer: ancestor,
      dataSource,
      data,
      path: pathSegments.join('.')
    }
  }
}

function selectRowIndex(rows, usedIndexes, shuffleItems) {
  if (!rows) return
  if (!usedIndexes) usedIndexes = []

  const indexes = rows.map((_, index) => index)

  // Get last used index
  const lastUsedIndex =
    usedIndexes[usedIndexes.length - 1] !== undefined ? usedIndexes[usedIndexes.length - 1] : -1

  // Random
  if (shuffleItems) {
    // Get used indexes in the current 'loop' of the list of rows
    if (usedIndexes.length >= rows.length) {
      usedIndexes = usedIndexes.slice(Math.floor(usedIndexes.length / rows.length) * rows.length)
    }

    // Get available indexes
    const indexMap = [...indexes]
    usedIndexes.forEach(usedIndex => (indexMap[usedIndex] = undefined))
    let availableIndexes = []
    for (let index of indexMap) {
      if (indexMap[index] !== undefined) availableIndexes.push(index)
    }

    // Remove last chosen index if there's more than one row
    if (rows.length > 1) {
      availableIndexes = availableIndexes.filter(index => index !== lastUsedIndex)
    }

    // Return random selection from available indexes
    return availableIndexes[Math.floor(Math.random() * availableIndexes.length)]
  }

  // Sequential
  else {
    let selectedIndex = lastUsedIndex + 1
    if (selectedIndex > indexes.length - 1) {
      selectedIndex = 0
    }

    return selectedIndex
  }
}

//
// Layer data setters and getters
//

export function getDataOptions(layer) {
  if (!layer) return
  return layersLib.getLayerData(layer, 'dataOptions')
}

export function getDataOption(layer, key) {
  return getDataOptions(layer)?.[key]
}

export function setDataOptions(layer, dataOptions) {
  if (!layer) return
  layersLib.setLayerData(layer, 'dataOptions', dataOptions)
}

export function setDataOption(layer, key, value) {
  setDataOptions(layer, {
    ...(getDataOptions(layer) || {}),
    [key]: value
  })
}

export async function getDataSource(layer) {
  const dataSourceId = getDataOption(layer, 'dataSource')?.id
  return await dataSourcesLib.getDataSource(dataSourceId)
}

export async function setDataSource(layer, dataSourceId) {
  const dataSource = await dataSourcesLib.getDataSource(dataSourceId)
  if (dataSource) {
    setDataOption(layer, 'dataSource', {
      id: dataSource.id,
      name: dataSource.name,
      type: dataSource.type
    })
  } else {
    setDataOption(layer, 'dataSource')
  }
}

export function getPopulateOptions(layer) {
  if (!layer) return
  return layersLib.getLayerData(layer, 'populateOptions')
}

export function getPopulateOption(layer, key) {
  return getPopulateOptions(layer)?.[key]
}

export function setPopulateOptions(layer, populateOptions) {
  if (!layer) return
  layersLib.setLayerData(layer, 'populateOptions', populateOptions)
}

export function setPopulateOption(layer, key, value) {
  setPopulateOptions(layer, {
    ...(getPopulateOptions(layer) || {}),
    [key]: value
  })
}

export function getOriginalContent(layer) {
  if (!layer) return
  return layersLib.getLayerData(layer, 'originalContent')
}

export function setOriginalContent(layer, originalContent) {
  if (!layer) return
  layersLib.setLayerData(layer, 'originalContent', originalContent)
}

//
// Option-based layer lookups
//

export function findNearestAncestorWithDataOptions(layer) {
  return layersLib.findNearestMatchingAncestor(layer, {
    pluginData: {
      dataOptions: true
    }
  })
}

export function findNearestAncestorWithDataSource(layer) {
  return layersLib.findNearestMatchingAncestor(layer, {
    pluginData: {
      dataOptions: {
        dataSource: true
      }
    }
  })
}

export function findAncestorsWithDataOptions(layer) {
  return layersLib.findMatchingAncestors(layer, {
    pluginData: {
      dataOptions: true
    }
  })
}

export function findChildrenWithDataOptions(layer) {
  if (!layer) layer = scenegraph.root

  return layersLib.findMatchingChildren(layer, {
    pluginData: {
      dataOptions: true
    }
  })
}

export function findChildrenWithADataSource(layer) {
  if (!layer) layer = scenegraph.root

  return layersLib.findMatchingChildren(layer, {
    pluginData: {
      dataOptions: {
        dataSource: true
      }
    }
  })
}

export function findChildrenWithDataSource(layer, dataSourceId) {
  if (!layer) layer = scenegraph.root

  return layersLib.findMatchingChildren(layer, {
    pluginData: {
      dataOptions: {
        dataSource: {
          id: dataSourceId
        }
      }
    }
  })
}

export function findChildrenWithPopulateOptions(layer) {
  if (!layer) layer = scenegraph.root

  return layersLib.findMatchingChildren(layer, {
    pluginData: {
      populateOptions: true
    }
  })
}

export function findChildrenWithOptions(layer) {
  if (!layer)
    return {
      any: [],
      withPopulateOptions: [],
      withDataOptions: [],
      withDataSource: [],
      all: []
    }

  // Get combined children for multiple layers
  if (layer[0]) {
    const allChildren = {
      any: {},
      withPopulateOptions: {},
      withDataOptions: {},
      withDataSource: {},
      all: {}
    }

    layer.forEach(_layer => {
      const children = findChildrenWithOptions(_layer)

      children.any.forEach(child => (allChildren.any[child.layer.guid] = child))

      children.withPopulateOptions.forEach(
        child => (allChildren.withPopulateOptions[child.layer.guid] = child)
      )

      children.withDataOptions.forEach(
        child => (allChildren.withDataOptions[child.layer.guid] = child)
      )

      children.withDataSource.forEach(
        child => (allChildren.withDataSource[child.layer.guid] = child)
      )

      children.all.forEach(child => (allChildren.all[child.layer.guid] = child))
    })

    return {
      any: Object.keys(allChildren.any).map(id => allChildren.any[id]),
      withPopulateOptions: Object.keys(allChildren.withPopulateOptions).map(
        id => allChildren.withPopulateOptions[id]
      ),
      withDataOptions: Object.keys(allChildren.withDataOptions).map(
        id => allChildren.withDataOptions[id]
      ),
      withDataSource: Object.keys(allChildren.withDataSource).map(
        id => allChildren.withDataSource[id]
      ),
      all: Object.keys(allChildren.all).map(id => allChildren.all[id])
    }
  }

  const allChildren = {}

  const childrenWithPopulateOptions = {}
  findChildrenWithPopulateOptions(layer).forEach(child => {
    childrenWithPopulateOptions[child.guid] = child
    allChildren[child.guid] = child
  })

  const childrenWithDataOptions = {}
  findChildrenWithDataOptions(layer).forEach(child => {
    childrenWithDataOptions[child.guid] = child
    allChildren[child.guid] = child
  })

  const childrenWithADataSource = {}
  findChildrenWithADataSource(layer).forEach(child => {
    childrenWithADataSource[child.guid] = child
    allChildren[child.guid] = child
  })

  const children = Object.keys(allChildren).map(childId => {
    const child = allChildren[childId]

    return {
      layer: child,
      hasPopulateOptions: !!childrenWithPopulateOptions[childId],
      hasDataOptions: !!childrenWithDataOptions[childId],
      hasDataSource: !!childrenWithADataSource[childId]
    }
  })

  return {
    any: children,
    withPopulateOptions: children.filter(c => c.hasPopulateOptions),
    withDataOptions: children.filter(c => c.hasDataOptions),
    withDataSource: children.filter(c => c.hasDataSource),
    all: children.filter(c => c.hasPopulateOptions && c.hasDataOptions && c.hasDataSource)
  }
}

export function hasOptions(layer) {
  return getPopulateOptions(layer) || getDataOptions(layer)
}
