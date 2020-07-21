/**
 * Data
 *
 * Provides access to data import and processing functionality.
 */

import log from '@data-populator/core/log'
const fs = require('uxp').storage.localFileSystem
const types = require('uxp').storage.types
const fsFormats = require('uxp').storage.formats

/**
 * Save file containing data in the temporary folder.
 *
 * @param {String} name
 * @param {Object} data
 */
export function saveFileInTemporaryFolder(name, data) {
  return new Promise(async (resolve, reject) => {
    // save file
    try {
      const tempFolder = await fs.getTemporaryFolder()
      let newFile = await tempFolder.createFile(name, { overwrite: true })
      newFile.write(JSON.stringify(data))
      resolve()
    } catch (e) {
      reject(e)
    }
  })
}

/**
 * Save file containing data in the data folder.
 *
 * @param {String} name
 * @param {Object} data
 */
export function saveFileInDataFolder(name, data) {
  return new Promise(async (resolve, reject) => {
    // save file
    try {
      const folder = await fs.getDataFolder()
      let newFile = await folder.createFile(name, { overwrite: true })
      newFile.write(JSON.stringify(data))
      resolve()
    } catch (e) {
      reject(e)
    }
  })
}

/**
 * Load file in the temporary folder.
 *
 * @param {String} name
 * @returns {String}
 */
export function loadFileInTemporaryFolder(name) {
  return new Promise(async (resolve, reject) => {
    // load file
    try {
      const tempFolder = await fs.getTemporaryFolder()
      const entries = await tempFolder.getEntries()
      const files = entries.filter(entry => entry.name === name && entry.isFile)

      if (files.length && files[0].isFile) {
        resolve(JSON.parse(await files[0].read()))
      } else {
        reject(new Error('Cannot load file: File not found'))
      }
    } catch (e) {
      reject(e)
    }
  })
}

/**
 * Load file in the data folder.
 *
 * @param {String} name
 * @returns {String}
 */
export function loadFileInDataFolder(name) {
  return new Promise(async (resolve, reject) => {
    // load file
    try {
      const folder = await fs.getDataFolder()
      const entries = await folder.getEntries()
      const files = entries.filter(entry => entry.name === name && entry.isFile)

      if (files.length && files[0].isFile) {
        resolve(JSON.parse(await files[0].read()))
      } else {
        reject(new Error('Cannot load file: File not found'))
      }
    } catch (e) {
      reject(e)
    }
  })
}

/**
 * Delete file in the temporary folder.
 *
 * @param {String} name
 */
export function deleteFileInTemporaryFolder(name) {
  return new Promise(async (resolve, reject) => {
    // load file
    try {
      const tempFolder = await fs.getTemporaryFolder()
      const entries = await tempFolder.getEntries()
      const files = entries.filter(entry => entry.name === name && entry.isFile)

      if (files.length && files[0].isFile) {
        resolve(await files[0].delete())
      } else {
        reject(new Error('Cannot delete file: File not found'))
      }
    } catch (e) {
      reject(e)
    }
  })
}

/**
 * Delete file in the data folder.
 *
 * @param {String} name
 */
export function deleteFileInDataFolder(name) {
  return new Promise(async (resolve, reject) => {
    // load file
    try {
      const folder = await fs.getDataFolder()
      const entries = await folder.getEntries()
      const files = entries.filter(entry => entry.name === name && entry.isFile)

      if (files.length && files[0].isFile) {
        resolve(await files[0].delete())
      } else {
        reject(new Error('Cannot delete file: File not found'))
      }
    } catch (e) {
      reject(e)
    }
  })
}

/**
 * Load file in the data folder by using its path.
 *
 * @param {String} path
 * @returns {String}
 */
export function loadFileWithPathInDataFolder(path, binary) {
  return new Promise(async (resolve, reject) => {
    let splitPath = path.split(global.pathSeparator)

    try {
      let folder = await fs.getDataFolder()
      let entries, matches
      for (let i = 0; i < splitPath.length; i++) {
        entries = await folder.getEntries()

        if (i === splitPath.length - 1) {
          matches = entries.filter(entry => entry.name === splitPath[i] && entry.isFile)

          if (matches.length) {
            resolve(
              await matches[0].read({
                format: binary ? fsFormats.binary : fsFormats.utf8
              })
            )
          } else {
            reject(new Error('Cannot load file: File not found'))
          }
        } else {
          matches = entries.filter(entry => entry.name === splitPath[i] && entry.isFolder)
          if (matches.length) {
            folder = matches[0]
          } else {
            reject(new Error('Cannot load file: File not found'))
          }
        }
      }
    } catch (e) {
      reject(e)
    }
  })
}

/**
 * Get all JSON files in the data / presets folder.
 *
 * @returns {Array}
 */
export function getJSONFilesInPresetsFolder() {
  return new Promise(async (resolve, reject) => {
    try {
      let foundJSONFiles = []

      let dataFolder = await fs.getDataFolder()
      let dataFolderEntries = await dataFolder.getEntries()

      let presets = dataFolderEntries.filter(entry => entry.name === 'presets' && entry.isFolder)[0]
      if (presets) {
        let presetsEntries = await presets.getEntries()

        let presetsJSONFiles = presetsEntries.filter(
          entry => entry.name.indexOf('.json') >= 0 && entry.isFile
        )
        foundJSONFiles = foundJSONFiles.concat(presetsJSONFiles)

        let presetsFolders = presetsEntries.filter(entry => entry.isFolder)

        for (let i = 0; i < presetsFolders.length; i++) {
          foundJSONFiles = foundJSONFiles.concat(await getJSONFilesInFolder(presetsFolders[i]))
        }

        resolve(await foundJSONFiles)
      } else {
        await dataFolder.createFolder('presets')
        // reject(new Error('No presets folder'))
        resolve([])
      }
    } catch (e) {
      reject(e)
    }
  })
}

/**
 * Download the presets provided by precious.
 *
 */
export function downloadPresets() {
  return new Promise(async (resolve, reject) => {
    try {
      let urlsToDownload = []
      let baseUrl = 'https://www.datapopulator.com/demodata/'

      let presets = await global
        .fetch(baseUrl)
        .then(res => {
          return res.text()
        })
        .then(data => {
          let regex = /<a[\s]+([^>]+)>((?:.(?!\<\/a\>))*.)<\/a>/g
          let matches = data.match(regex)

          for (let i = 0; i < matches.length; i++) {
            let match = matches[i]
            let splitMatch = match.split('"')

            let url = ''
            for (let j = 0; j < splitMatch.length; j++) {
              if (splitMatch.length >= 2) {
                if (splitMatch[j].indexOf('href') > -1) {
                  url = splitMatch[j + 1]
                }
              }
            }

            if (url.substring(url.length - 5) === '.json') {
              urlsToDownload.push(url)
            }
          }

          return urlsToDownload.map(url =>
            global.fetch(baseUrl + url).then(response => response.json())
          )
        })
        .then(fetchList => {
          return Promise.all(fetchList)
        })

      let dataFolder = await fs.getDataFolder()
      let dataFolderEntries = await dataFolder.getEntries()

      let presetsFolder = dataFolderEntries.filter(
        entry => entry.name === 'presets' && entry.isFolder
      )[0]
      let demoFolder = await presetsFolder.createFolder('demo')
      for (let i = 0; i < presets.length; i++) {
        let presetFile = await demoFolder.createFile(urlsToDownload[i], { overwrite: true })
        presetFile.write(JSON.stringify(presets[i]))
      }

      resolve()
    } catch (e) {
      reject(e)
    }
  })
}

/**
 * Get JSON files in folder.
 * @param {Folder} folder
 * @returns {Array}
 */
async function getJSONFilesInFolder(folder) {
  let entries = await folder.getEntries()
  let jsonFiles = entries.filter(entry => entry.name.indexOf('.json') >= 0 && entry.isFile)
  let folders = entries.filter(entry => entry.isFolder)

  for (let i = 0; i < folders.length; i++) {
    jsonFiles = await jsonFiles.concat(await getJSONFilesInFolder(folders[i]))
  }

  return jsonFiles
}

/**
 * Get path relative to the data folder.
 * @param {String} path
 * @returns {String}
 */
export function getPathRelativeToDataFolder(path) {
  let splitPath = path.split(global.pathSeparator)
  let result
  for (let i = 0; i < splitPath.length; i++) {
    if (splitPath[i] === '1c0ce86b') {
      result = splitPath.slice(i + 1)
    }
  }

  return result.join(global.pathSeparator)
}
