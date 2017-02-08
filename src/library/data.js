/**
 * Data library
 *
 * Provides access to data import and processing functionality.
 */


import Context from '../context'
import {createAlert, createLabel} from './gui'
import Options, * as OPTIONS from './options'

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
 * Prompts user to select the Cloudstitch username, appname, and worksheet name
 * so that the plugin may download the spreadsheet data as JSON.
 *
 * @returns {string} The URL for the JSON to download
 */
export function askForCloudstitch(lastUsername, lastAppname, lastWorksheet) {

  let alert = createAlert("Select Spreadsheet", "Enter the details the Cloudstitch project that contains your Spreadsheet", 'icon.png')

  //create data options view (disable randomize if populating table)
  let cloudstitchOptionsView = createCloudstitchOptionsView({})
  alert.addAccessoryView(cloudstitchOptionsView.view)

  //add bottom buttons
  alert.addButtonWithTitle('Populate')
  alert.addButtonWithTitle('Cancel')

  //show alert
  let responseCode = alert.runModal()
  if (responseCode == '1000') {
    //get cloudstitch username
    let usernameTextField = cloudstitchOptionsView.usernameTextField
    let username = String(usernameTextField.stringValue())

    //get cloudstitch appname
    let appnameTextField = cloudstitchOptionsView.appnameTextField
    let appname = String(appnameTextField.stringValue())

    //get cloudstitch worksheet
    let worksheetTextField = cloudstitchOptionsView.worksheetTextField
    let worksheet = String(worksheetTextField.stringValue())

    return {
      username: username,
      appname: appname,
      worksheet: worksheet
    }
  } else {
    return null;
  }
}

/**
 * Creates a set of views that comprise the inputs required to fetch data from Cloudstitch.
 *
 * @param {Object} opt
 * @returns {Object}
 *
 */
export function createCloudstitchOptionsView(opt) {

  //get options
  let options = {
    ...Options(),
    ...opt
  }

  //create options view

  const ViewWidth = 300, ViewHeight = 200;
  const X = 0, W = 300, LabelHeight = 18, InputHeight = 22;
  const InternalPadding = 1, ExternalPadding = 10, TopPadding = 25;
  const BlockHeight = LabelHeight + InputHeight;

  let optionsView = NSView.alloc().initWithFrame(NSMakeRect(0, 0, ViewWidth, ViewHeight))
  
  optionsView.backgroundColor = NSColor.colorWithCalibratedRed_green_blue_alpha(0.227, 0.251, 0.337,0.8);

  var addField = function(labelText, defaultValue, i) {
    //create substitute label
    // 0,0 is bottom left, so need to subtract from heights
    const LabelYFlipped = i * (BlockHeight + ExternalPadding) + TopPadding;
    const LabelY = ViewHeight - LabelYFlipped;
    const InputY = ViewHeight - (LabelYFlipped + LabelHeight);

    let label = createLabel(labelText, 12, false, NSMakeRect(X , LabelY, W, LabelHeight))
    optionsView.addSubview(label)

    //create substitute text field
    let textField = NSTextField.alloc().initWithFrame(NSMakeRect(X , InputY, W, InputHeight))
    optionsView.addSubview(textField)

    //set substitute
    if (defaultValue) {
      textField.setStringValue(defaultValue)
    }
    else {
      textField.setStringValue('')
    }
    return textField;
  }

  // Create the fields
  let defaultUsername = opt[OPTIONS.LAST_CLOUDSTITCH_USERNAME] || 'project-templates';
  let defaultAppname = opt[OPTIONS.LAST_CLOUDSTITCH_APPNAME] || 'sketch-data';
  let defaultWorksheet = opt[OPTIONS.LAST_CLOUDSTITCH_WORKSHEET] || 'People';

  let usernameTextField = addField('Cloudstitch username:', defaultUsername, 0);
  let appnameTextField = addField('Cloudstitch appname:', defaultAppname, 1);
  let worksheetTextField = addField('Cloudstitch worksheet:', defaultWorksheet, 2);

  // Create help URL.
  // let helpString = NSMutableAttributedString.alloc().initWithString("Help and Video Tutorial");

  // var s = "Help and Video Tutorial";

  // let range = NSMakeRange(0, s.length);
  // let linkAttr = NSLinkAttributeName.alloc().initWithValue_range("http://docs.cloudstitch.com/integrations/sketch", range);
  // helpString.addAttribute(linkAttr)

  // let helpString = NSAttributedString.alloc().initWithString_attributes(s, []);

  // Create the label and then override with attributed string containing URL
  // let helpLabel = createLabel("<a href='#'>foo<a>", 12, false, NSMakeRect(0 , 2*TopPadding + 3*BlockHeight, W, LabelHeight));

  // helpLabel.setAllowsEditingTextAttributes = true;
  // let t = helpLabel.attributedStringValue().mutableCopy();
  // let d = {};
  // d[NSLinkAttributeName] = 

  // }


  // optionsView.addSubview(helpLabel)

// NSAttributedString.hyperlinkFromString_withURL
// NSAttributedString.hyperlinkFromString_withURL

  //return configured view
  return {
    view: optionsView,
    usernameTextField: usernameTextField,
    appnameTextField: appnameTextField,
    worksheetTextField: worksheetTextField
  };
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
 * Reads the contexts of a HTTP-hosted file at the provided URL.
 *
 * @param {string} urlAsString
 * @returns {string}
 */
export function readUrlAsText(urlAsString) {

  let url = NSURL.URLWithString(urlAsString)
  let data = url.resourceDataUsingCache(false)

  if (!data) return null;

  var dataString = NSString.alloc().initWithData_encoding(data, NSUTF8StringEncoding);
  return dataString;
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
  return MSImageData.alloc().initWithImage_convertColorSpace(image, false)
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
 * Loads the JSON file at the specified URL and parses and returns its content.
 *
 * @param {string} urlAsString
 * @returns {Object/Array}
 */
export function loadJSONRemote(urlAsString) {

  //load contents
  let contents = readUrlAsText(urlAsString)

  //get data from JSON
  let data;
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