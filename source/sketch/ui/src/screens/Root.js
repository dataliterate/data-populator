/**
 * Root
 */

import React from 'react'
import './Root.scss'
import Strings, * as STRINGS from '../../../../core/library/strings'
import * as OPTIONS from '../../../library/options'
import $ from 'jquery'

import * as Utils from '../library/utils'

import Title from '../components/Title'
import Select from '../components/Select'
import FileBrowseField from '../components/FileBrowseField'
import URLGroup from '../components/URLGroup'
import TextField from '../components/TextField'
import Checkbox from '../components/Checkbox'
import Button from '../components/Button'
import LayoutOptionsTextFieldBlock from '../components/LayoutOptionsTextFieldBlock'
import DataPreview from '../components/DataPreview'

class Root extends React.Component {
  constructor (props) {
    super(props)

    this.state = {

      // shows a read-only screen
      viewOnly: false,

      // shows loading animation
      loading: false,

      // track whether a file dialog is opened
      fileDialogOpen: false,

      // additional state for specific populate types
      presets: [],
      urlInvalid: false,

      // global data
      jsonData: null,
      jsonDataInvalid: false,

      // configurable options for the populator
      options: {
        [OPTIONS.POPULATE_TYPE]: null,
        [OPTIONS.RANDOMIZE_DATA]: true,
        [OPTIONS.TRIM_TEXT]: true,
        [OPTIONS.INSERT_ELLIPSIS]: true,
        [OPTIONS.DEFAULT_SUBSTITUTE]: '',
        [OPTIONS.CREATE_GRID]: false,
        [OPTIONS.ROWS_COUNT]: 2,
        [OPTIONS.ROWS_MARGIN]: 10,
        [OPTIONS.COLUMNS_COUNT]: 2,
        [OPTIONS.COLUMNS_MARGIN]: 10,
        [OPTIONS.DATA_PATH]: '',
        [OPTIONS.HEADERS]: [],
        [OPTIONS.URL]: '',
        [OPTIONS.JSON_PATH]: '',
        [OPTIONS.SELECTED_PRESET]: null
      }
    }

    // main entry point used to configure screen with params
    this.init = this.init.bind(this)

    // preset related handlers
    this.handlePresetsSelectChange = this.handlePresetsSelectChange.bind(this)
    this.handleJSONBrowse = this.handleJSONBrowse.bind(this)

    // json related handlers
    this.setData = this.setData.bind(this)
    this.setJSONPath = this.setJSONPath.bind(this)

    // url related handlers
    this.handleHeadersVisibilityChange = this.handleHeadersVisibilityChange.bind(this)
    this.handleLoadURLButtonClick = this.handleLoadURLButtonClick.bind(this)
    this.handleAddHeaderButton = this.handleAddHeaderButton.bind(this)
    this.handleRemoveHeaderButton = this.handleRemoveHeaderButton.bind(this)
    this.handleHeadersChange = this.handleHeadersChange.bind(this)

    // global data related handlers
    this.handleTextFieldChange = this.handleTextFieldChange.bind(this)
    this.handleCheckboxChange = this.handleCheckboxChange.bind(this)
    this.reloadData = this.reloadData.bind(this)

    // call to action
    this.handleCancelButtonClick = this.handleCancelButtonClick.bind(this)
    this.handlePopulateButtonClick = this.handlePopulateButtonClick.bind(this)
  }

  componentDidMount () {

    // cancel on esc key
    $(document).keyup((e) => {
      if (e.keyCode === 27) {
        Utils.callPlugin('cancel')

      } else if (e.keyCode === 13) {

        // ignore enter key when selecting files
        if (!this.state.fileDialogOpen) {
          this.handlePopulateButtonClick()
        }
      }
    })
  }

  init (params) {

    // make sure that selected preset exists if needed
    if (params.presets && !params.presets.filter(preset => preset.path === (params.options.selectedPreset || {}).path).length) {
      params.options.selectedPreset = params.presets[0]
    }

    this.setState({
      viewOnly: params.viewOnly,
      fileDialogOpen: false,

      presets: params.presets,
      urlInvalid: false,

      jsonData: null,
      jsonDataInvalid: false,

      options: Object.assign({}, params.options, {
        [OPTIONS.POPULATE_TYPE]: Utils.getPropertyValue(params.options, OPTIONS.POPULATE_TYPE, null),
        [OPTIONS.RANDOMIZE_DATA]: Utils.getPropertyValue(params.options, OPTIONS.RANDOMIZE_DATA, true),
        [OPTIONS.TRIM_TEXT]: Utils.getPropertyValue(params.options, OPTIONS.TRIM_TEXT, true),
        [OPTIONS.INSERT_ELLIPSIS]: Utils.getPropertyValue(params.options, OPTIONS.INSERT_ELLIPSIS, true),
        [OPTIONS.DEFAULT_SUBSTITUTE]: Utils.getPropertyValue(params.options, OPTIONS.DEFAULT_SUBSTITUTE, ''),
        [OPTIONS.CREATE_GRID]: Utils.getPropertyValue(params.options, OPTIONS.CREATE_GRID, false),
        [OPTIONS.ROWS_COUNT]: Utils.getPropertyValue(params.options, OPTIONS.ROWS_COUNT, 2),
        [OPTIONS.ROWS_MARGIN]: Utils.getPropertyValue(params.options, OPTIONS.ROWS_MARGIN, 10),
        [OPTIONS.COLUMNS_COUNT]: Utils.getPropertyValue(params.options, OPTIONS.COLUMNS_COUNT, 2),
        [OPTIONS.COLUMNS_MARGIN]: Utils.getPropertyValue(params.options, OPTIONS.COLUMNS_MARGIN, 10),
        [OPTIONS.DATA_PATH]: Utils.getPropertyValue(params.options, OPTIONS.DATA_PATH, ''),
        [OPTIONS.HEADERS]: Utils.getPropertyValue(params.options, OPTIONS.HEADERS, []),
        [OPTIONS.URL]: Utils.getPropertyValue(params.options, OPTIONS.URL, ''),
        [OPTIONS.JSON_PATH]: Utils.getPropertyValue(params.options, OPTIONS.JSON_PATH, ''),
        [OPTIONS.SELECTED_PRESET]: Utils.getPropertyValue(params.options, OPTIONS.SELECTED_PRESET, null)
      })
    }, () => {

      // load initial data
      if (params.viewOnly) {
        this.setData(params.jsonData, true)

        if (this.state.options[OPTIONS.POPULATE_TYPE] === OPTIONS.POPULATE_TYPE_JSON) {
          $(document).trigger('setJSONFilePath', {
            path: this.state.options[OPTIONS.JSON_PATH]
          })
        }
      }
      else {
        this.reloadData()
      }

      // force update UI
      $(document).trigger('setTextFieldValue', {
        name: OPTIONS.DEFAULT_SUBSTITUTE,
        value: this.state.options[OPTIONS.DEFAULT_SUBSTITUTE]
      })
      $(document).trigger('setCheckboxValue', {
        name: OPTIONS.CREATE_GRID,
        value: this.state.options[OPTIONS.CREATE_GRID]
      })
      $(document).trigger('setTextFieldValue', {
        name: OPTIONS.ROWS_COUNT,
        value: this.state.options[OPTIONS.ROWS_COUNT]
      })
      $(document).trigger('setTextFieldValue', {
        name: OPTIONS.ROWS_MARGIN,
        value: this.state.options[OPTIONS.ROWS_MARGIN]
      })
      $(document).trigger('setTextFieldValue', {
        name: OPTIONS.COLUMNS_COUNT,
        value: this.state.options[OPTIONS.COLUMNS_COUNT]
      })
      $(document).trigger('setTextFieldValue', {
        name: OPTIONS.COLUMNS_MARGIN,
        value: this.state.options[OPTIONS.COLUMNS_MARGIN]
      })

      // show UI after a short delay
      // used to make sure that loading state is already visible
      setTimeout(() => {

        // show UI
        Utils.callPlugin('ready')

      }, 100)
    })
  }

  handlePresetsSelectChange (selectedPresetName) {

    let selectedPreset = this.state.presets.filter(preset => preset.name === selectedPresetName)[0]

    this.setState({
      loading: true,
      jsonData: null,
      options: Object.assign({}, this.state.options, {
        [OPTIONS.SELECTED_PRESET]: selectedPreset
      })
    }, () => {

      // call internal plugin handler to read file from disk
      Utils.callPlugin('readFile', {
        path: selectedPreset.path
      })
    })
  }

  handleJSONBrowse () {

    this.setState({
      fileDialogOpen: true
    })

    // ask for JSON file
    Utils.callPlugin('selectJSON', {
      path: this.state.options[OPTIONS.JSON_PATH]
    })
  }

  /**
   * Parses a JSON string and sets the resulting array/object as the current
   * JSON data for populating
   */
  setData (data, keepDataPath) {

    // parse raw data or keep existing object/array
    let jsonData
    let jsonDataInvalid = false
    if (typeof data === 'string') {
      try {
        jsonData = JSON.parse(data)
      } catch (e) {
        jsonData = null
        jsonDataInvalid = true
      }
    }
    else {
      jsonData = data
    }

    // create data path
    let dataPath = this.state.options[OPTIONS.DATA_PATH]
    if (!keepDataPath) {
      dataPath = Utils.getArrayStringAccessor(jsonData)
    }

    // if viewing only, data path is already applied
    if (!this.state.viewOnly) {

      // get nested object using data path
      try {
        jsonData = Utils.accessObjectByString(jsonData, dataPath)
      } catch (e) {
        jsonData = null
        jsonDataInvalid = true
      }

      if (!jsonData) {
        jsonDataInvalid = true
      }
    }

    // update state with new data and data path
    this.setState({
      jsonData,
      jsonDataInvalid,
      options: Object.assign({}, this.state.options, {
        [OPTIONS.DATA_PATH]: dataPath
      })
    }, () => {

      // force update UI
      $(document).trigger('reloadDataPreview')
      $(document).trigger('setTextFieldValue', {
        name: OPTIONS.DATA_PATH,
        value: dataPath
      })

      // stop loading
      setTimeout(() => {
        this.setState({
          loading: false,
          fileDialogOpen: false
        })
      }, 300)
    })
  }

  setJSONPath (path) {
    if (!path) return

    this.setState({
      options: Object.assign({}, this.state.options, {
        [OPTIONS.JSON_PATH]: path
      })
    }, () => {

      $(document).trigger('setJSONFilePath', {
        path
      })

      // read the json file
      Utils.callPlugin('readFile', {
        path
      })
    })
  }

  handleHeadersVisibilityChange (headersVisible) {
    this.setState({
      options: Object.assign({}, this.state.options, {
        [OPTIONS.HEADERS_VISIBLE]: headersVisible
      })
    })
  }

  handleLoadURLButtonClick () {
    this.reloadData()
  }

  handleAddHeaderButton () {

    let headers = this.state.options[OPTIONS.HEADERS]
    headers.push({
      name: '',
      value: ''
    })

    this.setState({
      options: Object.assign({}, this.state.options, {
        [OPTIONS.HEADERS]: headers
      })
    }, () => {
      $(document).trigger('scrollHeadersListToBottom')
    })
  }

  handleRemoveHeaderButton (index) {

    let headers = this.state.options[OPTIONS.HEADERS]
    headers.splice(index, 1)

    this.setState({
      options: Object.assign({}, this.state.options, {
        [OPTIONS.HEADERS]: headers
      })
    }, () => {
      for (let i = 0; i < this.state.options[OPTIONS.HEADERS].length; i++) {
        $(document).trigger('setTextFieldValue', {
          name: i + '/name',
          value: this.state.options[OPTIONS.HEADERS][i]['name']
        })
        $(document).trigger('setTextFieldValue', {
          name: i + '/value',
          value: this.state.options[OPTIONS.HEADERS][i]['value']
        })
      }
    })
  }

  handleHeadersChange (name, value) {

    // set new header value
    let index = name.split('/')[0]
    let type = name.split('/')[1]
    let newOptions = Object.assign({}, this.state.options)
    newOptions[OPTIONS.HEADERS][index][type] = value
    this.setState({
      options: newOptions
    })
  }

  handleTextFieldChange (key, value) {
    this.setState({
      options: Object.assign({}, this.state.options, {
        [key]: (isNaN(value) || !value.length) ? String(value) : Number(value)
      })
    })
  }

  handleCheckboxChange (key, checked) {
    this.setState({
      options: Object.assign({}, this.state.options, {
        [key]: !!checked
      })
    })
  }

  reloadData (keepDataPath) {

    if (this.state.options[OPTIONS.POPULATE_TYPE] === OPTIONS.POPULATE_TYPE_PRESET) {
      if (!this.state.options[OPTIONS.SELECTED_PRESET]) return

      this.setState({
        loading: true
      })

      // reload preset file from disk
      Utils.callPlugin('readFile', {
        path: this.state.options[OPTIONS.SELECTED_PRESET].path,
        keepDataPath: keepDataPath
      })

    } else if (this.state.options[OPTIONS.POPULATE_TYPE] === OPTIONS.POPULATE_TYPE_JSON) {
      if (!this.state.options[OPTIONS.JSON_PATH]) return

      this.setState({
        loading: true
      })

      // reload json file from disk
      Utils.callPlugin('readFile', {
        path: this.state.options[OPTIONS.JSON_PATH],
        keepDataPath: keepDataPath
      })

      $(document).trigger('setJSONFilePath', {
        path: this.state.options[OPTIONS.JSON_PATH]
      })

    } else if (this.state.options[OPTIONS.POPULATE_TYPE] === OPTIONS.POPULATE_TYPE_URL) {
      if (!this.state.options[OPTIONS.URL]) return

      this.setState({
        loading: true
      })

      // create an object from all headers
      let headers = {}
      for (let i = 0; i < this.state.options[OPTIONS.HEADERS].length; i++) {
        let header = this.state.options[OPTIONS.HEADERS][i]
        if (header.name && header.value) headers[header.name] = header.value
      }

      // get data from url
      global.fetch(this.state.options[OPTIONS.URL], {
        headers
      }).then(response => response.json()).then(data => {

        // set the downloaded data
        this.setData(data, keepDataPath)

      }).catch(() => {
        this.setData(null, keepDataPath)
      })
    }
  }

  handleCancelButtonClick () {
    Utils.callPlugin('cancel')
  }

  handlePopulateButtonClick () {
    if (this.state.loading || !this.state.jsonData || this.state.jsonDataInvalid) return

    // confirm configuration and populate with the current data
    Utils.callPlugin('confirm', {
      options: this.state.options,
      data: this.state.jsonData
    })
  }

  render () {

    // select title and description for populate type
    let title
    let description

    if (this.state.viewOnly) {
      title = Strings(STRINGS.LAST_USED_DATA_TITLE)
      description = Strings(STRINGS.LAST_USED_DATA_DESCRIPTION)
    }
    else {

      switch (this.state.options[OPTIONS.POPULATE_TYPE]) {

        case OPTIONS.POPULATE_TYPE_PRESET: {
          title = Strings(STRINGS.POPULATE_WITH_PRESET_TITLE)
          description = Strings(STRINGS.POPULATE_WITH_PRESET_DESCRIPTION)
          break
        }

        case OPTIONS.POPULATE_TYPE_JSON: {
          title = Strings(STRINGS.POPULATE_WITH_JSON_TITLE)
          description = Strings(STRINGS.POPULATE_WITH_JSON_DESCRIPTION)
          break
        }

        case OPTIONS.POPULATE_TYPE_URL: {
          title = Strings(STRINGS.POPULATE_FROM_URL_TITLE)
          description = Strings(STRINGS.POPULATE_FROM_URL_DESCRIPTION)
          break
        }
      }
    }

    return (
      <div className='root'>

        <div className='page'>

          <div className='left'>
            <Title title={title} description={description} />

            <div className='content'>

              {this.state.options[OPTIONS.POPULATE_TYPE] === OPTIONS.POPULATE_TYPE_PRESET ? (
                <div>
                  <Title subTitle title={Strings(STRINGS.PRESET)} />

                  {!this.state.viewOnly ? (
                    <Select data={this.state.presets.map(preset => preset.name)} selected={(this.state.options[OPTIONS.SELECTED_PRESET] || {}).name} handleChange={this.handlePresetsSelectChange} />
                  ) : (
                    <TextField readOnly value={(this.state.options[OPTIONS.SELECTED_PRESET] || {}).name} />
                  )}
                </div>
              ) : ''}

              {this.state.options[OPTIONS.POPULATE_TYPE] === OPTIONS.POPULATE_TYPE_JSON ? (
                <div>
                  <Title subTitle title={Strings(STRINGS.JSON_FILE)} />
                  <FileBrowseField readOnly={this.state.viewOnly} accept='.json,application/json' file={this.state.jsonFile} onClick={this.handleJSONBrowse} />
                </div>
              ) : ''}

              {this.state.options[OPTIONS.POPULATE_TYPE] === OPTIONS.POPULATE_TYPE_URL ? (
                <URLGroup
                  readOnly={this.state.viewOnly}
                  urlValue={this.state.options[OPTIONS.URL]}
                  handleURLChange={this.handleTextFieldChange}
                  headers={this.state.options[OPTIONS.HEADERS]}
                  headersVisible={this.state.options[OPTIONS.HEADERS_VISIBLE]}
                  handleAddHeaderButton={this.handleAddHeaderButton}
                  handleRemoveHeaderButton={this.handleRemoveHeaderButton}
                  handleHeadersChange={this.handleHeadersChange}
                  handleHeadersVisibilityChange={this.handleHeadersVisibilityChange}
                  handleLoadURLButtonClick={this.handleLoadURLButtonClick} />
              ) : ''}

              <Title subTitle title={Strings(STRINGS.DATA_PATH)} description={Strings(STRINGS.DATA_PATH_HELP_TEXT)} />
              <TextField readOnly={this.state.viewOnly} name={OPTIONS.DATA_PATH} placeholder={Strings(STRINGS.DATA_PATH_PLACEHOLDER)} value={this.state.options[OPTIONS.DATA_PATH] || ''} handleChange={this.handleTextFieldChange} />

              <Title subTitle title={Strings(STRINGS.DATA_OPTIONS)} />
              <Checkbox readOnly={this.state.viewOnly} name={OPTIONS.RANDOMIZE_DATA} label={Strings(STRINGS.RANDOMIZE_DATA_ORDER)} checked={this.state.options[OPTIONS.RANDOMIZE_DATA]} handleChange={this.handleCheckboxChange} />
              <Checkbox readOnly={this.state.viewOnly} name={OPTIONS.TRIM_TEXT} label={Strings(STRINGS.TRIM_TEXT)} checked={this.state.options[OPTIONS.TRIM_TEXT]} handleChange={this.handleCheckboxChange} />
              <Checkbox readOnly={this.state.viewOnly} marginBottom name={OPTIONS.INSERT_ELLIPSIS} label={Strings(STRINGS.INSERT_ELLIPSIS)} checked={this.state.options[OPTIONS.INSERT_ELLIPSIS]} handleChange={this.handleCheckboxChange} />

              <Title subTitle title={Strings(STRINGS.DEFAULT_SUBSTITUTE)} description={Strings(STRINGS.DEFAULT_SUBSTITUTE_HELP_TEXT)} />
              <TextField readOnly={this.state.viewOnly} name={OPTIONS.DEFAULT_SUBSTITUTE} placeholder={Strings(STRINGS.DEFAULT_SUBSTITUTE_PLACEHOLDER)} value={this.state.options[OPTIONS.DEFAULT_SUBSTITUTE]} handleChange={this.handleTextFieldChange} />

              <Title subTitle title={Strings(STRINGS.LAYOUT_OPTIONS)} />
              <Checkbox style={{ marginBottom: 6 }} readOnly={this.state.viewOnly} name={OPTIONS.CREATE_GRID} label={Strings(STRINGS.CREATE_GRID)} checked={this.state.options[OPTIONS.CREATE_GRID]} handleChange={this.handleCheckboxChange} />
              <LayoutOptionsTextFieldBlock
                readOnly={this.state.viewOnly}
                rows={this.state.options[OPTIONS.ROWS_COUNT]}
                rowsMargin={this.state.options[OPTIONS.ROWS_MARGIN]}
                columns={this.state.options[OPTIONS.COLUMNS_COUNT]}
                columnsMargin={this.state.options[OPTIONS.COLUMNS_MARGIN]}
                handleTextFieldChange={this.handleTextFieldChange} />

            </div>

          </div>

          <div className='right'>
            <DataPreview
              type={this.state.options[OPTIONS.POPULATE_TYPE]}
              data={this.state.jsonData}
              invalidData={this.state.jsonDataInvalid}
              invalidURL={this.state.urlInvalid}
              loading={this.state.loading} />

            {!this.state.viewOnly ? (
              <Button blue small text={Strings(STRINGS.RELOAD)} style={{ position: 'absolute', top: 20, right: 20 }} handleClick={() => this.reloadData(true)} />
            ) : ''}

            <div className='footer'>
              <div className='button-container'>

                {!this.state.viewOnly ? (
                  <div>
                    <Button text={Strings(STRINGS.CANCEL)} style={{ marginRight: 12 }} handleClick={this.handleCancelButtonClick} />
                    <Button disabled={this.state.loading || this.state.jsonDataInvalid || !this.state.jsonData} blue text={Strings(STRINGS.POPULATE)} handleClick={this.handlePopulateButtonClick} />
                  </div>
                ) : (
                  <Button blue text={Strings(STRINGS.OK)} handleClick={this.handleCancelButtonClick} />
                )}
              </div>
            </div>

          </div>

        </div>

      </div>
    )
  }
}

export default Root
