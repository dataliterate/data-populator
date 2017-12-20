/**
 * Data library
 *
 * Provides access to data import and processing functionality.
 */


import Context from '../context'


/**
 * Prompts user to select the JSON file and returns the path of the file.
 *
 * @param {string} path - Path to set for the file browser.
 * @returns {string}
 */
export function askForJSON(path) {

  //create panel
  let panel = NSOpenPanel.openPanel()

  //set panel properties
  panel.setTitle("Select JSON")
  panel.setMessage("Please select the JSON file you'd like to use.")
  panel.setPrompt("Select")
  panel.setCanCreateDirectories(false)
  panel.setCanChooseFiles(true)
  panel.setCanChooseDirectories(false)
  panel.setAllowsMultipleSelection(false)
  panel.setShowsHiddenFiles(false)
  panel.setExtensionHidden(false)

  //set initial panel path
  if (path) {
    panel.setDirectoryURL(NSURL.fileURLWithPath(path))
  }
  else {
    panel.setDirectoryURL(NSURL.fileURLWithPath('/Users/' + NSUserName()))
  }

  //show panel
  let pressedButton = panel.runModal()
  if (pressedButton == NSOKButton) {
    return panel.URL().path()
  }
}


/**
 * Prompts user to select the TSV file and returns the path of the file.
 *
 * @param {string} path - Path to set for the file browser.
 * @returns {string}
 */
export function askForTableTSV(path) {

  //create panel
  let panel = NSOpenPanel.openPanel()

  //set panel properties
  panel.setTitle("Select TSV")
  panel.setMessage("Please select the TSV file you'd like to use to populate the table.")
  panel.setPrompt("Select")
  panel.setCanCreateDirectories(false)
  panel.setCanChooseFiles(true)
  panel.setCanChooseDirectories(false)
  panel.setAllowsMultipleSelection(false)
  panel.setShowsHiddenFiles(false)
  panel.setExtensionHidden(false)

  //set initial panel path
  if (path) {
    panel.setDirectoryURL(NSURL.fileURLWithPath(path))
  }
  else {
    panel.setDirectoryURL(NSURL.fileURLWithPath('/Users/' + NSUserName()))
  }

  //show panel
  let pressedButton = panel.runModal()
  if (pressedButton == NSOKButton) {
    return panel.URL().path()
  }
}


/**
 * Reads the contexts of a text based file at the provided path.
 *
 * @param {string} path
 * @returns {string}
 */
export function readFileAsText(path) {
  return NSString.stringWithContentsOfFile_encoding_error(path, NSUTF8StringEncoding, false)
}


/**
 * Returns the path to the presets dir.
 *
 * @returns {string}
 */
export function getPresetsDir() {

  //get script path
  let scriptPath = Context().scriptPath

  //get presets dir path
  let presetsDirPath = scriptPath.stringByAppendingPathComponent('/../../../Presets/')
  presetsDirPath = presetsDirPath.stringByStandardizingPath()

  return presetsDirPath
}


/**
 * Loads all presets inside the presets dir.
 *
 * @returns {Array}
 */
export function loadPresets() {

  //get presets path
  let presetsPath = getPresetsDir()

  //create file enumerator for presetsPath
  let url = NSURL.fileURLWithPath(presetsPath)
  let enumerator = NSFileManager.defaultManager().enumeratorAtURL_includingPropertiesForKeys_options_errorHandler(url, [NSURLIsDirectoryKey, NSURLNameKey, NSURLPathKey], NSDirectoryEnumerationSkipsHiddenFiles, null)

  let presets = []
  let fileUrl
  while (fileUrl = enumerator.nextObject()) {

    //make sure that file is JSON
    if (fileUrl.pathExtension().isEqualToString('json')) {

      //make sure it's a file
      let isDir = MOPointer.alloc().init()
      fileUrl.getResourceValue_forKey_error(isDir, NSURLIsDirectoryKey, null)
      if (!Number(isDir.value())) {

        //get relative path for preset
        let presetPath = fileUrl.path()
        let presetDisplayPath = presetPath.stringByReplacingOccurrencesOfString_withString(presetsPath + '/', '')

        //create preset structure
        let preset = {
          name: String(presetDisplayPath.stringByDeletingPathExtension()),
          path: String(fileUrl.path())
        };

        //add item
        presets.push(preset)
      }
    }
  }

  return presets
}


/**
 * Downloads the image from the specified remote URL and creates an NSImage instance.
 *
 * @param {string} urlString
 * @returns {NSImage}
 */
export function getImageFromRemoteURL(urlString) {

  //get data from url
  let url = NSURL.URLWithString(urlString)
  let data = url.resourceDataUsingCache(false)
  if (!data) return

  //create image from data
  let image = NSImage.alloc().initWithData(data)
  return image
}


/**
 * Loads the image from the specified local URL and creates an NSImage instance.
 *
 * @param {string} urlString
 * @returns {NSImage}
 */
export function getImageFromLocalURL(urlString) {

  //read image content from file
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
export function getImageData(image) {
  if (!image) return

  //create image data with image
  return MSImageData.alloc().initWithImage(image)
}


/**
 * Loads the JSON file at the specified path and parses and returns its content.
 *
 * @param {string} path
 * @returns {Object/Array}
 */
export function loadJSONData(path) {

  //load contents
  let contents = readFileAsText(path)

  //get data from JSON
  let data
  try {
    data = JSON.parse(contents)
  }
  catch (e) {
    Context().document.showMessage("There was an error parsing data. Please make sure it's valid.")
    return
  }

  return data
}


/**
 * Loads a TSV file and parses its contents into a format that resembles a table.
 *
 * @param {string} path
 * @returns {Object}
 *
 * Example table object:
 * {
 *   "rows":[
 *     {
 *       "title":"TEAM 1",
 *       "rows":[
 *         {
 *           "title":"Peter",
 *           "rows":[ TODO: this should be columns, not rows
 *             {
 *               "title":"QUARTER 1",
 *               "columns":[
 *                 {
 *                   "title":"January",
 *                   "content":{
 *                     "value":"$10,000.00"
 *                   }
 *                 },
 *                 {
 *                   "title":"February",
 *                   "content":{
 *                     "value":"$10,266.00"
 *                   }
 *                 },
 *                 {
 *                   "title":"March",
 *                   "content":{
 *                     "value":"$5,666.00"
 *                   }
 *                 }
 *               ]
 *             }
 *           ]
 *         },
 *         {
 *           "title":"Paul",
 *           "rows":[
 *             {
 *               "title":"QUARTER 1",
 *               "columns":[
 *                 {
 *                   "title":"January",
 *                   "content":{
 *                     "value":"$6,683.00",
 *                     "additional":"30.00%"
 *                   }
 *                 },
 *                 {
 *                   "title":"February",
 *                   "content":{
 *                     "value":"$8,779.00",
 *                     "additional":"34.00%"
 *                   }
 *                 },
 *                 {
 *                   "title":"March",
 *                   "content":{
 *                     "value":"$7,889.00",
 *                     "additional":"55.00%"
 *                   }
 *                 }
 *               ]
 *             }
 *           ]
 *         },
 *         {
 *           "title":"Mary",
 *           "rows":[
 *             {
 *               "title":"QUARTER 1",
 *               "columns":[
 *                 {
 *                   "title":"January",
 *                   "content":{
 *                     "label":"Revenue",
 *                     "value":"$12,334.00",
 *                     "additional":"30.00%"
 *                   }
 *                 },
 *                 {
 *                   "title":"February",
 *                   "content":{
 *                     "label":"Revenue",
 *                     "value":"$8,999.00",
 *                     "additional":"30.00%"
 *                   }
 *                 },
 *                 {
 *                   "title":"March",
 *                   "content":{
 *                     "label":"Revenue",
 *                     "value":"$11,334.00",
 *                     "additional":"30.00%"
 *                   }
 *                 }
 *               ]
 *             }
 *           ]
 *         }
 *       ]
 *     }
 *   ]
 * }
 */
export function loadTableTSV(path) {

  //load contents
  let data = readFileAsText(path)

  //create 2d table array from tsv
  let table = []

  //split into rows
  let rowsData = data.split(/\n/g)
  rowsData.forEach(function (rowData) {

    //prepare row
    let row = []

    //split into columns
    let columnsData = rowData.split(/\t/g)
    columnsData.forEach(function (columnData) {
      columnData = columnData.replace('\r', '').trim()

      //add column to row
      row.push(columnData)
    })

    //add row to table
    table.push(row)
  })

  //find x and y indexes of table data start
  let dataX = 0
  let dataY = 0
  while (!table[0][dataX].length) {
    dataX++
  }
  while (!table[dataY][0].length) {
    dataY++
  }

  //get data width and height
  let dataWidth = table[0].length - dataX
  let dataHeight = table.length - dataY

  //fill missing vertical table group values
  for (let i = 0; i < dataX - 1; i++) {
    let lastPresentValue = null
    for (let j = dataY; j < dataY + dataHeight; j++) {
      if (table[j][i].length) {
        lastPresentValue = table[j][i]
      } else {
        table[j][i] = lastPresentValue
      }
    }
  }

  //fill missing horizontal table group values
  for (let i = 0; i < dataY; i++) {
    let lastPresentValue = null
    for (let j = dataX; j < dataX + dataWidth; j++) {
      if (table[i][j].length) {
        lastPresentValue = table[i][j]
      } else {
        table[i][j] = lastPresentValue
      }
    }
  }

  //create grouped table of horizontal entries
  let groupedTable = {
    rows: []
  }
  for (let i = dataY; i < dataY + dataHeight; i++) {
    for (let j = dataX; j < dataX + dataWidth; j++) {

      //get data for table cell
      let data = table[i][j]

      //get data key
      //data keys are always to the left of the data
      let dataKey = table[i][dataX - 1]

      //find path to data
      let path = []
      for (let p = 0; p < dataX - 1; p++) {
        path.push({
          title: table[i][p],
          type: 'row'
        })
      }
      for (let p = 0; p < dataY; p++) {
        path.push({
          title: table[p][j],
          type: 'column'
        })
      }

      //create path structure
      let parent = groupedTable.rows;
      for (let p = 0; p < path.length; p++) {

        //find existing child in parent with same title
        let existingChild = null
        for (let q = 0; q < parent.length; q++) {
          if (parent[q].title == path[p].title) {
            existingChild = parent[q]
            break
          }
        }

        //select next parent
        if (existingChild) {
          parent = existingChild[path[p].type + 's']
          if (!parent) parent = existingChild.content
        } else {

          //prepare new child that will become next parent
          let newChild = {
            title: path[p].title
          }

          //if it's the last path component, the content is an object
          if (p == path.length - 1) {
            newChild.content = {}
            parent.push(newChild)
            parent = newChild.content
          } else {
            newChild[path[p].type + 's'] = []
            parent.push(newChild)
            parent = newChild[path[p].type + 's']
          }
        }
      }

      //add value for key to parent
      parent[dataKey] = data
    }
  }

  return groupedTable
}


/**
 * Flattens the previously parsed TSV table to make populating possible.
 *
 * @param {Object} data
 * @returns {Object}
 *
 * Example flattened table:
 *
 * {
 *   "rowGroups":[
 *     {
 *       "title":"TEAM 1",
 *       "groups":[
 *         {
 *           "title":"Peter"
 *         },
 *         {
 *           "title":"Paul"
 *         },
 *         {
 *           "title":"Mary"
 *         }
 *       ]
 *     }
 *   ],
 *   "columnGroups":[
 *     {
 *       "title":"QUARTER 1",
 *       "groups":[
 *         {
 *           "title":"January"
 *         },
 *         {
 *           "title":"February"
 *         },
 *         {
 *           "title":"March"
 *         }
 *       ]
 *     }
 *   ],
 *   "cells":[
 *     [
 *       {
 *         "value":"$10,000.00"
 *       },
 *       {
 *         "value":"$10,266.00"
 *       },
 *       {
 *         "value":"$5,666.00"
 *       }
 *     ],
 *     [
 *       {
 *         "value":"$6,683.00",
 *         "additional":"30.00%"
 *       },
 *       {
 *         "value":"$8,779.00",
 *         "additional":"34.00%"
 *       },
 *       {
 *         "value":"$7,889.00",
 *         "additional":"55.00%"
 *       }
 *     ],
 *     [
 *       {
 *         "label":"Revenue",
 *         "value":"$12,334.00",
 *         "additional":"30.00%"
 *       },
 *       {
 *         "label":"Revenue",
 *         "value":"$8,999.00",
 *         "additional":"30.00%"
 *       },
 *       {
 *         "label":"Revenue",
 *         "value":"$11,334.00",
 *         "additional":"30.00%"
 *       }
 *     ]
 *   ]
 * }
 */
export function flattenTable(data) {

  //get row groups
  let rowGroups = []
  for (let i = 0; i < data.rows.length; i++) {
    rowGroups = rowGroups.concat(getRowGroups(data.rows[i]))
  }

  //get column groups
  let columnGroups = getColumnGroups(getRootColumns(data.rows[0]))

  //get cells
  let cells = getCells(data)

  //split cells into rows
  let columnCount = getColumnCount(columnGroups)
  let rowCells = []
  let currentRow
  for (let i = 0; i < cells.length; i++) {
    if (i % columnCount == 0) {
      currentRow = []
      rowCells.push(currentRow)
    }
    currentRow.push(cells[i])
  }

  return {
    rowGroups: rowGroups,
    columnGroups: columnGroups,
    cells: rowCells
  }


  function getColumnCount(columnGroups) {

    let count = 0

    for (let i = 0; i < columnGroups.length; i++) {
      let group = columnGroups[i]
      if (group.groups) {
        count += getColumnCount(group.groups)
      }
      else {
        count++
      }
    }

    return count
  }

  function getCells(data, parent) {
    if (!parent) parent = data

    let cells = []

    if (data.rows && data.rows.length) {
      for (let i = 0; i < data.rows.length; i++) {
        let row = data.rows[i]
        cells = cells.concat(getCells(row, data))
      }
    }
    else if (data.columns && data.columns.length) {
      for (let i = 0; i < data.columns.length; i++) {
        let column = data.columns[i]
        cells = cells.concat(getCells(column, data))
      }
    }
    else if (data.content) {

      //extract cells here
      cells.push(data.content)
    }

    return cells
  }

  function getRowGroups(data) {
    let groups = []
    if (data.rows && data.rows.length) {
      let group = {
        title: data.title
      }
      groups.push(group)
      let subGroups = []
      for (let i = 0; i < data.rows.length; i++) {
        subGroups = subGroups.concat(getRowGroups(data.rows[i]))
      }
      if (subGroups.length) group.groups = subGroups
    }
    return groups
  }

  function getRootColumns(data) {

    //drill down the rows
    let parent = data
    while (data.rows) {
      parent = data
      data = data.rows[0]
    }

    return parent.rows
  }

  function getColumnGroups(data) {
    let groups = []

    //process all root columns
    for (let x = 0; x < data.length; x++) {
      let column = data[x]

      //create group
      let group = {
        title: column.title
      }
      groups.push(group)

      //process sub columns
      if (column.columns && column.columns.length) {
        let subGroups = getColumnGroups(column.columns)
        if (subGroups.length) group.groups = subGroups
      }
    }

    return groups
  }
}
