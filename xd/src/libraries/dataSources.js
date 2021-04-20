import scenegraph from 'scenegraph'
import * as coreLibs from '@data-populator/core'
import * as fileSystemLib from './fileSystem'
import * as populatorLib from './populator'
import * as layersLib from './layers'

let cachedLibraryDataSources
let cachedDocumentDataSources

export function createDataSource(dataSource) {
  return new Promise(async resolve => {
    // Create copy of the data source object and remove origin because it shouldn't be stored
    dataSource = { ...dataSource }
    delete dataSource.origin

    // Create new data source using the supplied config
    dataSource = {
      id: dataSource.id || coreLibs.utils.generateUUID(),
      ...dataSource
    }

    // Return a URL with filled variables
    dataSource.getPopulatedUrl = variableOverrides => {
      if (dataSource.type !== 'remote') return

      // Remove undefined keys
      Object.keys(variableOverrides || {}).forEach(
        key =>
          (variableOverrides[key] === undefined || !variableOverrides[key]?.length) &&
          delete variableOverrides[key]
      )

      // Create object of all variables
      // Process overrides
      // Resolve 'empty' values
      const allVariables = {}
      const emptyValueCharacter = '-'
      for (const [variable, value] of Object.entries(dataSource.variables || {})) {
        allVariables[variable] = value === emptyValueCharacter ? '' : value
      }
      for (const [variable, value] of Object.entries(variableOverrides || {})) {
        allVariables[variable] = value === emptyValueCharacter ? '' : value
      }

      return populatorLib.getPopulatedString(dataSource.url, '', allVariables)
    }

    // Define function to get data
    dataSource.getData = ({ ignoreDataCache, path, variableOverrides } = {}) => {
      return new Promise(async resolveData => {
        // Return local data stored within data source
        if (dataSource.type === 'local') {
          let data = dataSource.data

          // Apply data path if provided
          if (path) {
            data = coreLibs.utils.accessObjectByString(data, path)
          }

          resolveData(data)
        }

        // Load and return data from url
        else if (dataSource.type === 'remote') {
          // Create cache key from variable overrides
          // Overrides are the only thing that could invalidate the existing cache
          const cacheKey = JSON.stringify(variableOverrides || {})

          // Return cached data
          if (!ignoreDataCache && dataSource.cachedData?.[cacheKey]) {
            let data = dataSource.cachedData[cacheKey]
            // Apply data path if provided
            if (path) {
              data = coreLibs.utils.accessObjectByString(data, path)
            }

            return resolveData(data)
          }

          try {
            // Populate url variable placeholders
            const url = dataSource.getPopulatedUrl(variableOverrides)

            const remoteContent = await (
              await global.fetch(url, {
                headers: dataSource.headers
              })
            ).text()

            // Attempt to parse data to check validity
            let data = JSON.parse(remoteContent)

            // Stored cached data
            dataSource.cachedData = {
              ...(dataSource.cacheData || {}),
              [cacheKey]: data
            }

            // Apply data path if provided
            if (path) {
              data = coreLibs.utils.accessObjectByString(data, path)
            }

            resolveData(data)
          } catch (e) {
            resolveData()
          }
        }

        // Return nothing for unsupported data source types
        else {
          resolveData()
        }
      })
    }

    resolve(dataSource)
  })
}

export function getStorableProperties({ id, name, type, data, url, variables, headers }) {
  return {
    id,
    name,
    type,
    data,
    url,
    variables,
    headers
  }
}

export function getDataSources(ignoreCache) {
  return new Promise(async resolve => {
    const libraryDataSources = await getLibraryDataSources(ignoreCache)
    const documentDataSources = await getDocumentDataSources(ignoreCache)

    // Create list of data sources
    // If a data source exists both in document and library, return only document version - it takes precedence
    const dataSources = []
    const addedDataSources = {}

    for (let dataSource of documentDataSources) {
      dataSources.push(dataSource)

      addedDataSources[dataSource.id] = true
    }

    for (let dataSource of libraryDataSources) {
      if (!addedDataSources[dataSource.id]) {
        dataSources.push(dataSource)
      }
    }

    resolve(dataSources)
  })
}

export function loadLibraryDataSources() {
  return new Promise(async resolve => {
    try {
      // Ensure data sources folder
      await fileSystemLib.ensureFolder('data', 'data sources')
      const dataSourcesFolder = await (await fileSystemLib.getDataFolder()).getEntry('data sources')

      // Get folders for all data sources
      const dataSourceFolders = await fileSystemLib.listFolders('data', 'data sources')

      // Prepare object to store all data sources
      const dataSources = []

      // Load all data sources
      for (let dataSourceFolder of dataSourceFolders) {
        try {
          // Create data source from stored json
          const dataSource = await createDataSource(
            JSON.parse(
              await fileSystemLib.readFile(
                'data',
                `data sources/${dataSourceFolder.name}/manifest.json`
              )
            )
          )

          // Set data source origin
          dataSource.origin = 'library'

          // Rename data source file if needed to match data source config
          const expectedFolderName = `${dataSource.id}`
          if (dataSourceFolder.name !== expectedFolderName) {
            await dataSourcesFolder.renameEntry(dataSourceFolder, expectedFolderName)
          }

          dataSources.push(dataSource)
        } catch (e) {}
      }

      resolve(dataSources)
    } catch (e) {
      resolve([])
    }
  })
}

export function loadDocumentDataSources() {
  return new Promise(async resolve => {
    // Get data sources from root node plugin data
    const storedDocumentDataSources = layersLib.getLayerData(scenegraph.root, 'dataSources') || []

    // Create data sources from JSON
    const dataSources = []
    for (let storedDataSource of storedDocumentDataSources) {
      const dataSource = await createDataSource(JSON.parse(storedDataSource))

      // Set data source origin
      dataSource.origin = 'document'

      dataSources.push(dataSource)
    }

    resolve(dataSources)
  })
}

export function getLibraryDataSources(ignoreCache) {
  return new Promise(async resolve => {
    if (!ignoreCache && cachedLibraryDataSources) return resolve(cachedLibraryDataSources)

    const libraryDataSources = await loadLibraryDataSources()

    const documentDataSources = await loadDocumentDataSources()
    let documentDataSourcesById = {}
    for (let documentDataSource of documentDataSources) {
      documentDataSourcesById[documentDataSource.id] = documentDataSource
    }

    // Check against document data sources
    for (let libraryDataSource of libraryDataSources) {
      if (documentDataSourcesById[libraryDataSource.id]) {
        libraryDataSource.inDocument = true

        if (
          !checkEqualityOfDataSources(
            libraryDataSource,
            documentDataSourcesById[libraryDataSource.id]
          )
        ) {
          libraryDataSource.overridden = true
        }
      }
    }

    // Cache data sources to avoid reloading them all every time
    cachedLibraryDataSources = libraryDataSources

    resolve(libraryDataSources)
  })
}

export function getDocumentDataSources(ignoreCache) {
  return new Promise(async resolve => {
    if (!ignoreCache && cachedDocumentDataSources) return resolve(cachedDocumentDataSources)

    const documentDataSources = await loadDocumentDataSources()

    const libraryDataSources = await loadLibraryDataSources()
    let libraryDataSourcesById = {}
    for (let libraryDataSource of libraryDataSources) {
      libraryDataSourcesById[libraryDataSource.id] = libraryDataSource
    }

    // Check against library data sources
    for (let documentDataSource of documentDataSources) {
      if (libraryDataSourcesById[documentDataSource.id]) {
        documentDataSource.inLibrary = true

        if (
          !checkEqualityOfDataSources(
            documentDataSource,
            libraryDataSourcesById[documentDataSource.id]
          )
        ) {
          documentDataSource.outOfSync = true
        }
      }
    }

    // Cache data sources to avoid reloading them all every time
    cachedDocumentDataSources = documentDataSources

    resolve(documentDataSources)
  })
}

export function getDataSource(id, ignoreCache) {
  return new Promise(async resolve => {
    const dataSources = await getDataSources(ignoreCache)

    // Document data source will take precedence over a library data source
    const dataSource = dataSources.find(dataSource => dataSource.id === id)

    resolve(dataSource)
  })
}

export function getLibraryDataSource(id, ignoreCache) {
  return new Promise(async resolve => {
    const dataSources = await getLibraryDataSources(ignoreCache)

    const dataSource = dataSources.find(dataSource => dataSource.id === id)

    resolve(dataSource)
  })
}

export function getDocumentDataSource(id, ignoreCache) {
  return new Promise(async resolve => {
    const dataSources = await getDocumentDataSources(ignoreCache)

    const dataSource = dataSources.find(dataSource => dataSource.id === id)

    resolve(dataSource)
  })
}

export function addLibraryDataSource(dataSource) {
  return new Promise(async resolve => {
    // Create data source from data source config
    dataSource = await createDataSource(dataSource)

    // Store data source
    await fileSystemLib.writeFile(
      'data',
      `data sources/${dataSource.id}/manifest.json`,
      JSON.stringify(getStorableProperties(dataSource))
    )

    removeCachedDataSources()

    const loadedDataSource = await getLibraryDataSource(dataSource.id)

    resolve(loadedDataSource)
  })
}

export function addDocumentDataSource(dataSource) {
  return new Promise(async resolve => {
    // Create data source from data source config
    dataSource = await createDataSource(dataSource)

    // Add new data source and store in document data
    const storedDocumentDataSources = layersLib.getLayerData(scenegraph.root, 'dataSources') || []
    layersLib.setLayerData(scenegraph.root, 'dataSources', [
      ...storedDocumentDataSources,
      JSON.stringify(getStorableProperties(dataSource))
    ])

    removeCachedDataSources()

    const loadedDataSource = await getDocumentDataSource(dataSource.id)

    resolve(loadedDataSource)
  })
}

export function updateLibraryDataSource(id, updatedDataSource) {
  return new Promise(async (resolve, reject) => {
    const existingDataSource = await getLibraryDataSource(id)
    if (!existingDataSource) return reject(new Error('Data source not found'))

    updatedDataSource = await createDataSource({
      ...updatedDataSource,
      id
    })

    // Store data source
    await fileSystemLib.writeFile(
      'data',
      `data sources/${id}/manifest.json`,
      JSON.stringify(getStorableProperties(updatedDataSource))
    )

    removeCachedDataSources()

    const loadedDataSource = await getLibraryDataSource(updatedDataSource.id)

    resolve(loadedDataSource)
  })
}

export function updateDocumentDataSource(id, updatedDataSource) {
  return new Promise(async (resolve, reject) => {
    const existingDataSource = await getDocumentDataSource(id)
    if (!existingDataSource) return reject(new Error('Data source not found'))

    updatedDataSource = await createDataSource({
      ...updatedDataSource,
      id
    })

    // Replace the original data source with the updated one
    const storedDocumentDataSources = layersLib.getLayerData(scenegraph.root, 'dataSources') || []
    const updatedDocumentDataSources = storedDocumentDataSources.map(storedDataSource => {
      const dataSource = JSON.parse(storedDataSource)

      if (dataSource.id === id) return JSON.stringify(getStorableProperties(updatedDataSource))

      return storedDataSource
    })

    layersLib.setLayerData(scenegraph.root, 'dataSources', updatedDocumentDataSources)

    removeCachedDataSources()

    const loadedDataSource = await getDocumentDataSource(updatedDataSource.id)

    resolve(loadedDataSource)
  })
}

export function removeLibraryDataSource(id) {
  return new Promise(async (resolve, reject) => {
    const existingDataSource = await getLibraryDataSource(id)
    if (!existingDataSource) return reject(new Error('Data source not found'))
    if (!existingDataSource.id) return reject(new Error('Data source not found'))

    // Delete data source
    await fileSystemLib.deleteFolder('data', `data sources/${existingDataSource.id}`)

    removeCachedDataSources()

    resolve()
  })
}

export function removeDocumentDataSource(id) {
  return new Promise(async (resolve, reject) => {
    const existingDataSource = await getDocumentDataSource(id)
    if (!existingDataSource) return reject(new Error('Data source not found'))
    if (!existingDataSource.id) return reject(new Error('Data source not found'))

    // Delete data source
    const storedDocumentDataSources = layersLib.getLayerData(scenegraph.root, 'dataSources') || []
    const remainingDocumentDataSources = storedDocumentDataSources.filter(storedDataSource => {
      const dataSource = JSON.parse(storedDataSource)

      return dataSource.id !== id
    })

    layersLib.setLayerData(scenegraph.root, 'dataSources', remainingDocumentDataSources)

    removeCachedDataSources()

    resolve()
  })
}

export function removeCachedDataSources() {
  cachedLibraryDataSources = null
  cachedDocumentDataSources = null
}

export function removeCachedData() {
  if (cachedLibraryDataSources) {
    for (let cachedDataSource of cachedLibraryDataSources) {
      if (cachedDataSource.cachedData) {
        delete cachedDataSource.cachedData
      }
    }
  }

  if (cachedDocumentDataSources) {
    for (let cachedDataSource of cachedDocumentDataSources) {
      if (cachedDataSource.cachedData) {
        delete cachedDataSource.cachedData
      }
    }
  }
}

export function checkEqualityOfDataSources(dataSourceA, dataSourceB) {
  dataSourceA = getStorableProperties(dataSourceA)
  dataSourceB = getStorableProperties(dataSourceB)

  // console.log('COMPARING DATA SOURCES')
  // console.log('A', dataSourceA)
  // console.log('B', dataSourceB)

  const equal = JSON.stringify(dataSourceA) === JSON.stringify(dataSourceB)

  // console.log('EQUAL', equal)

  return equal
}
