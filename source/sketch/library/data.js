/**
 * Data
 *
 * Provides access to data import and processing functionality.
 */

import Context from './context'
import Options, * as OPTIONS from './options'

/**
 * Prompts user to select the JSON file and returns the path of the file.
 *
 * @param {String} path - Path to set for the file browser.
 * @returns {String}
 */
export function askForJSON (path) {

  // create panel
  let panel = NSOpenPanel.openPanel()

  // set panel properties
  panel.setTitle('Select JSON')
  panel.setMessage("Please select the JSON file you'd like to use.")
  panel.setPrompt('Select')
  panel.setCanCreateDirectories(false)
  panel.setCanChooseFiles(true)
  panel.setCanChooseDirectories(false)
  panel.setAllowsMultipleSelection(false)
  panel.setShowsHiddenFiles(false)
  panel.setExtensionHidden(false)
  panel.setAllowedFileTypes(['json'])

  // set initial panel path
  if (path) {
    panel.setDirectoryURL(NSURL.fileURLWithPath(path))
  } else {
    panel.setDirectoryURL(NSURL.fileURLWithPath('/Users/' + NSUserName()))
  }

  // show panel
  let pressedButton = panel.runModal()
  if (pressedButton === NSOKButton) {
    return panel.URL().path()
  }
}

/**
 * Prompts user to select a directory
 * @param {String} title
 * @param {String} message
 * @param {String} path - Path to set for the file browser.
 * @returns {String}
 */
export function askForDirectory (title, message, path) {

  // create panel
  let panel = NSOpenPanel.openPanel()

  // set panel properties
  panel.setTitle(title)
  panel.setMessage(message)
  panel.setPrompt('Select')
  panel.setCanCreateDirectories(true)
  panel.setCanChooseFiles(false)
  panel.setCanChooseDirectories(true)
  panel.setAllowsMultipleSelection(false)
  panel.setShowsHiddenFiles(false)
  panel.setExtensionHidden(false)

  // set initial panel path
  if (path) {
    panel.setDirectoryURL(NSURL.fileURLWithPath(path))
  } else {
    panel.setDirectoryURL(NSURL.fileURLWithPath('/Users/' + NSUserName()))
  }

  // show panel
  let pressedButton = panel.runModal()
  if (pressedButton === NSOKButton) {
    return panel.URL().path()
  }
}

/**
 * Reads the contexts of a text based file at the provided path.
 *
 * @param {String} path
 * @returns {String}
 */
export function readFileAsText (path) {

  // make sure file exists
  if (!NSFileManager.defaultManager().fileExistsAtPath_isDirectory(path, null)) return

  return NSString.stringWithContentsOfFile_encoding_error(path, NSUTF8StringEncoding, false)
}

/**
 * Returns the default path to the presets dir.
 *
 * @returns {String}
 */
export function getDefaultPresetsDir () {

  // get script path
  let scriptPath = Context().scriptPath

  // get presets dir path
  let presetsDirPath = scriptPath.stringByAppendingPathComponent('/../../../Presets/')
  presetsDirPath = presetsDirPath.stringByStandardizingPath()

  return presetsDirPath
}

/**
 * Returns the path to the presets dir.
 *
 * @returns {String}
 */
export function getPresetsDir () {

  // load path from settings
  let options = Options()
  let presetsLibraryPath = options[OPTIONS.PRESETS_LIBRARY_PATH]

  // if no path is set, use default
  if (!presetsLibraryPath) {
    presetsLibraryPath = getDefaultPresetsDir()
  }

  return presetsLibraryPath
}

/**
 * Loads all presets inside the presets dir.
 *
 * @returns {Array}
 */
export function loadPresets () {

  // get presets path
  let presetsPath = getPresetsDir()

  // create file enumerator for presetsPath
  let url = NSURL.fileURLWithPath(presetsPath)
  let enumerator = NSFileManager.defaultManager().enumeratorAtURL_includingPropertiesForKeys_options_errorHandler(url, [NSURLIsDirectoryKey, NSURLNameKey, NSURLPathKey], NSDirectoryEnumerationSkipsHiddenFiles, null)

  let presets = []
  let fileUrl = enumerator.nextObject()
  while (fileUrl) {

    // make sure that file is JSON
    if (fileUrl.pathExtension().isEqualToString('json')) {

      // make sure it's a file
      let isDir = MOPointer.alloc().init()
      fileUrl.getResourceValue_forKey_error(isDir, NSURLIsDirectoryKey, null)
      if (!Number(isDir.value())) {

        // get relative path for preset
        let presetPath = fileUrl.path()
        let presetDisplayPath = presetPath.stringByReplacingOccurrencesOfString_withString(presetsPath + '/', '')

        // create preset structure
        let preset = {
          name: String(presetDisplayPath.stringByDeletingPathExtension()),
          path: String(fileUrl.path())
        }

        // add item
        presets.push(preset)
      }
    }

    fileUrl = enumerator.nextObject()
  }

  return presets
}

/**
 * Downloads the image from the specified remote URL and creates an NSImage instance.
 *
 * @param {String} urlString
 * @returns {NSImage}
 */
export function getImageFromRemoteURL (urlString) {

  // encode spaces
  urlString = urlString.replace(/\s/g, '%20')

  // get data from url
  let url = NSURL.URLWithString(urlString)
  let data = url.resourceDataUsingCache(false)
  if (!data) return

  // create image from data
  let image = NSImage.alloc().initWithData(data)
  return image
}

/**
 * Loads the image from the specified local URL and creates an NSImage instance.
 *
 * @param {String} urlString
 * @returns {NSImage}
 */
export function getImageFromLocalURL (urlString) {

  // read image content from file
  let fileManager = NSFileManager.defaultManager()
  if (fileManager.fileExistsAtPath(urlString)) {
    return NSImage.alloc().initWithContentsOfFile(urlString)
  }
}

/**
 * Creates an MSImageData instance from NSImage.
 *
 * @param {NSImage} image
 * @returns {MSImageData}
 */
export function getImageData (image) {
  if (!image) return

  // create image data with image
  return MSImageData.alloc().initWithImage(image)
}

/**
 * Loads the JSON file at the specified path and parses and returns its content.
 *
 * @param {String} path
 * @returns {Object/Array}
 */
export function loadJSONData (path) {

  // load contents
  let contents = readFileAsText(path)

  // get data from JSON
  let data
  try {
    data = JSON.parse(contents)
  } catch (e) {
    Context().document.showMessage("There was an error parsing data. Please make sure it's valid.")
    return
  }

  return data
}
