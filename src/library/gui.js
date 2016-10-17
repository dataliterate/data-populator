/**
 * Gui library
 *
 * Provides functionality to create various user interface components.
 */


import Context from '../context'
import * as Populator from './populator'
import Options, * as OPTIONS from './options'


/**
 * Creates and shows the complete dialog used when running populate commands and
 * returns the configuration selected by the user. It can be configured for all
 * types of populate commands.
 *
 * @param presets
 * @returns {Object}
 */
export function showPopulatorDialog(type, opt) {

  //define titles
  let alertTitle = {
    json: 'Populate with JSON',
    preset: 'Populate with Preset',
    table: 'Populate Table'
  }

  //define descriptions
  let alertDesc = {
    json: "Please configure the options below.",
    preset: "Please select the Preset you'd like to use to populate your design and configure the options.",
    table: "Please configure the options below."
  }

  //create alert for type
  let alert = createAlert(alertTitle[type], alertDesc[type], 'icon_new.png')

  //get saved options
  let options = Options()

  //add preset options
  let presetList
  if (type == Populator.POPULATE_TYPE.PRESET) {

    //get preset names array
    let presetNames = []
    opt.presets.forEach(function (preset) {
      presetNames.push(preset.name)
    })

    //create list view
    let listView = NSView.alloc().initWithFrame(NSMakeRect(0, 0, 300, 50))
    alert.addAccessoryView(listView)

    //create preset list title
    let presetListTitle = createLabel('Select Preset', 12, true, NSMakeRect(0, 30, 300, 20))
    listView.addSubview(presetListTitle)

    //create preset list
    presetList = createSelect(presetNames, 0, NSMakeRect(0, 0, 300, 25))
    listView.addSubview(presetList)

    //select last selected preset
    let lastSelectedPresetIndex = options[OPTIONS.SELECTED_PRESET_INDEX]
    if (lastSelectedPresetIndex && lastSelectedPresetIndex < presetNames.length) {
      presetList.selectItemAtIndex(lastSelectedPresetIndex)
    }

    //add space
    let spacerView = NSView.alloc().initWithFrame(NSMakeRect(0, 0, 300, 5))
    alert.addAccessoryView(spacerView)
  }

  //create data options view (disable randomize if populating table)
  let dataOptionsView = createDataOptionsView({
    noRandomize: type == Populator.POPULATE_TYPE.TABLE
  })
  alert.addAccessoryView(dataOptionsView.view)

  //add grid layout options
  let layoutOptionsView
  if (type != Populator.POPULATE_TYPE.TABLE) {

    //add space
    let spacerView2 = NSView.alloc().initWithFrame(NSMakeRect(0, 0, 300, 5))
    alert.addAccessoryView(spacerView2)

    //create layout options view
    layoutOptionsView = createLayoutOptionsView()
    alert.addAccessoryView(layoutOptionsView.view)

    //set rows text field as first responder
    let alertWindow = alert.alert().window()
    alertWindow.setInitialFirstResponder(layoutOptionsView.rowsCountTextField)
    alertWindow.setAutorecalculatesKeyViewLoop(true)
  }

  //add bottom buttons
  alert.addButtonWithTitle('Populate')
  alert.addButtonWithTitle('Cancel')

  //show alert
  let responseCode = alert.runModal()
  if (responseCode == '1000') {

    //get preset options
    if (presetList) {

      //get selected preset
      let selectedPresetIndex = presetList.indexOfSelectedItem()

      //add options to result
      options[OPTIONS.SELECTED_PRESET_INDEX] = selectedPresetIndex
    }

    //get data options
    if (dataOptionsView) {

      //get randomize checkbox state
      let randomizeCheckbox = dataOptionsView.randomizeCheckbox
      let randomizeData = Number(randomizeCheckbox.state())

      //get trim checkbox state
      let trimCheckbox = dataOptionsView.trimCheckbox
      let trimText = Number(trimCheckbox.state())

      //get ellipsis checkbox state
      let ellipsisCheckbox = dataOptionsView.ellipsisCheckbox
      let insertEllipsis = Number(ellipsisCheckbox.state())

      //get default substitute
      let substituteTextField = dataOptionsView.substituteTextField
      let defaultSubstitute = String(substituteTextField.stringValue())

      //add options to result
      options[OPTIONS.RANDOMIZE_DATA] = randomizeData
      options[OPTIONS.TRIM_TEXT] = trimText
      options[OPTIONS.INSERT_ELLIPSIS] = insertEllipsis
      options[OPTIONS.DEFAULT_SUBSTITUTE] = defaultSubstitute
    }

    //get layout options
    if (layoutOptionsView) {

      //get create grid checkbox state
      let createGridCheckbox = layoutOptionsView.createGridCheckbox
      let isCreateGrid = Number(createGridCheckbox.state())

      //get grid config
      let rowsCountTextField = layoutOptionsView.rowsCountTextField
      let rowsCount = Number(rowsCountTextField.stringValue().split(/[.,]/g)[0])
      let rowsMarginTextField = layoutOptionsView.rowsMarginTextField
      let rowsMargin = Number(rowsMarginTextField.stringValue().replace(/,/g, '.'))
      let columnsCountTextField = layoutOptionsView.columnsCountTextField
      let columnsCount = Number(columnsCountTextField.stringValue().split(/[.,]/g)[0])
      let columnsMarginTextField = layoutOptionsView.columnsMarginTextField
      let columnsMargin = Number(columnsMarginTextField.stringValue().replace(/,/g, '.'))

      //add options to result
      options[OPTIONS.CREATE_GRID] = isCreateGrid
      options[OPTIONS.ROWS_COUNT] = rowsCount
      options[OPTIONS.ROWS_MARGIN] = rowsMargin
      options[OPTIONS.COLUMNS_COUNT] = columnsCount
      options[OPTIONS.COLUMNS_MARGIN] = columnsMargin
    }

    //return configured options
    return options
  }
}


/**
 * Creates a new alert with a title, message and icon.
 *
 * @param {string} title
 * @param {string} message
 * @param {string} iconFileName
 * @returns {COSAlertWindow}
 */
export function createAlert(title, message, iconFileName) {

  let alert = COSAlertWindow.new()
  alert.setMessageText(title)
  alert.setInformativeText(message)

  if (iconFileName) {

    //get icon path
    let iconUrl = Context().plugin.urlForResourceNamed(iconFileName)

    //set icon
    let icon = NSImage.alloc().initByReferencingFile(iconUrl.path())
    alert.setIcon(icon)
  }

  return alert
}


/**
 * Creates a set of views that comprise the data options view show in the alert.
 *
 * @param {Object} opt
 * @returns {Object}
 *
 * opt: {
 *   noRandomize: {boolean}
 * }
 */
export function createDataOptionsView(opt) {

  //get options
  let options = {
    ...Options(),
    ...opt
  }

  //create options view
  let optionsView = NSView.alloc().initWithFrame(NSMakeRect(0, 0, 300, 110))

  //create options view title
  let optionsViewTitle = createLabel('Data options', 12, true, NSMakeRect(0, 90, 300, 20))
  optionsView.addSubview(optionsViewTitle)

  //create randomize checkbox
  let randomizeCheckbox = createCheckbox('Randomize data order', false, NSMakeRect(0, 65, 300, 20))
  optionsView.addSubview(randomizeCheckbox)

  //set randomize checkbox state
  randomizeCheckbox.setState(options[OPTIONS.RANDOMIZE_DATA])

  //disable randomize checkbox if randomizing is not allowed
  if (options.noRandomize) {

    //set randomize checkbox state
    randomizeCheckbox.setState(false)
    randomizeCheckbox.setEnabled(false)
  }

  //create trim checkbox
  let trimCheckbox = createCheckbox('Trim overflowing text (fixed width text layers)', false, NSMakeRect(0, 45, 300, 20))
  optionsView.addSubview(trimCheckbox)

  //set trim checkbox state
  trimCheckbox.setState(options[OPTIONS.TRIM_TEXT])

  //create ellipsis checkbox
  let ellipsisCheckbox = createCheckbox('Insert ellipsis after trimmed text', false, NSMakeRect(0, 25, 300, 20))
  optionsView.addSubview(ellipsisCheckbox)

  //set ellipsis checkbox state
  ellipsisCheckbox.setState(options[OPTIONS.INSERT_ELLIPSIS])

  //create substitute label
  let substituteLabel = createLabel('Default substitute:', 12, false, NSMakeRect(0, 0, 110, 20))
  optionsView.addSubview(substituteLabel)

  //create substitute text field
  let substituteTextField = NSTextField.alloc().initWithFrame(NSMakeRect(110, 0, 120, 22))
  optionsView.addSubview(substituteTextField)

  //set substitute
  if (options[OPTIONS.DEFAULT_SUBSTITUTE]) {
    substituteTextField.setStringValue(options[OPTIONS.DEFAULT_SUBSTITUTE])
  }
  else {
    substituteTextField.setStringValue('')
  }

  //return configured view
  return {
    view: optionsView,
    randomizeCheckbox: randomizeCheckbox,
    trimCheckbox: trimCheckbox,
    ellipsisCheckbox: ellipsisCheckbox,
    substituteTextField: substituteTextField
  };
}


/**
 * Creates a set of views that comprise the layout options view show in the alert.
 *
 * @returns {Object}
 */
export function createLayoutOptionsView() {

  //get options
  let options = Options()

  //create options view
  let optionsView = NSView.alloc().initWithFrame(NSMakeRect(0, 0, 300, 104))

  //create options view title
  let optionsViewTitle = createLabel('Layout options', 12, true, NSMakeRect(0, 84, 300, 20))
  optionsView.addSubview(optionsViewTitle)

  //create create grid checkbox
  let createGridCheckbox = createCheckbox('Create grid', false, NSMakeRect(0, 59, 300, 20))
  optionsView.addSubview(createGridCheckbox)

  //set randomize checkbox state
  createGridCheckbox.setState(options[OPTIONS.CREATE_GRID])

  //create rows count label
  let rowsCountLabel = createLabel('Rows:', 12, false, NSMakeRect(0, 27, 60, 20))
  optionsView.addSubview(rowsCountLabel)

  //create rows count text field
  let rowsCountTextField = NSTextField.alloc().initWithFrame(NSMakeRect(60, 27, 70, 22))
  optionsView.addSubview(rowsCountTextField)

  //set rows count
  if (options[OPTIONS.ROWS_COUNT]) {
    rowsCountTextField.setStringValue(options[OPTIONS.ROWS_COUNT])
  }
  else {
    rowsCountTextField.setStringValue('1')
  }

  //create rows margin label
  let rowsMarginLabel = createLabel('Margin:', 12, false, NSMakeRect(142, 27, 50, 20))
  optionsView.addSubview(rowsMarginLabel)

  //create rows margin text field
  let rowsMarginTextField = NSTextField.alloc().initWithFrame(NSMakeRect(190, 27, 70, 22))
  optionsView.addSubview(rowsMarginTextField)

  //set rows margin
  if (options[OPTIONS.ROWS_MARGIN]) {
    rowsMarginTextField.setStringValue(options[OPTIONS.ROWS_MARGIN])
  }
  else {
    rowsMarginTextField.setStringValue('10')
  }

  //create columns count label
  let columnsCountLabel = createLabel('Columns:', 12, false, NSMakeRect(0, 0, 60, 20))
  optionsView.addSubview(columnsCountLabel)

  //create columns count text field
  let columnsCountTextField = NSTextField.alloc().initWithFrame(NSMakeRect(60, 0, 70, 22))
  optionsView.addSubview(columnsCountTextField)

  //set columns count
  if (options[OPTIONS.COLUMNS_COUNT]) {
    columnsCountTextField.setStringValue(options[OPTIONS.COLUMNS_COUNT])
  }
  else {
    columnsCountTextField.setStringValue('1')
  }

  //create columns margin label
  let columnsMarginLabel = createLabel('Margin:', 12, false, NSMakeRect(142, 0, 50, 20))
  optionsView.addSubview(columnsMarginLabel)

  //create columns margin text field
  let columnsMarginTextField = NSTextField.alloc().initWithFrame(NSMakeRect(190, 0, 70, 22))
  optionsView.addSubview(columnsMarginTextField)

  //set columns margin
  if (options[OPTIONS.COLUMNS_MARGIN]) {
    columnsMarginTextField.setStringValue(options[OPTIONS.COLUMNS_MARGIN])
  }
  else {
    columnsMarginTextField.setStringValue('10')
  }

  //return configured view
  return {
    view: optionsView,
    createGridCheckbox: createGridCheckbox,
    rowsCountTextField: rowsCountTextField,
    rowsMarginTextField: rowsMarginTextField,
    columnsCountTextField: columnsCountTextField,
    columnsMarginTextField: columnsMarginTextField
  }
}


/**
 * Creates an NSTextField styled as a label.
 *
 * @param {string} text
 * @param {int} fontSize
 * @param {boolean} bold
 * @param {NSRect} frame
 * @returns {NSTextField}
 */
export function createLabel(text, fontSize, bold, frame) {

  //create label
  let label = NSTextField.alloc().initWithFrame(frame)
  label.setStringValue(text)

  //set font
  if (bold) {
    label.setFont(NSFont.boldSystemFontOfSize(fontSize))
  }
  else {
    label.setFont(NSFont.systemFontOfSize(fontSize))
  }

  //set properties to make the text field look like a label
  label.setBezeled(false)
  label.setDrawsBackground(false)
  label.setEditable(false)
  label.setSelectable(false)

  return label
}


/**
 * Creates an NSButton styled as a checkbox.
 *
 * @param {string} text
 * @param {boolean} checked
 * @param {NSRect} frame
 * @returns {NSButton}
 */
export function createCheckbox(text, checked, frame) {

  //convert boolean to NSState
  checked = (checked == false) ? NSOffState : NSOnState

  //create checkbox button
  let checkbox = NSButton.alloc().initWithFrame(frame)
  checkbox.setButtonType(NSSwitchButton)
  checkbox.setBezelStyle(0)
  checkbox.setTitle(text)
  checkbox.setState(checked)

  return checkbox
}


/**
 * Creates an NSPopUpButton that can be used as a list select menu.
 *
 * @param {Array} items
 * @param {int} selectedIndex
 * @param {NSRect} frame
 * @returns {NSPopUpButton}
 */
export function createSelect(items, selectedIndex, frame) {

  //create select
  let select = NSPopUpButton.alloc().initWithFrame_pullsDown(frame, false)

  //add items to the list
  select.addItemsWithTitles(items)
  select.selectItemAtIndex(selectedIndex)

  return select
}