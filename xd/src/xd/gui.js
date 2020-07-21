/**
 * Gui
 *
 * Provides functionality to create various user interface components.
 */

import log from '@data-populator/core/log'
import Options, * as OPTIONS from './options'
import Strings, * as STRINGS from '@data-populator/core/strings'
import * as Data from './data'
import * as Utils from './utils'

const fs = require('uxp').storage.localFileSystem

/**
 * Creates and shows the complete dialog used when running populate commands and
 * returns the configuration selected by the user.
 *
 * @param {String} type
 * @param {Object} options
 * @param {Object} data
 * @returns {String}
 */
export async function showPopulatorDialog(type, options, data) {
  return new Promise(async (resolve, reject) => {
    let config = {}
    if (type === 'preset') {
      config.title = Strings(STRINGS.POPULATE_WITH_PRESET_TITLE)
      config.description = Strings(STRINGS.POPULATE_WITH_PRESET_DESCRIPTION)
      config.presetSegment = `
      ${getSubTitleSegment(Strings(STRINGS.PRESET))}
      <input type="text" class="hidden" autofocus="true"/>
      <label class="select-container">
        <select id="preset-select">
          ${data.presets.map(
            (preset, i) =>
              '(<option value="' +
              i +
              '">' +
              data.paths[preset.nativePath].split(`presets${global.pathSeparator}`)[1] +
              '</option>)'
          )}
        </select>
      </label>
      `
    } else if (type === 'JSON') {
      config.title = Strings(STRINGS.POPULATE_WITH_JSON_TITLE)
      config.description = Strings(STRINGS.POPULATE_WITH_JSON_DESCRIPTION)
      config.JSONSegment = `
      ${getSubTitleSegment(Strings(STRINGS.JSON_FILE))}
      <input type="text" class="hidden" autofocus="true"/>
      <label class="input-container">
        <input readonly="true" id="json-file-input" type="text" />
        <button id="json-file-browse-button">Browse</button>
      </label>
      `
    } else if (type === 'JSONURL') {
      config.title = Strings(STRINGS.POPULATE_FROM_URL_TITLE)
      config.description = Strings(STRINGS.POPULATE_FROM_URL_DESCRIPTION)
      config.JSONURLSegment = `
        <div class="sub-title-container">
          <span>${Strings(STRINGS.URL)}</span>
          <div id="show-additional-options-button"></div>
        </div>

        <div class="additional-options">
          ${getSubTitleSegment(Strings(STRINGS.HEADERS))}
          <label class="headers-container"></label>
          <button id="add-header-button">${Strings(STRINGS.ADD)}</button>
        </div>

        <label class="input-container">
          <input id="json-url-input" class="load" placeholder="${Strings(
            STRINGS.URL_PLACEHOLDER
          )}" type="text" />
          <button id="json-url-load-button" uxp-variant="cta">${Strings(STRINGS.LOAD)}</button>
        </label>
      `
    }

    document.body.innerHTML = `
    <style>
      ${getPopulatorUIStyles()}
      ${getJSONStyles()}
    </style>
    <dialog id="dialog">
      <form method="dialog">

        <div class="left-right-container">

          <div class="left">
            ${getTitleSegment(config.title, config.description)}
            
            <div class="content-left">
              ${type === 'preset' ? config.presetSegment : ''}
              ${type === 'JSON' ? config.JSONSegment : ''}
              ${type === 'JSONURL' ? config.JSONURLSegment : ''}

              ${getSubTitleSegment(
                Strings(STRINGS.DATA_PATH),
                Strings(STRINGS.DATA_PATH_HELP_TEXT)
              )}
              <label class="input-container">
                <input id="json-key-input" placeholder="${Strings(
                  STRINGS.DATA_PATH_PLACEHOLDER
                )}" type="text"/>
              </label>

              ${getSubTitleSegment(Strings(STRINGS.DATA_OPTIONS))}
              <label class="row">
                <input type="checkbox" id="randomize-data-checkbox" checked="false" />
                <span>${Strings(STRINGS.RANDOMIZE_DATA_ORDER)}</span>
              </label>
              <label class="row">
                <input type="checkbox" id="trim-text-checkbox" checked="false" />
                <span>${Strings(STRINGS.TRIM_TEXT)}</span>
              </label>
              <label class="row is-last">
                <input type="checkbox" id="insert-ellipsis-checkbox" checked="false" />
                <span>${Strings(STRINGS.INSERT_ELLIPSIS)}</span>
              </label>

              ${getSubTitleSegment(
                Strings(STRINGS.DEFAULT_SUBSTITUTE),
                Strings(STRINGS.DEFAULT_SUBSTITUTE_HELP_TEXT)
              )}
              <label class="input-container">
                <input id="default-substitute-input" placeholder="${Strings(
                  STRINGS.DEFAULT_SUBSTITUTE_PLACEHOLDER
                )}" type="text"/>
              </label>
            </div>
          </div>

          <div class="right">
            ${getJSONPreviewSegment(true, true, true, false)}
          </div>

        </div>

      </form>
    </dialog>
    `
    let cancel = false
    let populate = false

    // get references to elements
    const dialog = document.getElementById('dialog')
    const questionMarks = document.getElementsByClassName('question-mark')

    let presetSelect
    if (type === 'preset') presetSelect = document.getElementById('preset-select')

    let JSONFileInput, JSONFileBrowseButton
    let JSONFile = {}
    if (type === 'JSON') {
      JSONFileInput = document.getElementById('json-file-input')
      JSONFileBrowseButton = document.getElementById('json-file-browse-button')
    }

    let showAdditionalOptionsButton, JSONURLInput, addHeaderButton, JSONURLLoadButton
    let headers = {}
    let showAdditionalOptions
    if (type === 'JSONURL') {
      showAdditionalOptionsButton = document.getElementById('show-additional-options-button')
      JSONURLInput = document.getElementById('json-url-input')
      addHeaderButton = document.getElementById('add-header-button')
      JSONURLLoadButton = document.getElementById('json-url-load-button')
    }

    const JSONKeyInput = document.getElementById('json-key-input')

    const JSONPreviewReloadButton = document.getElementById('json-preview-reload-button')
    const JSONPreviewDIV = document.getElementById('json-preview-div')

    const randomizeDataCheckbox = document.getElementById('randomize-data-checkbox')
    const trimTextCheckbox = document.getElementById('trim-text-checkbox')
    const insertEllipsisCheckbox = document.getElementById('insert-ellipsis-checkbox')
    const defaultSubstituteInput = document.getElementById('default-substitute-input')

    const cancelButton = document.getElementById('cancel-button')
    const populateButton = document.getElementById('populate-button')

    // set initial values
    JSONKeyInput.value = data.lastUsedJSONKey
    if (type === 'preset') {
      let setPresetSelectValue = false
      for (let i = 0; i < data.presets.length; i++) {
        if (data.presets[i].nativePath.indexOf(data.lastUsedPath) > -1) {
          presetSelect.value = i
          setPresetSelectValue = true
          break
        }
      }
      if (!setPresetSelectValue) {
        presetSelect.value = 0
      }

      let path = data.paths[data.presets[presetSelect.value].nativePath]
      updateJSONPreviewPreset(path, false)
    } else if (type === 'JSON') {
      updateJSONPreviewJSONFile(false, false)
    } else if (type === 'JSONURL') {
      let url = data.lastUsedUrl
      JSONURLInput.value = url

      showAdditionalOptions = data.showAdditionalOptions
      let additionalOptionsDiv = document.getElementsByClassName('additional-options')[0]
      if (showAdditionalOptions) {
        additionalOptionsDiv.style.display = 'block'
      } else {
        additionalOptionsDiv.style.display = 'hidden'
      }

      headers = data.lastUsedHeaders
      let headersContainer = document.getElementsByClassName('headers-container')[0]
      for (const [key, value] of Object.entries(headers)) {
        if (key !== 'X-Product') {
          let headerElem = createHeaderElement(key, value)
          headersContainer.appendChild(headerElem)
        }
      }

      updateJSONPreviewJSONURL(url)
    }

    randomizeDataCheckbox.checked = options[OPTIONS.RANDOMIZE_DATA]
    trimTextCheckbox.checked = options[OPTIONS.TRIM_TEXT]
    insertEllipsisCheckbox.checked = options[OPTIONS.INSERT_ELLIPSIS]
    defaultSubstituteInput.value = options[OPTIONS.DEFAULT_SUBSTITUTE]

    // add event listeners
    document.getElementsByTagName('form')[0].addEventListener('submit', () => {
      submitForm()
    })

    document.getElementsByTagName('form')[0].addEventListener('keydown', e => {
      if (e.keyCode === 27) {
        document
          .getElementsByTagName('form')[0]
          .removeChild(document.getElementsByClassName('left-right-container')[0])
        reject(new Error(Strings(STRINGS.CLOSED_DIALOG_WITH_ESC_KEY)))
      }
    })

    for (let i = 0; i < questionMarks.length; i++) {
      questionMarks[i].addEventListener('pointerenter', e => {
        questionMarkEnterHandler(e)
      })
      questionMarks[i].addEventListener('pointerleave', e => {
        questionMarkLeaveHandler(e)
      })
    }

    if (type === 'preset') {
      presetSelect.addEventListener('change', async () => {
        let path = data.paths[data.presets[presetSelect.value].nativePath]
        updateJSONPreviewPreset(path, true)
      })
    } else if (type === 'JSON') {
      JSONFileBrowseButton.addEventListener('click', async () => {
        const file = await fs.getFileForOpening({
          types: ['json']
        })

        if (file && file.length !== 0) updateJSONPreviewJSONFile(file, true)
      })
    } else if (type === 'JSONURL') {
      showAdditionalOptionsButton.addEventListener('click', () => {
        let additionalOptions = document.getElementsByClassName('additional-options')[0]
        if (additionalOptions.style.display === 'block') {
          additionalOptions.style.display = 'none'
          showAdditionalOptions = false
        } else {
          additionalOptions.style.display = 'block'
          showAdditionalOptions = true
        }
      })

      addHeaderButton.addEventListener('click', () => {
        let headersContainer = document.getElementsByClassName('headers-container')[0]
        let headerElem = createHeaderElement()
        headersContainer.appendChild(headerElem)
        headerElem.getElementsByTagName('input')[0].focus()
      })

      JSONURLLoadButton.addEventListener('click', () => {
        let url = JSONURLInput.value
        updateJSONPreviewJSONURL(url, true)
      })
    }

    JSONPreviewReloadButton.addEventListener('click', reloadData)
    cancelButton.addEventListener('click', () => {
      cancel = true
      dialog.close()

      document
        .getElementsByTagName('form')[0]
        .removeChild(document.getElementsByClassName('left-right-container')[0])

      reject(new Error(Strings(STRINGS.CLICKED_CANCEL_BUTTON)))
    })
    populateButton.addEventListener('click', () => {
      submitForm()
    })

    // show modal
    try {
      await dialog.showModal()
    } catch (e) {
    } finally {
      if (!cancel && !populate) {
        document
          .getElementsByTagName('form')[0]
          .removeChild(document.getElementsByClassName('left-right-container')[0])

        log(Strings(STRINGS.CLOSED_DIALOG_WITH_ESC_KEY))
        reject(new Error(Strings(STRINGS.CLOSED_DIALOG_WITH_ESC_KEY)))
      }
      dialog.remove()
    }

    async function reloadData() {
      if (type === 'preset') {
        let path = data.paths[data.presets[presetSelect.value].nativePath]
        updateJSONPreviewPreset(path, false)
      } else if (type === 'JSON') {
        updateJSONPreviewJSONFile(JSONFile.file !== undefined ? JSONFile.file : false, false)
      } else if (type === 'JSONURL') {
        let url = JSONURLInput.value
        updateJSONPreviewJSONURL(url, false)
      }
    }

    // update preset preview
    async function updateJSONPreviewPreset(path, newSelection) {
      showDataPreviewLoadingIndicator(JSONPreviewDIV)

      let key = JSONKeyInput.value
      let jsonData
      try {
        jsonData = JSON.parse(await Data.loadFileWithPathInDataFolder(path))
        if (newSelection) {
          JSONKeyInput.value = Utils.getArrayStringAccessor(jsonData)
          key = JSONKeyInput.value
        }

        jsonData = Utils.accessObjectByString(jsonData, key)
      } catch (e) {
        log(e)
        showDataPreviewError(JSONPreviewDIV, Strings(STRINGS.INVALID_JSON_FILE))
      }
      getJSONPreview(jsonData, submitForm)
    }

    // update json preview
    async function updateJSONPreviewJSONFile(file, newSelection) {
      showDataPreviewLoadingIndicator(JSONPreviewDIV)

      // if (file) {
      //   enableReloadButton(reloadData)
      // } else {
      //   disableReloadButton()
      // }

      let key = JSONKeyInput.value
      if (file !== false) {
        let jsonData, nativePath
        try {
          jsonData = JSON.parse(await file.read())
        } catch (e) {
          log(e)
          showDataPreviewError(JSONPreviewDIV, Strings(STRINGS.INVALID_JSON_FILE))
        }

        if (newSelection) {
          JSONKeyInput.value = Utils.getArrayStringAccessor(jsonData)
          key = JSONKeyInput.value
        }

        let jsonPreviewData
        try {
          jsonPreviewData = Utils.accessObjectByString(jsonData, key)
        } catch (e) {
          log(e)
          showDataPreviewError(JSONPreviewDIV, Strings(STRINGS.INVALID_JSON_FILE))
        }
        nativePath = file.nativePath

        JSONFileInput.value = nativePath.split(global.pathSeparator)[
          nativePath.split(global.pathSeparator).length - 1
        ]
        getJSONPreview(jsonPreviewData, submitForm)

        JSONFile.nativePath = nativePath
        JSONFile.json = jsonData
        JSONFile.file = file
      } else {
        if (JSONFile.hasOwnProperty('nativePath') && JSONFile.hasOwnProperty('json')) {
          let nativePath = JSONFile.nativePath
          let jsonData = JSONFile.json

          let jsonPreviewData
          try {
            jsonPreviewData = Utils.accessObjectByString(jsonData, key)
          } catch (e) {
            log(e)
            showDataPreviewError(JSONPreviewDIV, Strings(STRINGS.INVALID_JSON_FILE))
          }

          JSONFileInput.value = nativePath.split(global.pathSeparator)[
            nativePath.split(global.pathSeparator).length - 1
          ]
          getJSONPreview(jsonPreviewData, submitForm)

          JSONFile.nativePath = nativePath
          JSONFile.json = jsonData
        } else if (
          data.lastUsedJSONFile.hasOwnProperty('nativePath') &&
          data.lastUsedJSONFile.hasOwnProperty('json')
        ) {
          let nativePath = data.lastUsedJSONFile.nativePath
          let jsonData = data.lastUsedJSONFile.json

          let jsonPreviewData
          try {
            jsonPreviewData = Utils.accessObjectByString(jsonData, key)
          } catch (e) {
            log(e)
            showDataPreviewError(JSONPreviewDIV, Strings(STRINGS.INVALID_JSON_FILE))
          }

          JSONFileInput.value = nativePath.split(global.pathSeparator)[
            nativePath.split(global.pathSeparator).length - 1
          ]
          getJSONPreview(jsonPreviewData, submitForm)

          JSONFile.nativePath = nativePath
          JSONFile.json = jsonData
        } else {
          showDataPreviewError(JSONPreviewDIV, Strings(STRINGS.NO_FILE_SELECTED))
        }
      }
    }

    // update json url preview
    async function updateJSONPreviewJSONURL(url, load) {
      showDataPreviewLoadingIndicator(JSONPreviewDIV)

      let key = JSONKeyInput.value
      if (url && Utils.isValidURL(url)) {
        let jsonData
        try {
          updateHeaders()

          jsonData = await global
            .fetch(url, {
              headers
            })
            .then(response => response.json())

          if (load) {
            JSONKeyInput.value = Utils.getArrayStringAccessor(jsonData)
            key = JSONKeyInput.value
          }

          jsonData = Utils.accessObjectByString(jsonData, key)
        } catch (e) {
          log(e)
          showDataPreviewError(JSONPreviewDIV, Strings(STRINGS.INVALID_JSON_FILE))
        }
        getJSONPreview(jsonData, submitForm)
      } else {
        if (!url) showDataPreviewError(JSONPreviewDIV, Strings(STRINGS.NO_URL_ENTERED))
        else if (!Utils.isValidURL(url))
          showDataPreviewError(JSONPreviewDIV, Strings(STRINGS.INVALID_URL))
      }
    }

    // update headers
    function updateHeaders() {
      let headersContainer = document.getElementsByClassName('headers-container')[0]
      let headerElems = headersContainer.getElementsByClassName('header')

      headers = {}
      headers['X-Product'] = 'Data Populator XD'
      for (let i = 0; i < headerElems.length; i++) {
        let headerNameElem = headerElems[i].getElementsByClassName('header-name')[0]
        let headerValueElem = headerElems[i].getElementsByClassName('header-value')[0]
        if (headerNameElem.value && headerValueElem.value)
          headers[headerNameElem.value] = headerValueElem.value
      }
    }

    // submit form
    async function submitForm() {
      populate = true

      await Options({
        [OPTIONS.RANDOMIZE_DATA]: randomizeDataCheckbox.checked,
        [OPTIONS.TRIM_TEXT]: trimTextCheckbox.checked,
        [OPTIONS.INSERT_ELLIPSIS]: insertEllipsisCheckbox.checked,
        [OPTIONS.DEFAULT_SUBSTITUTE]: defaultSubstituteInput.value
      })

      dialog.close()

      if (type === 'preset') {
        resolve({
          path: data.paths[data.presets[presetSelect.value].nativePath],
          key: JSONKeyInput.value
        })
      } else if (type === 'JSON') {
        resolve({
          file: JSONFile,
          key: JSONKeyInput.value
        })
      } else if (type === 'JSONURL') {
        updateHeaders()
        resolve({
          url: JSONURLInput.value,
          key: JSONKeyInput.value,
          headers: headers,
          showAdditionalOptions: showAdditionalOptions
        })
      }
    }
  })
}

function showDataPreviewLoadingIndicator(previewDIV) {
  previewDIV.className = 'has-overlay'
  previewDIV.innerHTML = ''

  let overlayContainer = document.createElement('div')
  overlayContainer.className = 'overlay-container'

  let overlayContent = document.createElement('div')
  overlayContent.className = 'overlay-content'

  let spinner = document.createElement('div')
  spinner.className = 'spinner'
  overlayContent.appendChild(spinner)

  let text = document.createElement('span')
  text.className = 'loading'
  text.textContent = Strings(STRINGS.LOADING_DATA)
  overlayContent.appendChild(text)

  overlayContainer.appendChild(overlayContent)
  previewDIV.appendChild(overlayContainer)
}

function enablePopulateButton(submitForm) {
  if (document.getElementById('populate-button')) {
    document.getElementById(
      'populate-button'
    ).outerHTML = `<button id="populate-button" uxp-variant="cta">${Strings(
      STRINGS.POPULATE
    )}</button>`

    if (submitForm) {
      const populateButton = document.getElementById('populate-button')
      populateButton.addEventListener('click', () => {
        submitForm()
      })
    }
  }
}

function disablePopulateButton() {
  document.getElementById(
    'populate-button'
  ).outerHTML = `<button id="populate-button" disabled="true" uxp-variant="cta">${Strings(
    STRINGS.POPULATE
  )}</button>`
}

function disableReloadButton() {
  document.getElementById(
    'json-preview-reload-button'
  ).outerHTML = `<button id="json-preview-reload-button" disabled="true" uxp-variant="cta">${Strings(
    STRINGS.RELOAD
  )}</button>`
}

function enableReloadButton(reloadData) {
  document.getElementById(
    'json-preview-reload-button'
  ).outerHTML = `<button id="json-preview-reload-button" uxp-variant="cta">${Strings(
    STRINGS.RELOAD
  )}</button>`

  if (reloadData) {
    const reloadButton = document.getElementById('json-preview-reload-button')
    reloadButton.addEventListener('click', () => {
      reloadData()
    })
  }
}

function showDataPreviewError(previewDIV, message) {
  previewDIV.className = 'has-overlay'
  previewDIV.innerHTML = ''

  let overlayContainer = document.createElement('div')
  overlayContainer.className = 'overlay-container'

  let overlayContent = document.createElement('div')
  overlayContent.className = 'overlay-content'

  let text = document.createElement('span')
  text.textContent = message
  overlayContent.appendChild(text)

  overlayContainer.appendChild(overlayContent)
  previewDIV.appendChild(overlayContainer)

  disablePopulateButton()
}

function questionMarkEnterHandler(e) {
  let questionMark = e.target
  let leftRightContainer = document.getElementsByClassName('left-right-container')[0]
  let tooltipText = questionMark.parentNode.getElementsByClassName('p-description')[0].innerHTML

  let tooltipElem = document.createElement('div')
  tooltipElem.className = 'tooltip'
  tooltipElem.textContent = tooltipText

  tooltipElem.style.left = questionMark.offsetLeft + 20 + 16 + 8
  tooltipElem.style.top = questionMark.parentNode.offsetTop - 5

  leftRightContainer.appendChild(tooltipElem)
}

function questionMarkLeaveHandler(e) {
  let leftRightContainer = document.getElementsByClassName('left-right-container')[0]

  let tooltipElem = leftRightContainer.getElementsByClassName('tooltip')[0]
  leftRightContainer.removeChild(tooltipElem)
}

function createHeaderElement(key, value, viewActiveConfig) {
  let headersContainer = document.getElementsByClassName('headers-container')[0]
  updateHeaderContainerHeight(true)

  let header = document.createElement('div')
  header.className = 'header'

  let nameInput = document.createElement('input')
  nameInput.className = 'header-name'
  nameInput.type = 'text'
  nameInput.placeholder = Strings(STRINGS.NAME)
  if (key) nameInput.value = key
  if (viewActiveConfig) nameInput.readOnly = true

  let valueInput = document.createElement('input')
  valueInput.className = 'header-value'
  valueInput.type = 'text'
  valueInput.placeholder = Strings(STRINGS.VALUE)
  if (value) valueInput.value = value
  if (viewActiveConfig) valueInput.readOnly = true

  header.appendChild(nameInput)
  header.appendChild(valueInput)

  if (!viewActiveConfig) {
    let removeHeaderButton = document.createElement('button')
    removeHeaderButton.className = 'remove-header-button'
    removeHeaderButton.textContent = Strings(STRINGS.REMOVE)
    removeHeaderButton.addEventListener('click', e => {
      headersContainer.removeChild(header)

      updateHeaderContainerHeight()
    })

    header.appendChild(removeHeaderButton)
  }

  return header
}

function updateHeaderContainerHeight(add) {
  let headersContainer = document.getElementsByClassName('headers-container')[0]
  let existingHeaders = headersContainer.getElementsByClassName('header')

  let length = existingHeaders.length
  if (add) {
    length++
  }

  headersContainer.scrollTop = headersContainer.scrollHeight
}

function getPopulatorUIStyles() {
  return `
  #dialog {
    padding: 0;
    margin: 0;
  }
  #dialog form {
    position: relative;
    width: 868px;
    padding: 0;
    margin: 0;
  }

  .left-right-container {
    padding: 0;
    margin: 0;

    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
  }
  .left, .right {
    position: relative;
    margin: 0;
    padding: 0;
  }
  .left {
    width: 368px;
    height: 655px;

    border-right: 1px solid #EAEAEA;
    background-color: #F7F7F7;

    display: flex;
    flex-direction: column;
  }
  .right {
    width: 500px;
    height: 655px;

    background-color: #FBFBFB;
  }

  .content-left {
    padding: 20px;

    flex: 1;
    overflow-y: auto;
  }

  .title-container {
    width: 100%;
    border-bottom: 1px solid #EAEAEA;

    padding: 20px;
    margin: 0;

    display: flex;
    flex-direction: column;
  }
  .title-container span.h1-title {
    margin: 0;
    padding: 0;
    margin-bottom: 8px;

    color: #2C2C2C;
    font-size: 18px !important;
    line-height: 16px;
    font-weight: 600;
  }
  .title-container span.p-description {
    margin: 0;
    padding: 0;

    color: #777 !important;
    font-size: 12px !important;
    line-height: 16px;
  }

  .sub-title-container {
    height: 16px;

    padding: 0;
    margin: 0;
    position: relative;

    margin-bottom: 8px;

    display: flex;
    flex-direction: row;
    align-items: center;
  }
  .sub-title-container.no-margin {
    margin-bottom: 0;
  }
  .sub-title-container span {
    margin: 0;
    padding: 0;

    color: #777 !important;
    font-size: 12px !important;
    line-height: 16px;
    font-weight: 500;
  }

  .sub-title-container div.question-mark {
    padding: 0;
    margin: 0;
    margin-left: 8px;

    width: 16px;
    height: 16px;

    border-radius: 50%;
    border: 2px solid #BBB;

    color: #AAA;
    font-size: 10px !important;
    line-height: 12px;
    font-weight: 500;
    text-align: center;
  }
  .sub-title-container div.question-mark:hover {
    border: 2px solid #AAA;
    color: #999;
  }
  .sub-title-container span.p-description {
    display: none;
  }

  div.tooltip {
    position: absolute;
    z-index: 1;

    max-width: 400px;
    background-color: #F7F7F7;
    padding: 5px 8px;
    border-radius: 5px;

    color: #777 !important;
    font-size: 12px !important;
    line-height: 16px;

    border: 1px solid #DEDEDE;
  }

  .select-container {
    padding: 0;
    margin: 0;
    margin-bottom: 20px;

    display: flex;
    flex-direction: row;
    align-items: center;
  }
  select {
    width: 100%;

    padding: 0;
    margin: 0;
  }

  .input-container {
    padding: 0;
    margin: 0;
    margin-bottom: 20px;

    height: 24px;

    display: flex;
    flex-direction: row;
    align-items: center;
  }
  input[type="text"] {
    width: 100%;

    padding: 0;
    margin: 0;
  }
  input#json-file-input,
  input#json-url-input.load {
    flex: 1;
    margin-right: 8px;
  }
  button#json-file-browse-button {
    padding: 0;
    margin: 0;
  }
  
  .sub-title-container #show-additional-options-button {
    padding: 0;
    margin: 0;
    margin-left: 8px;

    width: 16px;
    height: 16px;

    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABGdBTUEAALGPC/xhBQAABQxJREFUWAntl0tonFUUx2cmk0yoEJQQMEaSZhFrm2J8BFtJQPIqqAsfG6UKPtoYVxrsQgRraRWs2ErFjaGRVkxSVyKoVMhLIdVCUzXCBDVITWiIREJKJJLXJP7+N/eM3zwyMQtXeuHOPY//eXznnnu/b0Kh//oIb7UAY2NjsfHx8fvC4XB+0HZtbW25oqLifFVV1WJQvhkd3QyQrp+YmHiEYD3MdFUI3X6E5zIUOQSRHLqsqtXV1R1ZFQhz6Tay2XICOKoyZ5FIZD9b8YTxQV1AlpPMmgDljQwMDOxhzQtaDw4ORgm4WzLWyaampnPNzc3dsL972W5hRNuQj/7+/rvl02TBNWsT9vb2vgLoNQXBsLOgoOD95eXlW5Gdgt8lB+i+JHiD6L6+vq+R3+Plo6zt+fn5Py4tLR0AdxBdGbLDLS0trwsTHBkJkG0Ze/kzoG0B4Cp08glwugL/Kgm8IQw2R7A5DBmsWIoNunm2bAdVm5SNjaRTE5Dtm9AuOIEWvNxwq8g6CwsLKyy49Dg9Go1Gt0OeQW/Hw2z+FIZxnfe9zvnflApQSpXxAkD8hEcJtHdxcfEhnq4N/ua8vLzHGhoaLsp2eHh429zc3B2ii4qKvqutrXWB6J068B/h4xds3ispKfl0enr6ErCd8EqujuS/kZ1GSsPAn1RwpwmFPquvr/8D+kNNNRfBV1ivTyQSp2ZnZ9X9ruTQCZLvIsF2MBfAVArr/WiLviCpnf7BTiCvM50FczxOzgJ6MqkMhztKS0ufr66uXpJMwVdWVr6FrDRM2nqFrbiT4Nckj8fjBVNTU+/i81nDUYWzVOBp422fHI/iKQCHmC57DNtw8LmB9eTQLjiYOLPdz7jHVHqMY2VrweWTeSgYXKCUBCQA8Dbd2gxpd/oNko+MjKiJVHYdwTjlrgX7jqZoyaQTRv0hmuFsWRflU76dNPCTkYB0jY2NX+FQx0hjSj8zMzO3s9gxO02Z7YSEPH1aOEaeNSe0s5Uv+XTatJ+sCaRh/lU2awIcpXsppdOx3qgMiouLv2dJ+GxaachCT6s5Rbd6PqFj6elSrfIln16WsmQkwEl4kSPTByomJOWb01pTUzMP3SUah9U02zDYFzRFSyadMHYnwM5KxojJp3yvs3//piQAQMdQd4G7H3DWyUfG/QbXOYe+Il4BmXo3aLrg0nmMICGO8AP46BANJso8SYwz4m2kJICwyhSsJ+jaVvvCocy6iK7pnOP0A/S2HTJJSGZ3gLAS6v7Ax3Po3hLvxy1GaA0HGbILXsVxrtE9XKMP4qCN7CtZH8Whu0Y3uooJvpct0VV8laPXEYvFPllYWLgIvwv7NeKlXMUpCSgZkugC/LhPTPe7nWmJ9DLSC+dI+lttaGjoJgIdxfYZcMnKgl1A5hoWupsHcHeJnGkkgeusa6KXoOc9b8HtTojg7ADzV//N4GAk/TLBx5EfRGA+nY0Fl08SkO+UYeCk0D/ZcQkwmGQe44NkO+s+pj42XEOJF+3HPgJZ445K522OQdv7/3h61WSbsQUS4kzntpbb6zIOks2m5mJ/L6O/DflvlNOdcypwFVkZsh84BXfRrO5d4n3lYVeL7BJ6q6RUbmRNwJTZVkrfjVyf3yGazK2c8R6P7eGzy/rHi3Ivrmy5IRnaMZMEApsoqTPBZmtGD2xqEIn8tBGGimyo28hmyxUoLy//mL9mD7Of+UGn9MAyuvNB2f/0P6nAX8PhXCAkdPOtAAAAAElFTkSuQmCC');
  }
  .sub-title-container #show-additional-options-button:hover {
    background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABGdBTUEAALGPC/xhBQAABPtJREFUWAntl1tonEUUx/eSzco2BIU8qBFsHry0FfESbEseJCAJRkKMuShVsNrW+qTBPmihUloFLbYS8cVgpRWbVnIxhmhsihD7UCvUqggpikgrGBQMaDQXc9v195+ds357ySYVfNKB+eZc/uc/55s5M/ttKPRfb+HLXYDh4eH4zMzMvalUKhaMDYfDC4lE4qOGhoa5oH0luWQlQK6fyR9IJpPHc+0kFMK3BfuJXF8xPVLMWcjHRDcVsstWzLdczD9J4AYji0QiW1j6R0wngYzPbCuNBROAKNLX17exp6cnGiQYHR0tYcJbvG28tbX1RFtbWzf6L7LJJ4z3u0Ec9LvEGbSbXLAIe3t79xDwAqBxSA/HYrG35ufnb0bvpK9XMPZPmLxWMhN8yrBZMu0CvaO0tPSbhYWFbfBsR68E/zz4FwUItrysIKsEsNuDKiHYy+SX0E/RbfJFrzO4ZEYYlpySxpxSjGKxiU/18Zzn9rD0kJcAmR4AnPCoP/1ouKRWhLe7nrd5yZiQ90Wj0bX4jtBTwRj0Ga+vQT5gMTZmbQEZbgZ0hgRkvxCPxzfNzc3dj7wT+3UU3UMtLS2fKXhoaCjBW94umYS+bGxsdBP19/fXcEzfheN7Yt4oLy8fmpycPAdsHTrmVE17e/tZxallFQz6IT+59viDpqamP7C9o67iqq2tXRwYGLhycXGxc3Z2VtXvihR5ibo5VlJS0tHc3HwGbJWw+F3DdxLedeKmHcRY412hrBUAeBTQoxlnONyF/hQZz8umySmsLxCrDJMzXqRg7yCJ32RnRUsZXqc/Id23o/A9ZortrdPZy60Iu8jSZc/kO9E/dE4eenMGNzmYMeQOdS8jhqo8RrKaYt3knnNXcHIBshKQAcCrTHwPAXanXyX7yMjIGuxadm3PWEVFRTXY19QlWxLCqD6Eo7lYcYlT3Gnz38+8BOQCeJqApGSCf9I4NTV1G4Pbc3xvssd2QkKSZROOFrXitFhxiTPtzn4WTCAb8u9qBROgeO4me/NdrRTKysq+YnCXDb4dVPoVlppk2by+pGMpmTe/RqO4xCk5t9kkGTvAZwj4mOC4jIy/a6yvr5/GfszbNkxMTHwO9ml1yeA2yCeM3Qmov3p8XJzilh5sWQnoGOLUXeDuB4IO8+YNFqBzjnxRup+wE7HTJpfPYwRRuw+OLgme8xBJHJFuLSsBjJmfUwIPcix32BeOLiKdb51zfG+DtbtfXEuy2R0grIwU3jwcTyK+Il0N3I1pKf0MBxWyy1zFAMe4RjdyjTaB0X2g8/8gpGcVU+Qq3uSv4h+BdXGdv891rut7PZwsRPZVnJWAiHWlAnpYMgEzyHamZdLR1BLuJZFxGawNDg5ey/HbB/5xbMGV1XF1BQtfNyvi7hKLCwKdDYJnEaalBCZ3dwIm4bdBdIlE9wijhrybyX8Avx3VOC3GTsu053Yx9jCw6do3fYS87A16y/0cq7WMdXR9bFhBSbdWB7nbdwzC1PmY/chupcSZu2oKztsCGSGL8FbViOcJyhSbiosjdx7/rfh+xufOObWj/dZXz9dcy3cGfwnxRfkZr+Zn/Bx+WxXg6VYwAXMWGiHsxq7P75A+SjUGPtOPk5SrH9lX02zZVoN1GN7iO1bAyYGJM75VE3lgXg2sREAC3y6HKeZbLuayV4C/X+/xD6iZVYgFSZnc/TUL2v6XV7MCfwFxD1K3HbvQGQAAAABJRU5ErkJggg==');
  }

  .additional-options {
    padding: 0;
    margin: 0;

    border-radius: 5px;
    border: 1px solid #EAEAEA;

    padding: 10px;
    margin-bottom: 10px;

    display: flex;
    flex-direction: column;
  }

  .headers-container {
    padding: 0;
    margin: 0;

    display: flex;
  }
  .headers-container .header {
    width: 100%;
    padding: 0;
    margin: 0;
    
    display: flex;
    flex-direction: row;
    align-items: center;

    margin-bottom: 5px;
  }
  .headers-container .header:last-of-type {

  }
  .headers-container .header input.header-name,
  .headers-container .header input.header-value {
    flex: 1;
    margin-right: 5px;
  }
  .headers-container .header .remove-header-button {
    margin: -2px 0;
    padding: 0;
  }

  #add-header-button {
    padding: 0;
    margin: 0;
    margin-top: -2px;
  }

  button#json-url-load-button {
    padding: 0;
    margin: 0;
  }

  .row {
    padding: 0;
    margin: 0;

    display: flex;
    flex-direction: row;
    align-items: center;

    margin-bottom: 5px;
  }
  .row.is-last {
    margin-bottom: 20px;
  }

  .row input[type="checkbox"] {
    padding: 0;
    margin: 0;
    margin-right: 8px;
  }
  .row span {
    padding: 0;
    margin: 0;

    color: #2C2C2C !important;
    font-size: 12px !important;
    line-height: 16px;
  }

  input[type="text"].hidden {
    position: absolute;
    top: 0;
    left: 0;

    width: 1px;
    height: 1px;
    opacity: 0;
  }
  `
}

function getTitleSegment(title, description) {
  return `
  <div class="title-container">
    <span class="h1-title">${title}</span>
    <span class="p-description">${description}</span>
  </div>
  `
}

function getSubTitleSegment(title, description, noMargin) {
  return `
    <div class="sub-title-container${noMargin ? ' no-margin' : ''}">
      <span>${title}</span>
      ${
        description
          ? `
            <div class="question-mark">?</div>
            <span class="p-description">${description}</span>
          `
          : ``
      }
    </div>
  `
}

function getJSONStyles() {
  return `
  .json-preview-container {
    display: block;
    box-sizing: border-box;
    position: relative;

    width: 500px;
    height: 655px;
    padding: 0;
    margin: 0;
  }
  .json-preview-container .button-container {
    position: absolute;
    top: 18px;
    right: 20px;

    height: 24px;

    display: flex;
    flex-direction: row;
    align-items: center;
  }
  .json-preview-container .button-container button {
    margin: 0;
    padding: 0;
  }

  .json-preview-container .footer {
    background-color: rgba(251, 251, 251, 0.9);
    border-top: 1px solid #EAEAEA;

    width: 500px;
    height: 64px;

    position: absolute;
    bottom: 0;
    right: 0;
  }
  .json-preview-container .footer .button-container {
    top: 20px;
  }
  .json-preview-container .footer .button-container button#populate-button {
    margin-left: 12px;
  }

  #json-preview-div {
    height: 655px;
    background-color: #FBFBFB;

    overflow-y: auto;
    overflow-x: hidden;

    padding-top: 20px;
    padding-bottom: 80px;
    position: relative;
  }
  #json-preview-div.has-overlay {
    overflow-y: hidden;
  }
  #json-preview-div.has-overlay .overlay-container {
    display: block;
  }
  #json-preview-div .overlay-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 591px;

    background: #FBFBFB;
    display: none;
  }
  #json-preview-div .overlay-container .overlay-content {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;

    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
  }
  #json-preview-div .overlay-container .overlay-content .spinner {
    width: 30px;
    height: 30px;

    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    background-image: url('data:image/gif;base64,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7+/w8PDx8fHx8fLx8vLz8/Tz8/T09PT09PT09PX09PX09PT09PX09PX09PX09PX19fX29vf39/f39/j4+Pn5+fr6+vr6+vr6+vr5+fn5+fn4+Pn4+Pj4+Pj39/j39/j39/j4+Pn5+fn5+fr6+vr6+vr6+vr6+vr6+vv7+/v8/Pz8/Pz8/Pz9/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7///////////////////////////////////////////////////////////////8I/gDhCRxIsKDBgwgTKlzIsKHDhxAjSpxIsaLFixgzatzIsaPHjyBDihxJsqTJkyhTqlzJsqXLlzBjypxJs6bNmzhz6tzJs6fPn0CDCh1KtKjRo0iTKl3KtKnTp1CjSp1KtarVq1izat3KtavXr2DDih1LtqzZs2jTql3Ltq3bt3Djyp1Lt67du3jz6t3Lt6/fv4ADCx5MuLDhw4gTK2Z77tzinI0jO35cU3JjyjQtR8YsU/NlzjA9TwaNMVEWNMskilZ9jVg20gJ3DJgNYU3E1RCv/cLFOzXoNbODD7D9ELfDa7yT43rN2YZw2qOKe37IbbdyXMJAs3g+e4d0zQ+F/l3nDQy0c+4DEjk0vjDbeN7ZOetBP6DE+ukNgb1fTroDfeILsZcQcu/9Alsi9EHgm0ICHnSOdeMxR9p53GHBUIMGEbNffLCNQt8A0TGIX0Lc7IcLN7ANhAV9LAQ4IkL6vUdMigMtAwF96iWE4UDuFTgajcCh54GI4CUE4XXX0FhQCfSdoeOLBRE4XnlKEoQgego+aRlCD+4nYZWx/aflZghJed2CYAo0yo3ctSjiQjFe9wuKhd2xgw072CHRim1iFKdyM0YUzCminBLMW0ZooKiiKTAC0TL+PefdRcuM98uPDBXDCSScckpKW5wsKqoGO9DyECRsBgcJRiUqNyd1/qd0Kisk2LAFxqijgjGMQ6NsN0BtGulGHp0MlTjrrLiw1Qeuo36gJ685cpQNsQwFs8mxs+661jAfMDtqC47uVIwr2M66CbVp3eEtrkaYehM3pJR77KFu3dHtuot+oCtNJV4rb6eb0PsWLTvgK2oKnMiEzab/dkoKum8x0oLBin7grkvY+NuwK8XgZS/FNsAkSsOQ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ycfHycjJy8rKzMvLzcvLzcvMzszMzszMzszMzszMzszNztDQ0tTV1tXW19XV19XW19XW19XW19XW19XV19XW19XW19XW19XW19bW2NfX2NjY2djZ2tra29zc3d7e397f4N7f4N/f4N/f4N7e39/f4N/f4ODg4eDg4eHh4uLi4+Tk5ebm5+fn6Ojo6ejo6ejo6ejo6enp6unp6urq6+vs7O3u7u7v7+/v8O/v8O/v8PHx8vHx8vHx8vHx8vHy8vLy8/Ly8/Lz8/Pz9PPz9PPz9PPz9PPz9PPz9PPz9PPz9PLz8/Ly8/Pz8/Pz9PT09PT09fX19fX19vb29vb29vb29/b29/b39/b39/f39/f39/b29/b29/b29/b29/b29vX19vb29/f3+Pf3+Pj4+Pn5+fn5+fr6+vv7+/v7+/r6+/v7+/v7/Pv7/Pv7/Pv7/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f7+/v7+/v7+/v7+/v7+/v7+/v7+/v///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////wj+AMEJHEiwoMGDCBMqXMiwocOHECNKnEixosWLGDNq3Mixo8ePIEOKHEmypMmTKFOqXMmypcuXMGPKnEmzps2bOHPq3Mmzp8+fQIMKHUq0qNGjSJMqXcq0qdOnUKNKnUq1qtWrWLNq3cq1q9evYMOKHUu2rNmzaNOqXcu2rdu3cOPKnUu3rt27ePPq3cu3r9+/gAMLHky4sOHDiBMrVstqBwYMP1gtvvmBgGUCISbXZHL5MhPNM010tmwCtMzRl03HRG1ZtUY7Va64ksiawMRi2VwP9CGhN4YzEWtHzKaruK5irs/0Xi4B+EPhD4kbL57b9A7mvhM9Zw1xunHkpmH+YO/tYzvqh8W8FwcP+vp4CXYcQm+ofr1qNu8lqJDPvWH6+tWZFkJ+zi00n0LS1aebHflhMJuB/S1UX3G6CeTeeFUwdCBCCXrHnmuJ5CeBdgpteNCEulQ4UBX5wQDheQr9p16A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xsTExsTFx8TFx8TFx8TFx8TFx8TFx8TFx8XFyMbHycfIysnJy8rKzcvMzszMz83Nz83Nz83Nz83Nz83Nz87O0M7O0M3Nz83O0M3Nz87O0NDQ0tLS1NLT1NPT1dXW19bX2NfX2NfX2NfX2NfX2NfX2dfY2dna29zd3t3e397f4ODg4eHh4uHi4+Hi4+Hi4uHi4+Hi4+Hh4uHi4+Hi4+Hi4+Hi4+Hi4+Pj5OTk5eXm5+fn6Ojo6enp6urq6+rq6+rq6+rr6+rq6+rq6+rq6+rq6+rq6+vr7Orq6+rq6+vr7Ovr7Ozs7e3t7u3u7u7u7+/v8O/v8PDw8PDw8fDw8fHx8fHx8vLy8vPz8/Pz9PT09PT09PT09PT09PT09PT09PT09PT09PX19fX19fX19fb29vb29vb29vb29vX19fb29vb29vb29vb29vb29vX19fX19fX19fb29vf39/j4+Pj4+fn5+fn5+fj5+fj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pn5+fn5+fn5+fn5+vr6+vr6+vr6+vr6+/r6+/r6+/r6+/v7+/v7+/v7+/z8/P39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f7+/v7+/v7+/v///////////////////////////////////////////////////////////////////////////////////////////wj+ANMJHEiwoMGDCBMqXMiwocOHECNKnEixosWLGDNq3Mixo8ePIEOKHEmypMmTKFOqXMmypcuXMGPKnEmzps2bOHPq3Mmzp8+fQIMKHUq0qNGjSJMqXcq0qdOnUKNKnUq1qtWrWLNq3cq1q9evYMOKHUu2rNmzaNOqXcu2rdu3cOPKnUu3rt27ePPq3cu3r9+/gAMLHky4sOHDiBMrVkvLR4gQSmgtvpkiguUILSbXpHL5MhXNM2V0tiwDtMzRl03HRG1ZtcY9XcoQk8g6gsRZWpjgcS1QiYXfJtBErB3xiwIByHu4RvO7uQXhD4k//IK8ugDooH04B54pOuuHlY7+WxdQ2nSP7b+VeEf9UMZ45CdUa0dvYY9D6QzxvEdeHvQd+hbQcN93DYGw33WuwQAgdgrhpxB1+0nA2x4AmjDbQg4i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8/Ly8/Pz9PPz9PPz9PT09PT19fX19vb29vb29/b29vX19vX19fT19fT09fX19fX19vb29vb29/f39/j4+Pj4+Pj4+Pj4+Pn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+vr6+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/z8/Pz8/Pz8/P39/f39/f7+/v7+/v7+/v7+/v7+/v////////////7+/v///////////////////////////////////////////////////////////////////////////////////////////////wj+AMkJHEiwoMGDCBMqXMiwocOHECNKnEixosWLGDNq3Mixo8ePIEOKHEmypMmTKFOqXMmypcuXMGPKnEmzps2bOHPq3Mmzp8+fQIMKHUq0qNGjSJMqXcq0qdOnUKNKnUq1qtWrWLNq3cq1q9evYMOKHUu2rNmzaNOqXcu2rdu3cOPKnUu3rt27ePPq3cu3r9+/gAMLHky4sOHDiBMrVnsMyYoVUo4tvtmCg2UOLibXvHL58hXNM3d0trwDtMzRl03HRG1ZtUZJYsxIjsiag8RhWqbwcS1QSorfLOrQZh2RTIYIyIe4rvO7eQrhD2tDJIO8egQ6qpE4B14rOnGHrI7+W4+gQ/WR7b+leEf9UMd45Cyyo/8tyaH0hnzeIy9ves/8FD7Y9x1DJ+h3nWs2/AfdQvctRJ1+trkmyX8szKZQgwkNI957u/Gm3XxiMIQhQlIYyB9vtfyXQncXDogQKwZGwApvA4nx3xEMungQCwaqR6NAx7DwX30JjVhQfvplMMyPAzE3nw0tslekgWQwSVAP/5WRkGijlYYQFgbGZ+VAE85XIUKcjTYGQhoa2OGYvSmYUGWXtZDQg+8pB+dAtQiJHo4IHRPFY1FYaBCP72UwY2F6TJHEFHpIZOOfGCE6no8QicECCSyE6NYVNYQaqhCZQHRMgtthWtEQ73Gw5EP+emAgwKyznqiWKqLmWsMUuzz0iZ/NfYKRJeNlYMlDqrBA67ICRMJWGbrqWkY0DtVyXgrBaWQcfIsyNAwSzDKbBFuLRKsrD5FWSyRHfHTLkBgPhMssGmxFs4O5uh5R6k56cCAvsw+8upYe+EaLRa83qaLDv+F62pYe9xYsKg/T0vRtvAzT+oDDbu0yhcS5CqGKTJHI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/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+////////////////////////////////////////////////////////////////////////////////////////////////CP4A0QkcSLCgwYMIEypcyLChw4cQI0qcSLGixYsYM2rcyLGjx48gQ4ocSbKkyZMoU6pcybKly5cwY8qcSbOmzZs4c+rcybOnz59AgwodSrSo0aNIkypdyrSp06dQo0qdSrWq1atYs2rdyrWr169gw4odS7as2bNo06pdy7at27dw48qdS7eu3bt48+rdy7ev37+AAwseTLiw4cOIEytWi0xOlChzkC2++WWI5SFfJte0c/myHc0zzXS2bAa0zNGXTcdEbVm1RlWMIFWTyHqIRGR25nhyLZCOlt9hMEWsHdFQkB7IS6vG9Lu5FuEPiT80hLx6D0iq5zgHDiw664exjv5b75HZtJztv+l4R/3wy3jkUbKj/63KoXSGnt4jLw8a1Hwtatj3XUNM6Heda2b8B91C9ylEnX5B8KbKf2HMxuCACiEj3nu78abdfIww1CBCcxjIn2vA/KdFdwqNaFAsBvYQC28DMfKfHBeyp1AUBs5B40DVhPFffQm5SFB+EEr2o0DMzXdGixgetOF4hixJEBv/YYeQaKMpd1AdBsZn5UATzlchQpyNlghCGhrY4Zi9KZhQZZedWNCD75UBJ0HACIkejmzO8VhkCfH4XhAzFiaKIXYYIopENv6JkaHj+RhRHU0M0cRnbi3SxqefzsEKRNUkuJ16F5VxqJIOadJDDf6wwqpFW7eAamsbhjwDnp/NJWpRKuMFkcpDrDQR67E1hMJWJbfeWgk2DgFznhbBaWQcfL4uZEwbyCIb4FqqNHurHI9GSyRHnmS7UB07dIvsImxhI4e4t9Ix6k6aBOEusjsY05Yo9Da7iK43saLFvt3W8ZYo8wYMqhzP0rRtuwjHuoPCcD1DiMO2znGLTKG8WnGsUtwrFyt0cPypHAS7FArFIwehCV4Mq8ypS0aMXMPFe2HDLMcw6ayGv309Y4fDH7cUSsVNmPwXK3OIa6lLPLjLw8yFedIwqOW6VAe/UxuGjSd22LFI0jCFIoURRsxB9J5wxy333HTXbffdeINWyv4jePTt99+A4/FIKTyVAQQKiCeu+OIoAKFnWNgwEvjkkzMC7U3F7MD45pvvUAxYnlAuOuCf4MQE56gvLgVYiIzuOh6I4KRD6rSjoAPrr48e+02z14767V+Fnjvlpd90uu+cr/5V5MMHbjlOmSPPuOdi7d284OfmZLj0jbeR9/fghy/++OSXb/75LHXDyymnrGIhTJgEscMOZvCS2C2eYKK//va/JMcFAAQgCbw0GGOAYn8IBAVMXhDABr4AXoGpxikQSEFMvG8lmGigBi+wg2H1pRuxqGAFYbLBDWqhf3nhRf5EiMBTwGQHJdQgCQBlFwOykIKeuCBLMEGCGGowBv4QlEs1UHFDHOqwJZhgoA8bCAQPvkWFRdxfurpBE15IoYdLFCAN2cKLKO7PfThJRRCyGMAtpqUbKyziKd6Wk0XEgIwkQGFaihFFT8hxId04IkYIQTiHyAGLPkSVWkJ4w1hQsSHqi0UsbqHHiaSBAg1oQAz6yBArLpGAaKkGC1HRyIN04xaKDOUhLRKJSJqSApF4SCqAEMMFqWUVOGQjQz4ZylCyyCJAMKUpQ3DHhSxCiQGMkFuKgYpToKKXDDFGLUOJzIjAQJembIJE5ACEHQBBkIOh5TJj0Ux08GIHE5gAELr5TGg2gAKU3BMwtqnITn5AAPAUAAgSkgZzRhIIcf6rBjsXOcqCCCGe8RQCQngBSXsSAm6gZCerDGICgMLTBHOypyT3pE92ou0gDo2nQkIg0TSMSZvb7CQ6MgpPhRBCohTopmaUyc5bIoSkAlhIOc0pzR+BcJ/9xChJF1IKiTYgnapZJztlqdOMMqQJEt0BjSq6zVvktKgOrWRBzXlQ1yQ0pA2BaUPqac8QuIapy7yoQrTaEBRINGyTESpWs7rThpzUnsADDS9a+hCyNkQH9oRBUJv61ITYlSGlmKop46oZsLYTIn9lCFd1ida0hpKREUmsYqeKT95UwxjV6OtCJFvJNDShquPjLPoYItrRKqShDoWoaSHyT4c+YbUReVFnPD8A24jwAgjhHGdtd8vb3vr2t8ANrnCHS9ziGve4yE2ucpfL3OY697nQja50p0vd6lr3utjNrna3y93ueve74A2veMdL3vKa97zoTW9GAgIAIfkECQMA2gAsAAAAAMgAyACHAAAAXV1ekJGUkJGUkJGUkJGUkJGUkJGUkJGUkJGUkJGUkJGUkJGUkJGUkZKVl5ibmZqdmZqdmZqdmZqdmZqdnJ2goKGkoqOmoqOmo6SmoqOmoqOmoqOmo6Smo6Sno6Sno6SnpKWopqeqqaqsq6uurKyvrKyvra2wra2wra2wra2wra2wra2wra2wr7Cys7S2tba4tba4tba4tba4tba4tba4tre5uLm7urq8vLy+vb7Av7/Bv7/BwMDCwMDCwMDCwMDCwsLEw8TFxsbIyMjKycnLysrMysrMysrMycnLycnLysrMysrMy8vMzc3O0NDS0dLT0tPU0tPU0tPU09PU09TV0tPU09PU0tPU0tPU09TV09TV1NXW1dbX1tfY19fY2NjZ2Nna2dna2drb29vc3Nzd3Nzd3d3e3d3e3d3e3d3e3d3e3d3e3d3e3t7f39/g39/g4ODh4ODh4eHi4eHi4uLj4+Pj4+Pk4+Tk5OXl5ebm5ebm5ebm5ebm5ebm5ebm5ebm5ubn5ebm5ebm5ubm5ebm5ebm5ebm5ufn5ufn6Ojp6enq6+vs7O3t7e3u7e7u7e7u7u/v8PDw8PHx8PHx8PHx8PHx8PHx8PHx8fLy8vPz8vPz8vPz8/P08/T09PT19PX19fX29vb29vf39/f3+Pj4+Pj4+Pj4+Pj5+Pj5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+vr6+vr6+/v7+/v7/Pz8+/v7+/v7+/v7+/v7+/v7+/v7+vr6+vr6+vr6+/v7+/v7/Pz8/Pz8/Pz8/f39/f39/f39/f39/f39/f39/f39/f39/f39/v7+/v7+/v7+/v7+/v7+/v7+/v7+////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////CP4AtQkcSLCgwYMIEypcyLChw4cQI0qcSLGixYsYM2rcyLGjx48gQ4ocSbKkyZMoU6pcybKly5cwY8qcSbOmzZs4c+rcybOnz59AgwodSrSo0aNIkypdyrSp06dQo0qdSrWq1atYs2rdyrWr169gw4odS7as2bNo06pdy7at27dw48qdS7eu3bt48+rdy7ev37+AAwseTLiw4cOIEytWu8vNkyd1di2+WcWIZSNVJtfUc/myHs0zv3S2/AW0zNGXTcdE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5eXm5ubn5+fo6enp6urq6urq6urq6urq6urq6urq6urq6urq6urr6+vr6+vs6+zs6+vs6+zs7Ozt7e3t7u7v8PDx8vLz8vLz8vLz8vLz8fHy8PHx8PDw7/Dw8PDw8PHx8vLy8vLz8/P08/P08/P08/P08/P08/P09PT19PT19PT19PT19fX29vb39vb39/f39vf39/f39/f39/f39/f49/f4+Pj4+Pj4+fn5+fn6+vr6+vr6+vr6+vr6+vr6+vr6+vr6+fn6+fn6+fn6+fn6+vr6+vr6+/v7+/v7+/v8/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////CP4AswkcSLCgwYMIEypcyLChw4cQI0qcSLGixYsYM2rcyLGjx48gQ4ocSbKkyZMoU6pcybKly5cwY8qcSbOmzZs4c+rcybOnz59AgwodSrSo0aNIkypdyrSp06dQo0qdSrWq1atYs2rdyrWr169gw4odS7as2bNo06pdy7at27dw48qdS7eu3bt48+rdy7ev37+AAwseTLiw4cOIEytWGyxNlCh1gi2+WWWJ5SVTJtfUc/myHs0zv3S2/AW0zNGXTcdEbVm1RlCHFgmTyHqJxF954FByLTCPlt9jJkWsHXEPkSDIS6ue9Lu5FuEPiT/cg7x6EEWq6zgHLis664eujv5bD1JFNZztv/N4R/2wynjkUbKj/w3KoXSGlN4jL2/a0XwtaNj3XUNL6Heda2X8B91C9ylEnX5H8AbKf2PMxuCACv0i3nu78abdfIcw1CBCcBjIH2+y/KdFdwqNaJArBgbhCm8DHfIfHBeyp1AUBuJIo0DCjPFffQm5SFB++hHxy48DMTcfGS1ieNARBu7BJEFo/LdIQqKNptxBeBgY35UDTThfhQhxNpqVB2loYIdk9qZgQpVddqJBD773ZZzZyCIkej4eFEwdj0WWEI/vETFjYZoQsgchREJkI6AYITpeoA/hAcURUODxliJw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r7Cyr7Cyr7CysLGzsrO1tLW4tre6t7i7uLm8uLm8uLm8uLm8u7y+wcLEwcLEwcLEwcLEwsPFxMXHxcbIxsfJyMnLysvNy8vNy8vNzMzOzMzOzs7Q0NHS0tPU1dXX1tbX1tbX1tbX1tbX1tbX1tbX1tbX1tbX1tbY19fZ2Nja2dnb2trb29vc29vc29vd3Nzd3Nze3Nze3d3e3d3f3t7g3t7g3t7g39/g39/g39/g39/g39/h3+Dh4ODi4eHi4uLk4+Tl5eXm5ufo6Ojp6Ojp6Ojp6Ojp6Ojp6Ojq6enq6enq6urr6urr6+vr6+vr6+vr6+vr6+vr6urr6urr6urr6urr6urr6urr6urr6urr6urr6urr6+vs7u7u8PDw8fHy8vLy8vLy8vLy8vLy8vLy8vLy8fHy8fHx8PDw7+/w7+/w7+/w7+/w7+/w7+/w8PDw8fHy8vLy8vLy8vLy8vLy8vLz8vLz8/Pz8/Pz8/Pz8/Pz8/Pz8/P09PT09PT09PT09PT19fX19fX19fX29vb29vb39/f39/f39/f49/f49/f49/f49/f4+Pj4+Pj4+Pj4+Pj5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn6+vr6+vr6+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7/Pz8/Pz8/Pz8/Pz8/Pz8/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+////////////////////////////////////////////////////////////////////////////////////////////CP4A0wkcSLCgwYMIEypcyLChw4cQI0qcSLGixYsYM2rcyLGjx48gQ4ocSbKkyZMoU6pcybKly5cwY8qcSbOmzZs4c+rcybOnz59AgwodSrSo0aNIkypdyrSp06dQo0qdSrWq1atYs2rdyrWr169gw4odS7as2bNo06pdy7at27dw48qdS7eu3bt48+rdy7ev37+AAwseTLiw4cOIEytWm4zMkydmki2+WUWIZSFXJteEc/kyHM0zv3S2/AW0zNGXTcdEbVm1xlWMBDmTyFqIxGRmyAxyLdCNl99hPkWsHfGPDx7Itbj+9Lu5F+EP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8fHy8fHy8vLy8/Pz8/P08/P08/P09PT09PT19fX19fX29fX29vb29vb39vb39vb39vb29vb39vb39vb39vb39vb39/f39/f4+Pj4+Pj5+fn5+fn6+fn6+fn6+fn5+fn5+fn5+fn5+fn5+fn5+vr6+vr6+vr6+/v7+/v8/Pz8/Pz8/Pz8/f39/f39/v7+/v7+/v7+/v7+/v7+/v7+////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////CP4AewkcSLCgwYMIEypcyLChw4cQI0qcSLGixYsYM2rcyLGjx48gQ4ocSbKkyZMoU6pcybKly5cwY8qcSbOmzZs4c+rcybOnz59AgwodSrSo0aNIkypdyrSp06dQo0qdSrWq1atYs2rdyrWr169gw4odS7as2bNo06pdy7at27dw48qdS7eu3bt48+rdy7ev37+AAwseTLiw4cOIEytWK+vNmDFxZC2+SYaLZS5kJtekc/kyHc0zzXS2bAa0zNGXTcdEbVm1xlCFGNWSyJqLRFly3DByLbCOmd9mIEWsHbGOlSjIM6uGBBy48IfEH9ZBTj0KIdVzmgOX7DB6w1HHq/5HGaNajvbfdaCzfjhGPHIw2M//DtV9fUNG7pGTN11Jvpk39aHmEBb5WeeaG/49t5B3Ck2XnxW8heKfGbMtaJ9CsoTn3m68ZSdfIQwxiJAbBe7HmywTcpeQiAaNUmAUo/A2UCH+yWGhgAqBUaAbMg5USxv+0bfihQfh96CKPTInXxsKsUiQhuKl1yNBb/jXSEKijVYaQnMUCN+UBEnoX4UGcTaaHwhlWCCHYA7km3wKGlTZZcod5KB7dbYpkCxAnmdjmnKIIYYcSBako3tWxFhYKIzEJiRENPqJ0aHi8RhRHFhYgcWfbTVSx6ef/tEKRLUgqJ2UFpGBaKELFcLED/6wwvrlWrKAamsdjLCaUCt9AjfqRZaIZ4UlD4GCRazI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//////////////////////////////////////////////////////////////////////////////////////////////////////////////////8I/gCjCRxIsKDBgwgTKlzIsKHDhxAjSpxIsaLFixgzatzIsaPHjyBDihxJsqTJkyhTqlzJsqXLlzBjypxJs6bNmzhz6tzJs6fPn0CDCh1KtKjRo0iTKl3KtKnTp1CjSp1KtarVq1izat3KtavXr2DDih1LtqzZs2jTql3Ltq3bt3Djyp1Lt67du3jz6t3Lt6/fv4ADCx5MuLDhw4gTK1arK0+YMIB0Lb5Z5onlJ2Um1xR0+bIgzTPXdLa8BrTM0ZdNx0RtWbXGVJxKSY7I+onEXIDycHItEBKc33dG0WYdkRATJMgzqx71uzkc4Q9rQySEvDqSRqoJOQeeKzpxh6mO/ltHAkZ1oO2/IXlH/RDMeORcsqP/ncqh9Iac3iMvb/rTfDh92PcdQ1Hod51revwH3UL3LUSdfk3wlsp/d8ymUIMJ5SLee7vxpt18HV44YEJ5GMgfb7n8B0d3IrKnUCoGIlEfbwJx8l8gDI54EBcG5kHjQLrc8d+MCGFoUH76McHij9EwN58eLY6mUBMGEsIkQX38V0pCoo1WGkKAGBjflQNNOF+FCHE2mnoHaWhgiGRG49t8CxpU2WXKHfTge3nGGU0uQqKHI0K6AAIGGJElxON7TBA5mCqdlNKJKhLZKChGi47nY0R9RMFEFAG65UkjpJK6yZIN6ZLgdmxaVMZ7/k2gylAmRPhgq61btKVLqbw20okyD+ESaHO4YOTJeEx48lAqUdzqrA9broVKr72iAmxDuZwHR3AaGQefowrlcsazz57BFi7UUkupQ7mAmxEn7ibUhxDkPvvZWspokm6vnMh6UyZI1PusEP6epcq+1HpyrU2pbCEwuaG2pYq+CPNqLU3i0vvwrUJE7JYynVTM6yYWvlRKrRvfukW8beXCicilLtxSKRqnjEQmeE0Mc7QuMZGyDx3vpcy0IsP08xkF36VMKRWXrFIpGzfBsl65bJLuJjAVUW8ROBeWCsWlrutSHwPDkZgyqZRSiidOz7wFE0ys6OfcdNdt99145633/t6q9YLLLIAHLvjgs+DSC09cEEHD4ow37jgNRHQx1t+EV054sTjNAsTjnHMOxCxg5WL56IMffhMTnafueBRgUU466ZjblIPqtNOgQ+uvvx57TbPXnnoOoedOuuk2oe5756zjLvzlOc0SxPGPBwF6WH4vDzgubdvExRDQ0zBEn3yHL/745Jdv/vnop4/SJ0NwwEELm8LUSBE66NCF2IYJoYAA/PO/BExjSIEABdgCyRWmDBDonwIhABMYDPCBMBgUYBrBAQVaUADxW0kjHsjBFOigTnr5RA4ueEGYdLCDUcDfXZawPxIqkAMw0cEJOdgC8M2lDBVwoQUTgJ2XNKIF/jPkIA4kGJdGkECHFoRABl3SCAcG8YFBACFbWIjE/iUgB5+giSqaAMQnEnAMb1lCFfvHgh7aZBRF8OIAwciWT7QQiRywoU0CgQM1tkCFZ4lCFRPwP4ds4ksc0QPPGDKGLgbRDmwZoQ6x6BA/kMABDohAhDLSBRKIQAQ0GKRCtvjEMaklDy4kgRkZ4ocIQPKUfsAIIS7JShJYySGjEMIMR5kWFiRRjglJxQZOeUoYYAQIrGRlCvCokEA4cYBFeEsUSMABEvQRIkDg5SlJgBEaBJOVTJDIGISgAyEgsjCbMKU0HUBNhKQiByMYwQ+mZs1rioAEmiQTDMYJyUkepAQV/shnBUqQkC6485JAoBsa6BlJlhFBn/okAkJUYcl/QslPHCCoERLSAoTmswUJicI/MemnJhB0AwqxqD4VkoKNGpBJqRDnONEQUpFWQCF62CgJiGmaaNKTBQtx6UsV0k53ZvNHmyCoA7DWUpEupBQbFUE8QcMCggY0py5lCBM2CjzeDJSeEZjaQHTKEIZu9KGq2SU97VlUizbEn/9MgWu4QFAYNoSrDXHBRgGpmabSk6VvjWpDYvrPqoLmkeP0pUPg2pAc/JMGqrErLyNA1Lwa1SGlaGgw/aoZj0qTrAwh7FndSVfNzBOSkoyIZs8q2ae6Bg1AkJpERtsQVXSBCWAlah9r1edYs9I2IhW1KEZvC5GDWvSnvH0IPvXJz+BCJBVASCcQtGrc5jr3udCNrnSnS93qWve62M2udrfL3e5697vgDa94x0ve8pr3vOhNr3rXy972uve98I2vfOdL3/ra9774za9+9/uQgAAAIfkECQMA3AAsAAAAAMgAyACHAAAAPz9AlpeblJWZlJWZlJWZlJWZlJWZlJWZlJWZlJWZmJmdnJ2gnZ6hnZ6hnZ6hnZ6hnp+in6CjoKGkpKWnpaappqapp6eqqKirqKirqKirqKirqamsq6uusLCzsLG0sLG0sbK0sbK0sbK0sbK1sbK1sbK1srO2s7S2tLW3tbW4tra5tre5t7i6uLi7uLm7urq9urq9u7u+u7u+u7u+u7u+u7u+u7u+vLy/wMDDxMTGxMTGxMTHxcXHxcXHxcXHxcXHxMTHxMTHxcXHxcXHxcXHxcXHxcXHxsfIyMjKysvMzM3Ozc7Pzc7Pzc7Pzc7Pzc7Pzs7Qzs7Qzs7Qzc7Pzc7Pzc7Pzc7Pzs7Qzs7Qzs7Qzc7PzM3Pzc7Qzs/Qz9DR0NDS0dHS0tLU09PU1NTV1dXX1tbY1tfY19fZ19fZ19jZ19jZ19jZ19fZ2Nja2Nja2Nja2Nja2dnb2trb2tvc29vc29vc3Nzd3d3e3t7f4ODh4OHi4eHi4eHi4eHi4eHi4eHi4eHi4OHi4eHi4OHi4eHi4eHj4eLj4+Pk5OXm5ebn5ubn5+jp6erq6uvr6uvr6+vs6+vs6+vs6+zs6+zs6+zs7e3u7u7v7+/w7+/w7+/w7u/v7u7v7e7u7e3u7O3t7e7u7+/v8PDw8PHx8vLy8/P08/T08/Pz8vLz8vLy8/P09PT19fX19fX19PT09PT09PT09PT09fX19fX19fX19fX19fX19fX19vb29vb29/f39/f39/f39/f39/f39/f39/f39/f3+Pj4+fn5+fr6+vr6+vr6+vr6+vr6+vr6+fr6+vr6+vr6+vr6+/v7+/z8/Pz8/Pz8/P39/f39/f39/v7+/v7+/v7+/v7+/v7+/v7+/v7+////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////CP4AuQkcSLCgwYMIEypcyLChw4cQI0qcSLGixYsYM2rcyLGjx48gQ4ocSbKkyZMoU6pcybKly5cwY8qcSbOmzZs4c+rcybOnz59AgwodSrSo0aNIkypdyrSp06dQo0qdSrWq1atYs2rdyrWr169gw4odS7as2bNo06pdy7at27dw48qdS7eu3bt48+rdy7ev37+AAwseTLiw4cOIEytWO82SIkWbpi2+ueiQ5UOMJtccdfnyKM0zGXW2nBl0zNGXTZ9GfUi1Rme4dFWTyLp1xGmXILFyLfDUpN+fhEWsHVFUHTfIS5sW9rv5JOEPiT8Uhby6G1SqSTkHLi0664fFjv5bd5NI9ajtv095R/0w0XjktkFrRz/JmUPpDFm9R17e9DD6k2By33cN6bHfda5tAiB0C+GnEHX74cGbMwB+MluDBCo0jXjv7cbbfOjhwpCDCEFyYH+8SQPgJN0pRKJBxRzoRjG8DYQLgJ+5mCFChxwISY0DVfMJgPYl9CJB+u1Xh2RACsQcfZvoyF5CeBwoSpMEKUifLgmJNppyBl1yYHxYckMhfRYixNlo2B204YEeltnbgglVdtkiCUH4Hp5yDiTNkOjl6OYmiSQSmZFK0liYM8I0WiRENwaKUY/v/RjRJ3nQkccnbw3Dyqef4sKkQ9Vo6Zx6Fy3yHh6jNoQKGf5exBorH21NA+qtrAhzYUPOANrcoxXpMl4dXDo0TB6yJuuFiGsVgyuuxey6kDTnTRKcRsbBpyhDzjCirLJgogXNs7jiAuy052bEyrYMfRLGt8peuVY1uJCLqy6t4oSKGvAqG0a6Zzlj77PDSEvTMHz0+y2nbsE28K24REtTt+8qLGsYDL9VjTAPQ5xvS7jAarGsegxD1zS6dByqwSvhUvHIarRpl8MdM9gSHSN7gfFe1TjbMUw5MwLwXRs//DFKuFich8mBTVPvs8y6JLKyZMg8GM2gDo3SJ/42klg1jAozzNEt60EHHY1o3efabLft9ttwxy333HTTdMgYPeSt9/7efPcwBpl1K+TMF30XXvgXagfOTR2GN853HoortITjlPewROQJTV5545djfhDjmxsOuecGDR5634iTziPep4+Bouqwxy777LTXbvvtmgkThgce4GApTKiUscQShiTuFxgMDKC88mbAtIgM0EOfgyGGJTLB8thPAJMO0XevgyWCjeIB9uQP8PtKqHSvvgxLRL2XMEqUXz5M66+Ph/FvmZG8/Nh7AJMS9VNfDl5Hl0RwgH/kY4CgWoKKHARQfUkA31xGsQIEkm8C53MJKrj3wO6BwX1t0Z8Fl8cAJdgMJs7AgwM7KD0+hXCEy8PBAmkSMhZGz4VqEcb+LOgBAt7EEv5JsGEO8PcVPIyQAc1zyCnClRFIrOIhi1jhA722lvgh0IQOsUQLIhABCtBBI4dgAQlIwIMn8goPHaTVWiDBPxXMUCGWoAAX5yhBi4hijHhkgbwaggswBNBqacHBBX2oEGF0YI5z1AFGvIBHPMqAXQyxBAejR4a34EEFHlBBEiESBUTOkQUY6UEj8agGiSwCDEoAAxUJcwo5ejICoETIMJIwRiYw7SCiHCUJWGDGtenglVz8IkJcgIFiYqAFRtLlGL3AtkUAs4snHMgYjGnMMSCkGGJUZgab5IFnVhIhOKBmMXFAJWWSsU90eCYHFCJOYypEBuYEHG+E4cpX4tAg7f4spkIgYU4WQNI1nQQmOdmZz4XkUpelBNIpnhkBVCUknxhYyCrMSYJeugYHz4wCQyDKEDWYUwk1ciYwKRBNfBZ0Idg05zYnw4FnCnMhHB2ROWXgGj08038NiSlDcmDOey4Go8D0KUJ0uhB+KhOkpmEBMBXpEKIuRAnK7IFqgIpICjh0oydtyCqy2UikgiadnnxpTrPakEPoUqiK+SUXvRgRp46Iq8zkzSKiQIeSwpSsDinGIdSwUrq5FXcmbSdgFxJOcQ50sAiZpjjlgFiFENOYLmisQoYRhROcIAq3lKxmN8vZznr2s6ANrWhHS9rSmva0qE2talfL2ta69rWwjSGtbGdL29ra9ra4za1ud8vb3vr2t8ANrnCHS9ziGrdJAQEAIfkECQMAzAAsAAAAAMgAyACHAAAAVldYj5CTj5CTj5CTj5CTj5CTkpOXl5icl5icl5icl5icmJmdmJmdmJmdmZqempufm5ygnZ6in6CjoKGkoaKloaKloqOmoqOmo6SnpqeqqKmsq6uuq6uuq6yvrKyvrKyvra6xsLGzsrO2s7S2tLW3tLW3tLW3tba4tba4tba4tba4tra5t7i6uLm7ubq8urq9u7u+vLy/vb3Avr7Bvr7Bvr7Bvr7Bvr/Bv7/Cv7/Cv7/CwMDDwcHEwsPFxMXHxcbIxsfIx8jJx8jKx8jKx8jKx8jKx8jKx8jKx8jKx8jKyMnLyMjKyMjKyMjKyMjKyMnLycrMz8/R0dLT0dLT0dLT0dLT0tPU09TV1NXW1dXX1tfY2NjZ2dna2trb29vc3Nzd3Nzd3Nzd3Nzd3Nzd3Nzd3Nzd29zd3Nzd3Nzd3N3e3d3e3t7f3t7f39/g4ODi4eHj4uLj4uLj4uLj4uLk4uPk4+Tl5OTl5eXm5eXm5ebm5ubn5eXm5eXm5eXm5ubn5ubn5ubn5ufn5+jo6Ojp6enq6urr7Ozs7e3u7u7u7u7v7u7v7+/w7+/w7+/w7+/w8PDx8fHy8fHy8vLz9PT09fX19vb29/f3+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+vr6+vr6+/v7+/v7+/v7+/v7+vr7+vr6+vr6+vr7+vr7+vr7+vr7+vr7+/v7+/v7+/v7/Pz8/Pz8/Pz8/Pz8/f39/f39/f39/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////CP4AmQkcSLCgwYMIEypcyLChw4cQI0qcSLGixYsYM2rcyLGjx48gQ4ocSbKkyZMoU6pcybKly5cwY8qcSbOmzZs4c+rcybOnz59AgwodSrSo0aNIkypdyrSp06dQo0qdSrWq1atYs2rdyrWr169gw4odS7as2bNo06pdy7at27dw48qdS7eu3bt48+rdy7ev37+AAwseTLiw4cOIEytWO4xRoUKRhi2+eWiP5T2HJtecdPnyJM0zK3fGDFrm6MulY562nFpjq0uYJEdcvUciL0iJLLUWSImRb0ihZq+OGIkNmOOFWofyzZxR8Ie0IUY6Th0MpdS9mzOCBAz6cIetjP5XByMIu3bf1x1Gdyho/PE75s8zaqX+O0NL7o+XL71KPqPPDa3HUB35WddaJP49t5CACk2X3xu7teIfJLIpxCBCvIjnnm67ZXfeJQxdeFAiBe63GzD+MdKdhfYh1EqBYNC3m0CX+JdeQiIWdEeBicw40DCQ+CcjQjkOhF9+bPDi40DLyRcJi6cp9EaBTy450CT+YZKQaJ1lhhAkBcJn5UASykchQpyNdmNBGRbI4Zi8Jbhllwk56F5ycA4ETJDnrVnQMJE8FllCO7rHxpCDAdPKoitCVGOfGBU6Xo8RJfIGG28o8lYroXTa6SqNNgQopBcV4t4bSj5ESRdXtNpqHf5tDePprKG0UiFDt2mXqkWhjMeGggyF8oar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/////////////////////////////////////////////////////////////////////////////////////wj+AM0JHEiwoMGDCBMqXMiwocOHECNKnEixosWLGDNq3Mixo8ePIEOKHEmypMmTKFOqXMmypcuXMGPKnEmzps2bOHPq3Mmzp8+fQIMKHUq0qNGjSJMqXcq0qdOnUKNKnUq1qtWrWLNq3cq1q9evYMOKHUu2rNmzaNOqXcu2rdu3cOPKnUu3rt27ePPq3cu3r9+/gAMLHky4sOHDiBMrVouMU6VKnZAtvokpkuVImCbXVHX5sirNMzN1tpwJtMzRl03HRG1ZtcZesXhBk8g6ksTGmVq5Fviqk+9UvCLWjpgqD5vjlVzz8s28U/CHwx+mOk6dzWfTvZt3SiXZYfSGvIz+V2eDSDUr7b5fQWf9ENH444NUZ0ffyzv7hq3eHy9vejn6Ttcx9N1CguhnnWuq/OdcQwMmNJ1+e+zWi4KpzLZQgwchI957uu02n3axCHifQpkYyN9uyCgY2YUjIsSLgWw8t5s5sSjICouoLTSIgaXNKBA0qShYX0IYEpSffnl056M5/qEX4EFFDrSHgaksSVCC/8lokGij9XjQJgbGZ+VAE/5XIUKcjbYKQhoa2OGYvCmoZUGVXZYZQg++lxycAyETJHo3stnJYysitON7ecwpGDSMTlQjoBgdOp6XD2WiBx56bPIWMpx2ioyFDkGDZXPqXVTJe3so2ZAqaIjhqqv+f7jlqaegNuSndqpSFMt4eYToEC96vCqsGG+mBc2ss9a6EDLnbacoRcXB92yGkQw7rG1rHYvsrBAhMyRHrUx7UCZkWDssJ21tu62yN6mShrnDmpFrWupumxMvf8BrLaVs1Yssuy8hE0m5+r5qBr9taetvpzO10mrBrwYibrYLexpTKwRDrMaTdVX8KUx4QCzGwXwpXC9MIkcyb14mI/tSKwXrMTFeLVv80hnmnsFxYDXHlEm8lyjG6LENB4IHHpeszOfSTDft9NNQRy311IklYcIAWGet9dYDmJAET4KYAcXYZJdtNhRmCCIWLCNw7bbbI8CCUy9inG233WJ825X+DW/3vfUPOLFx9+Bm6wEWBX4nPkAFOGlB+ONQaHG44n5T0DjkhEv+Fd+Uvw34TYJjfrfhX8HSQedcdyD3TXSLfnbeYiVRAuoDlIAF2GK7bsaJVPfu++/ABy/88MQXn1IsW8QQAw97wtTJGVlk8cfMfm1xgQPYY28GTIcI4b33R8RaWCAjZG/+CDAp8f36TGgaWCgxmC+/A82v1Mn6+AuRRbF6xYLF/PODSf7yl6i9mOF6ADRfDGCShQHi7wi8o0sgTJBA+V0gFM4zggPxhwX3ySUUNqig/EZQP5d0Qn0bXB+x4nJAEWbvAlDwlUzCo8EUgu8QbzGDC7PHAwzepBX+ZrDh93DIllggUIQxCARPNoEFIR6BemBhgwsvsD2HdIKIHMFEoBpyiBpusIRngYIIY+gQTOygAx0gQRo08ocd2MAGTNjiQsKTwj6wpRIJtIEPG4IJEqDxj3eyCCfeSMgdoMshreCCAzvRFh6MUIkPiQUM/vjHI2BEC4Qk5A+gOJBNoPB7VWwLG2wQAxuE8iFaoOQfd4CRJWSSkGiQyCG4kAUugBEwnfCjKjvAShdB4Y1aEJcrX2mDHcgRTkfYJRrXiJAdoOCZKOjlQf5ATGAyDRHKTKMMCyIGaEJTDC5yYzUDOaYYZJMMCRGCN58phISMsppM4FMasgkDhawTmgr+4UE1bSC+JcVCl7uMYEHu+UyFYGKfO+AkYlKpTB4shKAoWMgwiRlLH3Uimx1gpD0JuhBW7NMGxzQND7KpuY3ekyFo2OftdoNNZZJgmwiBKEN4IU5ikhM0k1QmMx/KUYZQs5qfM40esrnAhsi0IUfYp0AVM1JlLvUgR2XIQau5UtCccZeWdEhUGYKFai5BNU2lJAk0atSeNoQVNSVkVTUzT1XutKwnfchPM/nUxCQTjWqMyFYb0kZCllQ1iNBCGmAK13VKBF9ouKnv9mo8rZq1sQ9R5zrbCVmIdHOdFa3sQ5wJTWlq9ldZeGMWFPrZ0pr2tKhNrWpXy9rWuva1sI0zrWxnS9va2va2uM2tbnfL29769rfADa5wh0vc4hr3uMhNrnKXy9zmOve50I2udKerkIAAACH5BAkDAPgALAAAAADIAMgAhwAAAERERo2Oko2Oko2Oko2Oko2Oko2Oko2Oko2Oko2Oko6Pk5KTl5WWmpWWmpWWmpWWmpWWmpaXm5aXm5eYnJqbnpydoJ2eoZ+go5+go5+go5+go6ChpKChpKChpKChpKChpKKjpqOkp6SlqKanqqeoq6iprKiprKmqramqramqramqramqraqqrqqqrqqqrqqrrqqrrqqrrqusr6ytsK6usa+ws7CxtLGytbKztrO0t7KztrKztrKztrKztrO0t7e4uru8vry9v7y9v7y9v7y9v7y9v72+wL2+wL/AwsDBw8HBw8HCxMLDxMPExcTFxsXGx8bHyMfIycfIycfIycfIycfIycfHycfIycfIycfIycfIycfIycjJysrKzMzNztDQ0tDQ0tDQ0tDQ0tDQ0tDQ0tDQ0tDQ0tDQ0tDQ0tDQ0tDQ0s/Q0c/P0dDQ0tHR09HR09PT1dTU1tfX2dnZ29nZ29nZ29nZ29nZ29ra3Nrb3Nvb3dzc3d3d397e397f4ODg4uHh4uLi4+Pj5OTk5ePj5OPj5OPj5OTk5eTk5eTk5eTk5eTl5uXl5uXm5+bm5+bn5+fn6Ojo6erq6uzs7e7u7u/v7/Dw8PDw8PDw8fDw8fDw8fDw8O/v7+7u7+7u7u7u7u3t7u3t7u3t7u3t7e3t7evr7Orq6+np6unq6urq6+vr6+vr7Ozs7O3t7e3t7e3t7e3t7e7u7vHx8fPz9PT09fX19fX19vX19fX19fT09fT09PT09PT09PT09PT09PT09PX19fX19vb29/b29/b29/b29/f3+Pf3+Pf39/f39/f39/f39/f39/f3+Pf3+Pj4+fn5+fn5+vr6+vr6+vr6+vn5+vn5+vn5+vn5+vn5+vr6+vr6+/r6+/v7+/v7+/z8/Pz8/Pz8/Pz8/Pz8/P39/f39/f39/f7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v///////////////////////////////wj+APEJHEiwoMGDCBMqXMiwocOHECNKnEixosWLGDNq3Mixo8ePIEOKHEmypMmTKFOqXMmypcuXMGPKnEmzps2bOHPq3Mmzp8+fQIMKHUq0qNGjSJMqXcq0qdOnUKNKnUq1qtWrWLNq3cq1q9evYMOKHUu2rNmzaNOqXcu2rdu3cOPKnUu3rt27ePPq3cu3r9+/gAMLHky4sOHDiBMrVovO1qVLttAtvjmrkuVKsybXHHb58jDNMyt3xgxa5ujLpWOetpxaYzlv3iRHXF1JIjpas6C1FsjtmG9o4GavjmirEaHjnlqD8838WPCHtCHaOk6dULLU05r/lt0wukNwxqv+E6KUWpp239ygD3dISfzxU9jP+y7n0DtDaO6Pky+9XL60+usxhEp+1rUGjXzOdRegQtPlJ8lu5SAIDXcJ2ZcQOuG5p9tu2cnnDUMWIjQLgfvthg6Cx1B4UIgGgUMgIc/tho83CP6nEIsFnUJgZjIKdCKC9FW4oEH45feIirv1d96GCOE4kCQE2tJjQeZ5mJBonfF4EC0EwjclQRHKNyFCnI3GZEEYEnjml/j0Jl+MBmFJGkINupccmwT9eJ6NBzX2WGQJ6ejeI3AKFscNKNwgh0Q07omRoOJp+dAsjxDyiKRrASHApptaMAhE6ByoXXoXeeKeJEgqNMwfebTa6oP+bKHC6awC3JDJQ2E2F6RF04j3yDQPTfOIq8TmseZZUdBKaxTHIoROlQlmZEulhJxSaELghFJssaGwpYeytDawqEPo7LoRcJP2sW2xtLAFDQPg0irCpzsNE8i6xfJx7VlxxKssELfeNI0k+G6LqVpxwOsvpw0wS1O26hbsKh8Hr5XJDQvPagEqMkHDqsSuSgLsXIOEkPGmDQTsEjQRgwzIZ3clfDIKMA0Cch4U7wVNshnDdHMo+96VCQoLc9wSNBI3MjJgg1QAbgUw+bGuHzAT9oXCnMYB0yz5WpIYNF+ggAIQRsMEjSSDDGJJ0Hi27fbbcMct99x0172bFzdIoPf+3nz3LcENXvAkSR9vFG744Yi/0QesYEEDg9+QQw5DszGBk0fimGOeB9tXHRH55307gZMgmZeOeCNghQD66hKIgNMcpsf+xhypsw56CK/LbjrtX3lue+Si30S67pmj/hU0LfzudwuUwwQOHcQnTgfnWOGt/N9vCE549H14aff34Icv/vjkl2/++TRFIwcQQDjRbUy18CGHHJF8iJgcI3Cgv/57wHSKFAAEoBciYZhIzGB/CJwBTL4QwAa2oWJ7oQUQEEhBDryPJbVooAalIIfm1SUabKhgBWGywQ0Own552UP+RIhAIMBEDiXUoBcmgZdI4ICFFCRBu15SCy/EUIP+cYAgW2hxBBxSkAYX5CEDf9hAOnjwLCo04v5IwIZo0MQbg/AhEwXoPbbsQYr7e8IObQINPmwxgF1MSzRWaEQgEHAns3jDGb2AwrQIQook6J9DdpHGjFjiOg45hRZ/WJu1hBCHVXSIJZIAAxjYABAagUQTjnCENgCSIVhkIiTYEgoWHmGMDLGEDRpJSq9dhIiUpGQTQLkQaMwhhrVoyxOO+EaHSEMHpCRl4C4ih1SmMgp1ZMgslhhAPrxFEEcAwhH0CBE55JKUScDIF3yZyj5I5BRzkMMcCkmYXYzymTCIJkKkAQYhCEEOfDLINKl5hCZcsm1eAGcjIYkQJujgnjr+YEJCIMFOSo6rbamQpyPTSRA64BOfdECIN5jQzyOYEk9BEGgeEgKFg94TCglBZj/b0DZACFQHCrEoPhUChYZu8kvS+CY4UxFSkYI0IZZoaBOC2RpnyvMJC3HpSxOyTnZas0e7ECgMdpFTly4kGQ09wjtT8wSB/jMhOmVIHxqqtd0EVJ42IOhBorqQhTb0oaXBpTzpWVSRNoSf/YxCawgh0CA4hKsM8UJD+6iYpsqTpQ2B60Ji2s/slYaR4NxlXo3qkDf08wtMBacNiPpWwjYkGQylpl9B49FnknWwZn0IWn1JV8XEs5GPjIhezxrZIzy1NKmQAyC0ypDRNsQbkOhrA1jF51r0NTazto1IRS2K0dxGxKAW/alvIWJPfOpzuBGRRi9Ny1rkOve50I2udKdL3epa97rYza52t8vd7nr3u+ANr3jHS97ymve86E2vetfL3va6973wja9850vf+tr3vvjNr373y1+hBAQAIfkECQMA/QAsAAAAAMgAyACHAAAAISEhjI2QkZKWkZKWkZKWkZKWkZKWkZKWlpebmZqemZqemZqemZqemZqemZqempufmpufm5ygnJ2gnZ2hnp6in5+joKCkoKGkoaKloqOmo6SnpKWopKWopKWopKWopKWopKWopKWopKWopKWopKWopqepp6irqquura6xra6xra6xra6xrq+yr7CzsLG0srO2tbW4tra5t7e6uLi7uLi7uLi7ubm8vLy/v8DCwMHDwcLEwMHDwMHDwMHDwcLEwcLEwsPFw8TGxMXHxcXHxsbIx8fJyMjKycnLysrMysrMysrMysrMy8vNy8vNy8vNy8vNzMzOzc3Pzs/Qz9DR0NHS0dLT0tPU09PV09TV1NTW1NTW1NTW1dXW1dXX1dXX1dXX1dXX1dXX1tbX2dna29vd3Nze3d3e3d3e3d7f3d7f3t/g3t/g3t/g3t/g3t/g3t/g3t/g3t/g39/g3t/g3t/g3t/g3t/g3t/g3t/g3t/g3+Dh3+Dh4OHi4eHi4uLj4+Pk5OXl5ebm5ubn5+fo6Ojp6enq6erq6urr6urr6urr6urr6urr6urr6enq6Ojp6Ojp5+jp6Ojp5+fo5+fo5+fo5+fo5+fo5+fo5+fo5+fo5+fo6Ojp6urr7Ozt7e3u7+/w8PDx8PDx8PDx8PDx8PDw7+/w7+/v7u7v7u7v7u/v7+/w7/Dw8PDx8fHx8fHy8fHy8fHy8fHy8fHy8fHy8fHy8fHy8fHy8fHx8fHy8fHy8fHy8fHy8fHy8vLy8vLz8/P09PT09fX19vb29vb39vb39vb29vb29fX29fX19fX19fX19fX19vb29vb29/f39/f3+Pj4+Pj4+Pj4+Pj5+fn5+fn5+fn5+fn6+vr6+vr6+vr6+vr7+vr7+vr7+/v7+/v8+/v8+/v8+/v8+/v8+/v8+/v8/Pz8/Pz8/Pz8/Pz9/f39/f39/f39/f39/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+////////////CP4A+wkcSLCgwYMIEypcyLChw4cQI0qcSLGixYsYM2rcyLGjx48gQ4ocSbKkyZMoU6pcybKly5cwY8qcSbOmzZs4c+rcybOnz59AgwodSrSo0aNIkypdyrSp06dQo0qdSrWq1atYs2rdyrWr169gw4odS7as2bNo06pdy7at27dw48qdS7eu3bt48+rdy7ev37+AAwseTLiw4cOIEyte+wwYsGiLcQZ7RflVsMg1o1WuDBmzTGGbKQvzLDN0ZdIxTVNGrfHdunUTVb+SuE5YsGysBaoDxxscbIiyIw5DVKj4bNTrevf+7TD4w2HFoxd6hnq3ct7vHjpveI649EKgUP6fu85bnXbVD0F9L46qOnnszdE3zLa+eHjS796DM99w+0JP9U3Hmn6+9SffQtDVh0hu+elnoGkMrePderjlZh15zCXkH0LBBHgfgwRmp9CGBp0TYCHn5DZQcu+lOOKBCKES4GUqDhTiixAmRF99hmSoIovv4RiaQhN+N0yNBV14nY8EgRbaaAgJE2B7SBLUYJAIaRZaNQhJGGCFVQ6kpHJMDjRZZTQelOB6oYRZ0JXXuZilY53FyKOcg40BQwowjEFbixjJuF6aD/1iyCCG/PLWDQM02qgFgET0Hn8WhbIeImUmRMwfa3Ta6YJsIeLoqAPA4MpDcMJ30TffGfLNQ/7fGOLprGtwuRYSpJJ6BHUNvTMeb5lKNIwh7OGp0Dqq0EqrKmyZkSupCvjp0DsicpSNsQr90oeytEKp1jMKPEuqCZHuREwg3NLaR7BkjSFurjecetM3iKSrrKJujRHuu44qsCtNyG5rr6d94PuWKzDwO6oFoMJUDacDe4rIq3MBYoLCjSogr0vVCBxxIMTgpS/GKcA0SMRrFLzXM7gqDBPKqrBLlysp8NvwStUM7KpggFjwrAUwAcItICEXRsW+jkrr0i/qHnfYM1SkkMINN3OMyCCDvCKzm1x37fXXYIct9thkkxZFDBCkrfbabEMQgxQ8IbKHF3TXbffdXuxRdf5X1KTQ9t9/p0ANTuecgffhh5+BrVY6AO4420XgJAjilN9NCFgmPK45BCfgVEbloHtRBuabP26C56FXPvpXjZcOeOQ3TZ464pd/1bfrbQtOuOGz3624WFHAgDsEMFwR9xy9ezGHJ2U37/zz0Ecv/fTUV29TNWTccEMRn3w2BxlkoJjYGChwYL75Z8CESBPssz9FIYYV4sL59LsAkxXt52+F038FcwP9AORA91oijPwZsAlksBVfqmGFAAYQJgc8oCAWR5czlM+B9MMBTMgQQQNOYW9yKUQMMAhAFBCKJcKYQgcN2AX+wSUYOiAhAF0wQJgIA38rzF8ZFOgWC8rwfP4osAIPYXIOQagwh+4DIVrO8MPzGeGEM6lGGpDYPiWWpRoXlCEO4LeTV3iBilOgIFn+8EMUpM8hyLBiRVjBq4Yg4ogrpJJaGkhCIToEFEFoQQtg0AeNFKIIO9hBFdq4kCLmkItq+QQGdQDFhIACBnqM5IcqAoxAWrIIwHhINcrQQW+pxQgzROR8bhDJSMLtImSwpCWRwA3g4LB9aXjLH3SAAx2cESJjKGUkg4CRKqjSknuQCCLKQIYyyHEwyICkLlvAS4Rk4wo60MEYwGQQX/5yB0UgpJuksEw99hEhRKCBOGlAhIQU4pqBJIPXENHNPVKTIGUY5zhXZxBuDAGdO/5gRddw0E56GgQJ8hQnEhICCHxWgWt9aCcNFBLQcSoECfgUpYqyocxlqrGh4lQIK/BZhFYiKZfdNMJCMLpQhVjzmsGsETLa2QJkjBSjC3kGPnegTdIYoZ1KSwhJGbIHfGpBRezsJgzeeZCdLsSe+NQna2jQzm++tKENOSc6B4oaQbRTgw0xKkOigE81Guam3fTqQLS6kI2i86ekyeMyT5lVmDpEC+g8qE2XCQOXOoSsMb3nL9HqmYTq0qlthepDpKpKsRaGm3rkY0TwypBC6HUH6swNIsbQB6IyhLEM4UYh9qBU6WHWeoENKGgnAtCAUnW0EIlnQOeAWomEc5zlbE1tRLIxhkBOU7a4za1ud8vb3vr2t8ANrnCHS9ziGve4yE2ucpfL3OY697nQja50p0vd6lr3utjNrna3y93ueve74A2veMdL3vKaNykBAQAh+QQJAwDvACwAAAAAyADIAIcAAABkZGeLjJCLjJCLjJCLjJCLjJCLjJCLjJCLjJCLjJCLjJCLjJCNjpKSk5eUlZmUlZmVlpqVlpqVlpqXmJydnaGenqKenqKenqKenqKenqKenqKfn6Ofn6OfoKOgoKShoaWjo6elpqmmp6qmp6qnqKunqKunqKuoqayoqayoqaynqKunqKunqKuoqayqq66ur7KxsbSxsbSxsbSysrWzs7a0tLe3uLq4uLu5uby7u768vL+8vL+8vL+8vL+8vL+9vcC/v8G/v8LAwMPBwcTCwsTCw8XDw8XDw8bDw8bDxMbExcfExcfExcfFxcfFxcfFxcfFxcfFxcfFxsjFxsjGx8nHyMrIycvKy83Nzc/OztDOztDOztDOztDPz9HPz9HQ0NLR0dPS0tTT09XU1dbX19jY2NnY2NnY2NnY2NrZ2dra2tvc3N7g4eLh4uPi4uPi4uPi4+Ti4+Ti4+Ti4+Ti4+Tk5OXl5ufm5+jn6Ono6Onp6erq6uvq6uvr6+zr6+zs7O3s7O3s7O3s7O3s7O3s7O3s7O3s7O3r7Ozr7Ozr7Ozs7Ozs7O3s7O3s7O3s7O3s7O3s7O3s7O3u7u/y8vLz9PTz8/Py8/Py8/Py8vLx8fLx8fLx8fHw8fHw8PHw8PHw8PHw8PHw8PHx8fLy8/P09PX19fX19vb19vb19vb19vb19vb19fb19fb19fb19vb19vb19vb19vb09fX19fb19vb19vb29vb39/f3+Pj4+Pj4+Pj3+Pj3+Pj3+Pj3+Pj3+Pj3+Pj3+Pj4+Pj4+Pj4+Pj4+Pj4+fn5+fn5+fr6+vr6+vr6+vr6+vr6+vr6+vr6+vv7+/v7+/v7+/v7+/v8/Pz8/Pz9/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f3+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7///////////////////////////////////////////////////////////////////8I/gDfCRxIsKDBgwgTKlzIsKHDhxAjSpxIsaLFixgzatzIsaPHjyBDihxJsqTJkyhTqlzJsqXLlzBjypxJs6bNmzhz6tzJs6fPn0CDCh1KtKjRo0iTKl3KtKnTp1CjSp1KtarVq1izat3KtavXr2DDih1LtqzZs2jTql3Ltq3bt3Djyp1Lt67du3jz6t3Lt6/fv4ADCx5MuLDhw4gTK1Z77hguXMrOLb6J65TlU7gm14R2+TI0zTOPdbZ8DLTM0ZdNx0RtWbXGN1Oy6JLI+pTEc7hYfXb97oaA3w7GRKwdUReg44AquR7zu7kA4Q+JPzSO/Dgy1TCcA+8UnfXDatWR/mtSXUL77xvdUT/UFP74eNPZzQt441A6Q2jt3ateI18AiPreNTRJfoBcpxoF/UG3kH0KUdfeJLy90Z8Dsy0YoELnEAjIbq7FZ54TDDGIECsEvsdbJ/0JwJ1CIhoEHoHV8DaQE/2hYKF6CrGXHysyDqSLA/3Rl1CLBOFHoGQ9CsScfBSweOFBA+ZXYZICfdBfFgmJNlppCOFSIpUESSgfhQhxNhqHBWVIIJpg+iafggZVdllmCDkYnnJgEtQJkOaVkNA5yjwWWUI6thdjYWXcEMMNZkhEY58YFVodjxHNgggfiMzyFhARdNppCHZApAuC2qF3USUPIumQLnfE4aqr/oC05YentEZwg4kM7cFnc3tgFE170TwUDSKvFhuHgWpdUWutWEy5UCflCRCcRg5qcihD12hirLG4osXGsrVW0KhDnQjJETTXMjSLHdsaS6daulQAbq0ohLqTLnm0a6wd17RVxrzLAtHtTL/qu62mbpUhL8CeVtAsTdmya/CrdiD8liY2MExrCH7IhEyrE786SbBz2YGCxp1WMLBKyEgcch7O0qUwyjHAxEfIcVS8ly7KagwTzpr025cmMDDccUvITIwIyYDZEQK4IcAEsrF3xBxYGAt7WgZMs+xrSWK6hAEDDEAcDRMyk/DBhyVC5+n223DHLffcdNdtd55e3MDB/t589+03Bzd4wdMib6hh+OGIJ67GG4uIpUsMf0ceeQxWy3RNG4pnnnkbbXdVhOSg+20FTnhobnrifID1Quisc/ACTmycLrsabKjeeuiv3xT77KbX/tXnt0s++k2l86556l89HvzflON0ufGKcy5W3ssDTsbghUP/BoR3d+/99+CHL/745JdfUzJqBBHEFdzDdEsbbLDBB9OGpQEDCvjj77tLgHjhv/9iQB5h9lCD/BmwBjAhw/8WSAY8AaYSQTCgBFHQvpXcYoEY9AIbkLWXZJBhghOESQYziAf63YUN9wOhAYMAEzaMEINiiNVd9oADFUoQBg5syS3E8EIMmiGH/nCphBJsKMEaVNAlt1BgDxe4wbigkIj5g8EYkkGTaOCBh0sEoAzbwgYo5u8KQJwJMtqQxf9tUS3JSCERg9CrnVTCDGUUgwnPYjIiwmB/DCGRRzyRi4cAAos99ARbxkDEKTrEE06gAQ1uYK6L7OEKU5jCGPrYECsuUYBpmYQKjRDGhHjiBooMpSBPFclSgvEhyHDhCG/RlisUsY0OUcYOQhlKwV2EDaUsZRbmqJBKKPF/bXiLHYwQBCPg0SFpoGUoQXQRMuSylHGQCCDix4ZREoYVoFQmDZh5kGiQYQlLUAMvBeLMZ07hCpR8mxe0qchGFuQKO4jnDq6QkD2YM5LH/qSSH9i5SGUghA3ylGc+BRINSN7TmmAaAj8HKpAsBDSeWELIHe4pSbe9gZ86UMhD5amQLFAUlj1SRja1abaDbDSeCvEERa8wTtAkk51YWMhJd7CQcpozmj1iBT9pQKmEzHQhuaDoFNLpGizwMw0M+elC4kDRcblmn+y8gT9lelKGFJSiCAWNDvjpToQodSH2vGdETYMHfg7BIV9dCBgoesbJGJWdJdVoVRui0ns6VTOJ1KYtG5LWhZjhntczzVtpeYOeJnWuDcmFQXN518lcVJldletGIRLWXLZ1MutUJCMj0tdcLZahi/FDGt4wVYh01qp7iENWv3da8/EVsa6FYYhDHzrW2D4EoA91g20lAk950nO3EYmGGpSgBHEC97jITa5yl8vc5jr3udCNrnSnS93qWve62M2udrfL3e5697vgDa94x0ve8pr3vOhNr3rXy972uve98I2vfOdL3/omJSAAOwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
  }
  #json-preview-div .overlay-container .overlay-content span {
    color: #8B8C90;
    font-size: 11px !important;
    font-weight: 500;
  }
  #json-preview-div .overlay-container .overlay-content span.loading {
    margin-left: -5pxpx;
  }

  #json-preview-div div.lines-container {
    margin: 0;
    padding: 0;
    width: 1200px;
  }
  #json-preview-div span.error {
    margin-left: 15px;
  }

  #json-preview-div div.line {
    margin: 0;
    height: 20px;
    overflow: hidden;

    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;

    position: relative;
  }
  #json-preview-div div.line.hidden {
    display: none;
  }
  #json-preview-div div.line:hover {
    background-color: #F4F4F4;
  }
  #json-preview-div div.line:hover span.line-number,
  #json-preview-div div.line:hover div.fold {
    background-color: #FBFBFB;
  }
  #json-preview-div div.line:hover span.line-number {
    color: #8B8C90;
  }
  #json-preview-div div.line span {
    height: 20px;
    line-height: 20px;
    margin: 0;
    padding: 0;

    color: #3A3C42;
    font-size: 12px;
    font-family: Menlo;
    font-weight: 400;
  }
  #json-preview-div div.line span.line-number {
    text-align: right;
    color: #C4C4C4;
  }
  #json-preview-div div.line span.line-number.digits-1 { width: 20px; }
  #json-preview-div div.line span.line-number.digits-2 { width: 28px; }
  #json-preview-div div.line span.line-number.digits-3 { width: 36px; }
  #json-preview-div div.line span.line-number.digits-4 { width: 44px; }
  #json-preview-div div.line span.line-number.digits-5 { width: 52px; }

  #json-preview-div div.line div.fold {
    width: 24px;
    height: 20px;

    margin: 0;
    padding: 0;

    position: relative;
  }
  #json-preview-div div.line div.fold div.arrow {
    position: absolute;
    top: 1px;
    left: 0;

    width: 24px;
    height: 18px;

    margin: 0;
    padding: 0;

    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAkCAYAAADPRbkKAAAABGdBTUEAALGPC/xhBQAAASNJREFUWAntV0EKwjAQTMV/2Kv0FaI3Qd+q4E3xFcVr/UYuygQWQrDblN1ECrsgUTeZnZ3ZVGy89x+34FgtmHugbg3820FzwBwQKmAjJBRQfNwcEEsoBDAHhAKKj5sDkHAY3uGVK+fc/Rzumkvm5EDmcr2FrV23dYf9jj12fzxd37/CnvPp6Np2w+6fSqqOEIiB4FjE5Mf2zP1e3AAUhPIUY02k5HFGqj5qihsACMaGa+IX+alRA25OiO8AFSFCNN+0Ih+/z7knhJmzNtr/iVO1YxLa5IGtMkIxyXScKFeCfJEGAJo2UYo8aqmPEEAp8BuB0HjaEGa6Fm0gLVbis/odKEGSw7QGOHVq5MyBGipzNcwBTp0aOXOghspcDXOAU6dG7gvq7l7P4wkeZwAAAABJRU5ErkJggg==');

    opacity: 0.5;
  }
  #json-preview-div div.line div.fold:hover div.arrow {
    opacity: 1;
  }
  #json-preview-div div.line div.fold div.arrow.folded {
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAkCAYAAADPRbkKAAAABGdBTUEAALGPC/xhBQAAAPpJREFUWAntmEEKg0AMRcfiPeq2eIrSXriF7lp6CulWrzGbli8E6qCryU8QEpBhFk7y/o9RbHLO37TjOOy49rn0APB2MBwIByoViBaqFLD69nBgTcJxnBIui2i1k6Dw2/0xH9v3p3S9nLVTLM6jttAwfNLz9V4k1N6oA3TdMUF5CTaEOgAKR9tYQVAALCFoAFYQVIAtCM0RSwcABDPoABijmEQSeLgxqbSCCrBWvPaLjQZgUTxcpABYFU8BwIQpe167bf6fH4oDksDiY65h/NiSOa85bUSUcqUAlEmYe2oLMQuXswNAlPBawwEv5SVvOCBKeK3hgJfykvcHIFxcUeT6si8AAAAASUVORK5CYII=');
  }

  #json-preview-div div.line span.bracket {

  }
  #json-preview-div div.line span.indent {
    width: 0;
  }
  #json-preview-div div.line span.indent.indent-1 { width: 13px; }
  #json-preview-div div.line span.indent.indent-2 { width: 26px; }
  #json-preview-div div.line span.indent.indent-3 { width: 39px; }
  #json-preview-div div.line span.indent.indent-4 { width: 52px; }
  #json-preview-div div.line span.indent.indent-5 { width: 65px; }
  #json-preview-div div.line span.indent.indent-6 { width: 78px; }
  #json-preview-div div.line span.indent.indent-7 { width: 91px; }
  #json-preview-div div.line span.indent.indent-8 { width: 104px; }
  #json-preview-div div.line span.indent.indent-9 { width: 117px; }
  #json-preview-div div.line span.indent.indent-10 { width: 130px; }

  #json-preview-div div.line span.key {
    color: #E4564A;
  }
  #json-preview-div div.line span.colon {

  }
  #json-preview-div div.line span.value-quote-start {
    color: #50A14F;
  }
  #json-preview-div div.line span.url,
  #json-preview-div div.line span.boolean,
  #json-preview-div div.line span.null {
    color: #0184BC;
  }
  #json-preview-div div.line span.url {
    border-bottom: 1px solid rgba(1, 132, 188, 0.8);
    height: 19px;
  }
  #json-preview-div div.line span.string {
    color: #50A14F;
  }
  #json-preview-div div.line span.number {
    color: #986901;
  }
  #json-preview-div div.line span.value-quote-end {
    color: #50A14F;
  }
  #json-preview-div div.line span.dots {
    width: 11px;
    height: 6px;

    margin-top: 8px;
    margin-left: 0px;

    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAMCAYAAABm+U3GAAAABGdBTUEAALGPC/xhBQAAAKBJREFUOBG1k8ENwyAMRW1UtugIXBmii4SZ8CIdgisjdAsOlI9iKSpShQTxxc7HPL1DYBF5EZHUWp+tLxUzfxrgaPU2bdgChdEpJ5jNDlOAtJQH41vq8Uv13pNzjnLOlFLqx7PZlTUYA2qt7XBdnM10H30Aw7SU0o11cTbTfXSOMdZrsGMOIfBgvAMMhjl/6l08Uh6MD/1YpevLW+X8vf8FdjlMF1GUF+wAAAAASUVORK5CYII=');
  }
  #json-preview-div div.line div.thumbnail-container {
    width: 16px;
    height: 16px;
    margin: 0;

    position: absolute;
    top: 2px;

    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;

    align-items: center;
    justify-content: center;
    align-content: center;
  }
  #json-preview-div div.line .thumbnail-container img {
    margin: 0 auto;

    max-width: 16px;
    max-height: 16px;

    border-radius: 2px;
    overflow: hidden;
  }
  #json-preview-div div.line span.comma {

  }
  #json-preview-div div.line span.end {

  }

  #json-preview-div div.line span.full-url {
    display: none;
  }
  `
}

function getJSONPreviewSegment(refreshButton, populateButton, cancelButton, okButton) {
  return `
  <div class="json-preview-container">
    <div id="json-preview-div"></div>

    ${
      refreshButton
        ? `
      <div class="button-container">
        <button id="json-preview-reload-button" uxp-variant="cta">${Strings(
          STRINGS.RELOAD
        )}</button>
      </div>
    `
        : ''
    }

    <div class="footer">
      <div class="button-container">
        ${
          cancelButton
            ? `
          <button id="cancel-button">${Strings(STRINGS.CANCEL)}</button>
        `
            : ``
        }
        ${
          okButton
            ? `
          <button id="ok-button" uxp-variant="cta">${Strings(STRINGS.OK)}</button>
        `
            : ``
        }
        ${
          populateButton
            ? `
          <button id="populate-button" uxp-variant="cta">${Strings(STRINGS.POPULATE)}</button>
        `
            : ``
        }
      </div>
    </div>
  </div>
  `
}

function getJSONPreview(_data, submitForm) {
  log('get json preview')
  let JSONPreviewDIV = document.getElementById('json-preview-div')
  enablePopulateButton(submitForm)

  if (!_data) {
    showDataPreviewError(JSONPreviewDIV, Strings(STRINGS.UNABLE_TO_PREVIEW_JSON))
  } else {
    let data = JSON.parse(JSON.stringify(_data))

    let string = JSON.stringify(data, null, '\t')
    let realLines = string.split('\n')
    let lines
    let linesSlicedTo250 = false

    let autoFoldLines = []
    if (realLines[0].trim() === '[') {
      lines = realLines

      for (let i = 1; i < lines.length; i++) {
        if (lines[i] === '\t{') {
          autoFoldLines.push([i])
        } else if (['\t}', '\t},'].indexOf(lines[i]) > -1) {
          autoFoldLines[autoFoldLines.length - 1].push(i)
        }
      }
    } else {
      lines = realLines.slice(0, 250)

      if (realLines.length > 250) {
        linesSlicedTo250 = true
      }
    }

    let lineNumberDigits = lines.length.toString().length

    let indent = 0
    lines = lines.map((line, index) => {
      line = line.trim()
      let lineElements = {}

      let valueClass
      let foldArrow
      let key, value
      if (line.indexOf(':') > -1) {
        key = line.substring(0, line.indexOf(':')).trim()
        value = line.substring(line.indexOf(':') + 1, line.length).trim()
        lineElements.key = key
      } else {
        value = line
      }

      let hasComma = value[value.length - 1] === ','
      if (hasComma) value = value.substring(0, value.length - 1)

      if (/^"/.test(value)) {
        value = value.substring(1, value.length - 1)
        if (Utils.isValidURL(value, true)) {
          lineElements.fullURL = value
          valueClass = 'url'
        } else {
          valueClass = 'string'
        }
      } else {
        if (/true|false/.test(value)) {
          valueClass = 'boolean'
        } else if (/null/.test(value)) {
          valueClass = 'null'
        } else if (
          value.indexOf('{') === -1 &&
          value.indexOf('}') === -1 &&
          value.indexOf('[') === -1 &&
          value.indexOf(']') === -1
        ) {
          valueClass = 'number'
        }
      }

      let ellipsisStart, ellipsisEnd, httpStart
      if (valueClass === 'url') {
        httpStart = value.split('://')[0] + '://'
        if (value.indexOf('/') > -1 && value[value.length - 1] !== '/') {
          ellipsisStart = true
          value = '/' + value.split('/')[value.split('/').length - 1]
        }
        if (value.indexOf('?') > -1) {
          ellipsisEnd = true
          value = value.split('?')[0]
        }
      }
      if (value.length > 70) {
        ellipsisEnd = true
        value = value.substring(0, 70)
      }

      if (ellipsisStart) value = httpStart + '...' + value
      if (ellipsisEnd) value = value + '...'

      lineElements.value = value

      let currentIndent = indent
      if (['[', '{'].indexOf(lineElements.value) > -1) {
        indent++
        foldArrow = true
      }
      if (['}', '},', ']', '],'].indexOf(lineElements.value) > -1) {
        indent--
        currentIndent--
      }

      let hiddenLine = false
      let hiddenStartLine = false
      let hiddenStartLineIndex
      if (autoFoldLines.length > 1) {
        for (let i = 1; i < autoFoldLines.length; i++) {
          let start = autoFoldLines[i][0]
          let end = autoFoldLines[i][1]

          if (index >= start && index <= end) {
            if (index === start) {
              hiddenStartLine = true
            } else {
              hiddenStartLineIndex = start
              hiddenLine = true
            }
            break
          }
        }
      }

      return `
      <div id="line-${index}" class="line${
        hiddenLine ? ` hidden hidden-${hiddenStartLineIndex}` : ''
      }">
        <span class="line-number digits-${lineNumberDigits}">${index + 1}</span>
        <div class="fold">
          ${
            foldArrow && !linesSlicedTo250
              ? `
            <div class="arrow${hiddenStartLine ? ' folded' : ''}"></div>
          `
              : ''
          }
        </div>
        <span class="indent indent-${currentIndent}"></span>
        ${
          lineElements.key
            ? `
          <span class="key">${lineElements.key}</span>
          <span class="colon">:</span>
        `
            : ''
        }
        ${
          valueClass === 'url' || valueClass === 'string'
            ? `
          <span class="value-quote-start">"</span>
          <span ${
            valueClass === 'url' ? `title="${lineElements.fullURL}"` : ''
          } class="value ${valueClass}">${lineElements.value}</span>
          <span class="value-quote-end">"</span>
        `
            : `
          <span class="value ${valueClass}">${lineElements.value}</span>
        `
        }
        ${
          hasComma
            ? `
          <span class="comma">,</span>
        `
            : ''
        }
        ${
          hiddenStartLine
            ? `
          <span class="dots"></span>
        `
            : ''
        }
        ${
          valueClass === 'url'
            ? `
          <span class="full-url">${lineElements.fullURL}</span>
        `
            : ''
        }

        <span class="end"></span>
      </div>
      `
    })

    if (linesSlicedTo250) {
      let endLine =
        '<div class="line"><span class="line-number digits-' +
        lineNumberDigits +
        '">.</span><div class="fold"></div></div>'
      lines.push(endLine)
      lines.push(endLine)
      lines.push(endLine)
    }

    let linesContainerDIV = document.createElement('div')
    linesContainerDIV.className = 'lines-container'
    linesContainerDIV.innerHTML = lines.join('')

    JSONPreviewDIV.innerHTML = ''
    JSONPreviewDIV.className = ''
    JSONPreviewDIV.appendChild(linesContainerDIV)

    linesContainerDIV.addEventListener('click', async e => {
      if (
        (['arrow', 'arrow folded'].indexOf(e.target.className) > -1 &&
          e.target.tagName === 'DIV') ||
        (e.target.className === 'dots' && e.target.tagName === 'SPAN')
      ) {
        let data = JSON.parse(JSON.stringify(_data))
        let string = JSON.stringify(data, null, '\t')
        let lines = string.split('\n')

        let arrow
        if (e.target.className.indexOf('arrow') > -1 && e.target.tagName === 'DIV') {
          arrow = e.target
        } else if (e.target.className.indexOf('dots') > -1 && e.target.tagName === 'SPAN') {
          arrow = e.target.parentNode
            .getElementsByClassName('fold')[0]
            .getElementsByClassName('arrow')[0]
        }

        let arrowIndex = Number(arrow.parentNode.parentNode.id.split('-')[1])
        let arrowLine = lines[arrowIndex]
        let arrowLineElement = JSONPreviewDIV.getElementsByClassName('line')[arrowIndex]

        let arrowLineIndent = 0
        for (let i = 0; i <= arrowLine.length; i++) {
          if (arrowLine[i] === '\t') arrowLineIndent++
        }

        let foldEndIndex
        for (let i = arrowIndex; i < lines.length; i++) {
          let line = lines[i]
          let lineIndent = 0
          for (let j = 0; j <= line.length; j++) {
            if (line[j] === '\t') lineIndent++
          }

          if (lineIndent === arrowLineIndent && i !== arrowIndex) {
            foldEndIndex = i
            break
          }
        }

        // let foldEndLineValue = lines[foldEndIndex].trim()
        if (arrow.className === 'arrow') {
          let dotsSpan = document.createElement('span')
          dotsSpan.className = 'dots'
          arrowLineElement.insertBefore(dotsSpan, arrowLineElement.getElementsByClassName('end')[0])

          let lineDIVs = JSONPreviewDIV.getElementsByClassName('line')

          for (let i = arrowIndex + 1; i <= foldEndIndex; i++) {
            if (lineDIVs[i].className === 'line')
              lineDIVs[i].className = 'line hidden hidden-' + arrowIndex
          }

          arrow.className = 'arrow folded'
        } else {
          let arrowLineValue
          if (arrowLine.indexOf(':') > -1) {
            arrowLineValue = arrowLine
              .substring(arrowLine.indexOf(':') + 1, arrowLine.length)
              .trim()
          } else {
            arrowLineValue = arrowLine.trim()
          }
          arrowLineElement.getElementsByClassName('value')[0].textContent = arrowLineValue
          arrowLineElement.getElementsByClassName('dots')[0].remove()
          // arrowLineElement.getElementsByClassName('foldEndLineValue')[0].remove()

          let lineDIVs = JSONPreviewDIV.getElementsByClassName('line')
          for (let i = arrowIndex + 1; i <= foldEndIndex; i++) {
            if (lineDIVs[i].className === 'line hidden hidden-' + arrowIndex) {
              lineDIVs[i].className = 'line'
            }
          }

          arrow.className = 'arrow'
        }
      } else if (e.target.className === 'value url' && e.target.tagName === 'SPAN') {
        let elem = e.target
        let fullURL = elem.parentNode.getElementsByClassName('full-url')[0].textContent

        let thumbnailContainerDIV = document.createElement('div')
        thumbnailContainerDIV.className = 'thumbnail-container'
        thumbnailContainerDIV.style.left = lineNumberDigits * 8 + 12 + 5

        let img = document.createElement('img')
        img.src = fullURL

        thumbnailContainerDIV.appendChild(img)

        if (elem.parentNode.getElementsByClassName('thumbnail-container').length === 0) {
          elem.parentNode.appendChild(thumbnailContainerDIV)
        }
      }
    })
  }

  JSONPreviewDIV.scrollTop = 0
}

/**
 * Creates and shows the dialog used when running the View Active Configuration
 * command.
 *
 * @param {Object} activeConfiguration
 * @param {Object} activeConfigurationSpecific
 * @param {Object} json
 */
export async function showActiveConfigurationDialog(
  activeConfiguration,
  activeConfigurationSpecific,
  options,
  data
) {
  return new Promise(async (resolve, reject) => {
    let config = {}
    if (activeConfiguration.type === 'preset') {
      config.type = Strings(STRINGS.POPULATE_WITH_PRESET_TITLE)
      config.presetSegment = `
      ${getSubTitleSegment(Strings(STRINGS.PRESET))}
      <label class="input-container">
        <input readonly="true" id="path-input" type="text" />
      </label>
      `
    } else if (activeConfiguration.type === 'JSON') {
      config.type = Strings(STRINGS.POPULATE_WITH_JSON_TITLE)
      config.JSONSegment = `
      ${getSubTitleSegment(Strings(STRINGS.JSON_FILE))}
      <label class="input-container">
        <input readonly="true" id="json-input" type="text" />
      </label>
      `
    } else if (activeConfiguration.type === 'JSONURL') {
      config.type = Strings(STRINGS.POPULATE_FROM_URL_TITLE)
      if (Object.keys(activeConfigurationSpecific.headers).length > 1) {
        config.JSONURLSegment = `
          ${getSubTitleSegment(Strings(STRINGS.URL))}
          
          <div class="additional-options">
            ${getSubTitleSegment(Strings(STRINGS.HEADERS))}
            <label class="headers-container"></label>
          </div>
          
          <label class="input-container">
            <input readonly="true" id="json-url-input" type="text" />
          </label>
        `
      } else {
        config.JSONURLSegment = `
        ${getSubTitleSegment(Strings(STRINGS.URL))}
        <label class="input-container">
          <input readonly="true" id="json-url-input" type="text" />
        </label>
        `
      }
    }

    document.body.innerHTML = `
    <style>
      ${getPopulatorUIStyles()}
      ${getJSONStyles()}

      span.populate-command-value {
        display: flex;

        margin: 0;
        padding: 0;

        color: #2C2C2C !important;
        font-size: 12px !important;
        line-height: 16px;

        margin-top: 2px;
        margin-bottom: 16px;
      }

      .headers-container .header input.header-value {
        margin-right: 0;
      }
    </style>
    <dialog id="dialog">
      <form method="dialog">

        <div class="left-right-container">

          <div class="left">
            ${getTitleSegment(
              Strings(STRINGS.LAST_USED_DATA_TITLE),
              Strings(STRINGS.LAST_USED_DATA_DESCRIPTION)
            )}

            <div class="content-left">
              ${getSubTitleSegment(Strings(STRINGS.COMMAND), false, true)}
              <span class="populate-command-value">${config.type}</span>

              ${activeConfiguration.type === 'preset' ? config.presetSegment : ''}
              ${activeConfiguration.type === 'JSON' ? config.JSONSegment : ''}
              ${activeConfiguration.type === 'JSONURL' ? config.JSONURLSegment : ''}

              ${getSubTitleSegment(
                Strings(STRINGS.DATA_PATH),
                Strings(STRINGS.DATA_PATH_HELP_TEXT)
              )}
              <label class="input-container">
                <input readonly="true" id="json-key-input" type="text"/>
              </label>

              ${getSubTitleSegment(Strings(STRINGS.DATA_OPTIONS))}
              <label class="row">
                <input readonly="true" type="checkbox" id="randomize-data-checkbox" checked="false" />
                <span>${Strings(STRINGS.RANDOMIZE_DATA_ORDER)}</span>
              </label>
              <label class="row">
                <input readonly="true" type="checkbox" id="trim-text-checkbox" checked="false" />
                <span>${Strings(STRINGS.TRIM_TEXT)}</span>
              </label>
              <label class="row is-last">
                <input readonly="true" type="checkbox" id="insert-ellipsis-checkbox" checked="false" />
                <span>${Strings(STRINGS.INSERT_ELLIPSIS)}</span>
              </label>

              ${getSubTitleSegment(
                Strings(STRINGS.DEFAULT_SUBSTITUTE),
                Strings(STRINGS.DEFAULT_SUBSTITUTE_HELP_TEXT)
              )}
              <label class="input-container">
                <input readonly="true" id="default-substitute-input" type="text"/>
              </label>
            </div>
          </div>

          <div class="right">
            ${getJSONPreviewSegment(false, false, false, true)}
          </div>

        </div>

      </form>
    </dialog>
    `

    let ok = false

    // get references to elements
    const dialog = document.getElementById('dialog')
    const questionMarks = document.getElementsByClassName('question-mark')

    let pathInput
    if (activeConfiguration.type === 'preset') pathInput = document.getElementById('path-input')

    let jsonInput
    if (activeConfiguration.type === 'JSON') jsonInput = document.getElementById('json-input')

    let urlInput
    let headers = {}
    if (activeConfiguration.type === 'JSONURL') urlInput = document.getElementById('json-url-input')

    const JSONKeyInput = document.getElementById('json-key-input')

    const randomizeDataCheckbox = document.getElementById('randomize-data-checkbox')
    const trimTextCheckbox = document.getElementById('trim-text-checkbox')
    const insertEllipsisCheckbox = document.getElementById('insert-ellipsis-checkbox')
    const defaultSubstituteInput = document.getElementById('default-substitute-input')

    const okButton = document.getElementById('ok-button')

    // set initial values
    if (activeConfiguration.type === 'preset')
      pathInput.value = activeConfigurationSpecific.path.split(`presets${global.pathSeparator}`)[1]
    if (activeConfiguration.type === 'JSON')
      jsonInput.value = activeConfigurationSpecific.nativePath.split(global.pathSeparator)[
        activeConfigurationSpecific.nativePath.split(global.pathSeparator).length - 1
      ]
    if (activeConfiguration.type === 'JSONURL') {
      urlInput.value = activeConfigurationSpecific.url

      headers = activeConfigurationSpecific.headers
      if (Object.keys(activeConfigurationSpecific.headers).length > 1) {
        let headersContainer = document.getElementsByClassName('headers-container')[0]
        for (const [key, value] of Object.entries(headers)) {
          if (key !== 'X-Product') {
            let headerElem = createHeaderElement(key, value, true)
            headersContainer.appendChild(headerElem)
          }
        }
      }
    }

    JSONKeyInput.value = activeConfigurationSpecific.key

    getJSONPreview(data)

    randomizeDataCheckbox.checked = options[OPTIONS.RANDOMIZE_DATA]
    trimTextCheckbox.checked = options[OPTIONS.TRIM_TEXT]
    insertEllipsisCheckbox.checked = options[OPTIONS.INSERT_ELLIPSIS]
    defaultSubstituteInput.value = options[OPTIONS.DEFAULT_SUBSTITUTE]

    // add event listeners
    for (let i = 0; i < questionMarks.length; i++) {
      questionMarks[i].addEventListener('pointerenter', e => {
        questionMarkEnterHandler(e)
      })
      questionMarks[i].addEventListener('pointerleave', e => {
        questionMarkLeaveHandler(e)
      })
    }

    okButton.addEventListener('click', () => {
      ok = true
      dialog.close()
      resolve()
    })

    // show modal
    try {
      await dialog.showModal()
    } catch (e) {
    } finally {
      if (!ok) {
        log(Strings(STRINGS.CLOSED_DIALOG_WITH_ESC_KEY))
        reject(new Error(Strings(STRINGS.CLOSED_DIALOG_WITH_ESC_KEY)))
      }
      dialog.remove()
    }
  })
}

/**
 * Creates a new alert with a title and message.
 *
 * @param {String} title
 * @param {String} message
 */
export async function createAlert(title, message) {
  document.body.innerHTML = `
  <style>
    #dialog form {
      width: 350px;
    }
    footer {
      padding-right: 2px;
      padding-top: 1px;
    }
  </style>
  <dialog id="dialog">
    <form method="dialog">
      <h1>${title}</h1>
      <p>${message}</p>
      <footer>
        <button id="ok-button" uxp-variant="cta">${Strings(STRINGS.OK)}</button>
      </footer>
    </form>
  </dialog>
  `

  // get references to elements
  const dialog = document.getElementById('dialog')
  const okButton = document.getElementById('ok-button')

  // add event listeners
  okButton.addEventListener('click', () => {
    dialog.close()
  })

  // show modal
  try {
    await dialog.showModal()
  } catch (e) {
    log(Strings(STRINGS.CLOSED_DIALOG_WITH_ESC_KEY))
  } finally {
    dialog.remove()
  }
}
