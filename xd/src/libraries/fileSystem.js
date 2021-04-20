/**
 * Data
 *
 * Provides access to data import and processing functionality.
 */

const fs = require('uxp').storage.localFileSystem
const fsFormats = require('uxp').storage.formats

export function getDataFolder() {
  return fs.getDataFolder()
}

export function getTemporaryFolder() {
  return fs.getTemporaryFolder()
}

export function resolveFolder(folder) {
  // Handle folder aliases
  if (folder === 'data') return getDataFolder()
  else if (folder === 'temp') return getTemporaryFolder()
  else return Promise.resolve(folder)
}

export function ensureFolder(folder, path) {
  return new Promise(async (resolve, reject) => {
    try {
      folder = await resolveFolder(folder)

      // Split path into components on '/'
      const pathComponents = path.split(/\//g)

      // Ensure each folder in the path exists
      for (let i = 0; i < pathComponents.length; i++) {
        const pathComponent = pathComponents[i]
        const entries = await folder.getEntries()

        // Get or create folder for path component
        let pathFolder = entries.find(entry => entry.name === pathComponent && entry.isFolder)
        if (!pathFolder) {
          pathFolder = await folder.createFolder(pathComponent)
        }

        // Move on to the next path component with the current path component folder as root
        folder = pathFolder
      }
      resolve()
    } catch (e) {
      reject(e)
    }
  })
}

export function writeFile(folder, path, data) {
  return new Promise(async (resolve, reject) => {
    try {
      folder = await resolveFolder(folder)

      // Split path into components on '/'
      const pathComponents = path.split(/\//g)
      const fileName = pathComponents[pathComponents.length - 1]

      let destinationFolder = folder
      if (pathComponents.length > 1) {
        // Ensure and get destination folder
        const destinationFolderPathComponents = pathComponents.slice(0, -1)
        const destinationFolderPath = destinationFolderPathComponents.join('/')
        await ensureFolder(folder, destinationFolderPath)
        destinationFolder = await folder.getEntry(destinationFolderPath)
      }

      // Create and write file
      let newFile = await destinationFolder.createFile(fileName, {
        overwrite: true
      })
      await newFile.write(data)

      resolve()
    } catch (e) {
      reject(e)
    }
  })
}

export function readFile(folder, path, readAsBinary) {
  return new Promise(async (resolve, reject) => {
    try {
      folder = await resolveFolder(folder)

      // Make sure file exists
      const entry = await folder.getEntry(path)
      if (!entry) {
        reject(new Error('File not found'))
      }

      // Make sure it's not a folder
      if (!entry.isFile) {
        reject(new Error('Not a file'))
      }

      // Read file entry
      const data = await entry.read({
        format: readAsBinary ? fsFormats.binary : fsFormats.utf8
      })

      resolve(data)
    } catch (e) {
      reject(e)
    }
  })
}

export function deleteFile(folder, path) {
  return new Promise(async (resolve, reject) => {
    try {
      folder = await resolveFolder(folder)

      // Make sure file exists
      const entry = await folder.getEntry(path)
      if (!entry) {
        reject(new Error('File not found'))
      }

      // Make sure it's not a folder
      if (!entry.isFile) {
        reject(new Error('Not a file'))
      }

      await entry.delete()

      resolve()
    } catch (e) {
      reject(e)
    }
  })
}

export function deleteFolder(folder, path) {
  return new Promise(async (resolve, reject) => {
    try {
      folder = await resolveFolder(folder)

      // Make sure folder exists
      const entry = await folder.getEntry(path)
      if (!entry) {
        reject(new Error('Folder not found'))
      }

      // Make sure it is a folder
      if (!entry.isFolder) {
        reject(new Error('Not a folder'))
      }

      const deleteWholeFolder = async rootFolder => {
        let entries = await rootFolder.getEntries()
        for (let subEntry of entries) {
          if (subEntry.isFile) {
            await subEntry.delete()
          } else {
            await deleteWholeFolder(subEntry)
          }
        }
        await rootFolder.delete()
      }

      await deleteWholeFolder(entry)

      resolve()
    } catch (e) {
      reject(e)
    }
  })
}

export function listFiles(folder, path, fileExtension) {
  return new Promise(async (resolve, reject) => {
    try {
      folder = await resolveFolder(folder)

      // Make sure folder exists
      const entry = await folder.getEntry(path)
      if (!entry) {
        reject(new Error('Folder not found'))
      }

      // Make sure it is a folder
      if (!entry.isFolder) {
        reject(new Error('Not a folder'))
      }

      // Get files in folder
      let files = (await entry.getEntries()).filter(entry => entry.isFile)
      if (fileExtension) {
        files = files.filter(file => file.name.endsWith(`.${fileExtension}`))
      }

      resolve(files)
    } catch (e) {
      reject(e)
    }
  })
}

export function listFolders(folder, path) {
  return new Promise(async (resolve, reject) => {
    try {
      folder = await resolveFolder(folder)

      // Make sure folder exists
      const entry = await folder.getEntry(path)
      if (!entry) {
        reject(new Error('Folder not found'))
      }

      // Make sure it is a folder
      if (!entry.isFolder) {
        reject(new Error('Not a folder'))
      }

      // Get folders in folder
      let folders = (await entry.getEntries()).filter(entry => entry.isFolder)

      resolve(folders)
    } catch (e) {
      reject(e)
    }
  })
}

export function selectFile(supportedExtensions, readAsBinary) {
  return new Promise(async (resolve, reject) => {
    try {
      // Select file
      const file = await fs.getFileForOpening({
        types: supportedExtensions
          ? supportedExtensions instanceof Array
            ? supportedExtensions
            : [supportedExtensions]
          : undefined
      })

      if (!file) {
        reject(new Error('File not selected'))
      }

      // Read file entry
      const data = await file.read({
        format: readAsBinary ? fsFormats.binary : fsFormats.utf8
      })

      resolve({
        file,
        data
      })
    } catch (e) {
      reject(e)
    }
  })
}
