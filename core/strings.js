/**
 * Strings
 *
 * Provides access to strings used in the UI across the plugin.
 */

// Data Populator
export const DATA_POPULATOR_TITLE = 'dataPopulatorTitle'
export const DATA_POPULATOR_DESCRIPTION = 'dataPopulatorDescription'
export const DATA_POPULATOR_URL = 'dataPopulatorURL'

// Populate with Preset
export const POPULATE_WITH_PRESET_TITLE = 'populateWithPresetTitle'
export const POPULATE_WITH_PRESET_DESCRIPTION = 'populateWithPresetDescription'
export const PRESET = 'preset'
export const NO_PRESETS_FOUND = 'noPresetsFound'
export const CONNECTION_FAILED = 'connectionFailed'
export const UNABLE_TO_DOWNLOAD_PRESETS = 'unableToDownloadPresets'
export const NO_JSON_FILES_IN_PRESETS_FOLDER = 'noJSONFilesInPresetsFolder'
export const NO_PRESETS_FOLDER = 'noPresetsFolder'
export const CREATE_PRESET_FOLDER = 'createPresetsFolder'
export const INVALID_PRESET = 'invalidPreset'
export const SELECTED_PRESET_INVALID = 'selectedPresetInvalid'
export const UNABLE_TO_LOAD_SELECTED_PRESET = 'unableToLoadSelectedPreset'
export const UNABLE_TO_LOAD_LAST_USED_PRESET = 'unableToLoadLastUsedPreset'

// Populate with JSON
export const POPULATE_WITH_JSON_TITLE = 'populateWithJSONTitle'
export const POPULATE_WITH_JSON_DESCRIPTION = 'populateWithJSONDescription'
export const JSON_FILE = 'JSONFile'
export const BROWSE = 'browse'
export const NO_FILE_SELECTED = 'noFileSelected'
export const SELECT_JSON_FILE = 'selectJSONFile'
export const INVALID_JSON_FILE = 'invalidJSONFile'
export const SELECTED_JSON_FILE_INVALID = 'selectedJSONFileInvalid'
export const UNABLE_TO_LOAD_SELECTED_JSON_FILE = 'unableToLoadJSONFile'

// Populate from URL
export const POPULATE_FROM_URL_TITLE = 'populateFromURLTitle'
export const POPULATE_FROM_URL_DESCRIPTION = 'populateFromURLDescription'
export const URL = 'URL'
export const URL_PLACEHOLDER = 'URLPlaceholder'
export const NO_URL_ENTERED = 'noURLEntered'
export const ENTER_URL = 'enterURL'
export const INVALID_URL = 'invalidURL'
export const URL_ENTERED_INVALID = 'URLEnteredInvalid'
export const UNABLE_TO_LOAD_JSON_AT_URL = 'unableToLoadJSONAtURL'
export const UNABLE_TO_LOAD_JSON_AT_LAST_USED_URL = 'unableToLoadJSONAtLastUsedURL'
export const HEADERS = 'headers'
export const ADD = 'add'
export const NAME = 'name'
export const VALUE = 'value'
export const REMOVE = 'remove'
export const LOAD = 'load'

// Populate Again
export const POPULATE_AGAIN_TITLE = 'populateAgainTitle'
export const POPULATE_AGAIN_DESCRIPTION = 'populateAgainDescription'
export const NO_ACTIVE_CONFIGURATION = 'populateAgainNoActiveConfiguration'

// Populate
export const DATA_PATH = 'dataPath'
export const DATA_PATH_PLACEHOLDER = 'dataPathPlaceholder'
export const DATA_PATH_HELP_TEXT = 'dataPathHelpText'
export const DATA_OPTIONS = 'dataOptions'
export const RANDOMIZE_DATA_ORDER = 'randomizeDataOrder'
export const TRIM_TEXT = 'trimText'
export const INSERT_ELLIPSIS = 'insertEllipsis'
export const DEFAULT_SUBSTITUTE = 'defaultSubstitute'
export const DEFAULT_SUBSTITUTE_HELP_TEXT = 'defaultSubstituteHelpText'
export const DEFAULT_SUBSTITUTE_PLACEHOLDER = 'defaultSubstitutePlaceholder'
export const LAYOUT_OPTIONS = 'layoutOptions'
export const CREATE_GRID = 'createGrid'
export const ROWS = 'rows'
export const COLUMNS = 'columns'
export const MARGIN = 'margin'

export const RELOAD = 'reload'
export const CANCEL = 'cancel'
export const OK = 'OK'
export const POPULATE = 'populate'

export const NO_LAYERS_SELECTED = 'noLayersSelected'
export const SELECT_LAYERS_TO_POPULATE = 'selectLayersToPopulate'
export const POPULATING_FAILED = 'populatingFailed'
export const NO_MATCHING_KEYS = 'noMatchingKeys'
export const UNABLE_TO_PREVIEW_JSON = 'unableToPreviewJSON'
export const LOADING_DATA = 'loadingData'

export const CLICKED_CANCEL_BUTTON = 'clickedCancelButton'
export const CLOSED_DIALOG_WITH_ESC_KEY = 'closedDialogWithESCKey'

// Last Used Data
export const LAST_USED_DATA_TITLE = 'lastUsedDataTitle'
export const LAST_USED_DATA_DESCRIPTION = 'lastUsedDataDescription'
export const COMMAND = 'command'
export const LOADING_FAILED = 'loadingFailed'
export const NO_LAST_USED_DATA = 'noLastUsedData'
export const FIRST_TIME_USING_DATA_POPULATOR = 'firstTimeUsingDataPopulator'

// Clear layers
export const CLEAR_LAYERS_TITLE = 'clearLayersTitle'
export const CLEAR_LAYERS_DESCRIPTION = 'clearLayersDescription'
export const SELECT_LAYERS_TO_CLEAR = 'selectLayersToClear'

// Presets library
export const REVEAL_PRESETS_LIBRARY_TITLE = 'revealPresetsTitle'
export const REVEAL_PRESETS_LIBRARY_DESCRIPTION = 'revealPresetsLibraryDescription'
export const SET_PRESETS_LIBRARY_TITLE = 'setPresetsLibraryTitle'
export const SET_PRESETS_LIBRARY_DESCRIPTION = 'setPresetsLibraryDescription'
export const PRESETS_LIBRARY_NOT_FOUND = 'presetsLibraryNotFound'

// Need help?
export const NEED_HELP_TITLE = 'needHelpTitle'
export const NEED_HELP_DESCRIPTION = 'needHelpDescription'

export const strings = {
  en: {
    // Data Populator
    [DATA_POPULATOR_TITLE]: 'Data Populator',
    [DATA_POPULATOR_DESCRIPTION]:
      'A plugin to populate your design mockups with meaningful data. Goodbye Lorem Ipsum. Hello JSON.',
    [DATA_POPULATOR_URL]: 'http://datapopulator.com',

    // Populate with Preset
    [POPULATE_WITH_PRESET_TITLE]: 'Populate with Preset',
    [POPULATE_WITH_PRESET_DESCRIPTION]: `Please select the preset you'd like to populate your design with and configure the options.`,
    [PRESET]: 'Preset',
    [NO_PRESETS_FOUND]: 'No presets found.',
    [CONNECTION_FAILED]: 'Connection failed',
    [UNABLE_TO_DOWNLOAD_PRESETS]:
      "Unable to download the default presets at 'https://www.datapopulator.com/demodata/' provided by precious design studio.",
    [NO_JSON_FILES_IN_PRESETS_FOLDER]:
      'There are no JSON files in the presets folder to populate with.',
    [NO_PRESETS_FOLDER]: 'No presets folder',
    [CREATE_PRESET_FOLDER]: `Please create a folder named 'presets' in {data}.`,
    [INVALID_PRESET]: 'Invalid preset',
    [SELECTED_PRESET_INVALID]: 'The preset you selected is invalid.',
    [UNABLE_TO_LOAD_SELECTED_PRESET]: 'Unable to load the selected preset.',
    [UNABLE_TO_LOAD_LAST_USED_PRESET]: 'Unable to load the last used preset.',

    // Populate with JSON
    [POPULATE_WITH_JSON_TITLE]: 'Populate with JSON',
    [POPULATE_WITH_JSON_DESCRIPTION]: `Please select the JSON file you'd like to populate your design with and configure the options.`,
    [JSON_FILE]: 'JSON File',
    [BROWSE]: 'Browse',
    [NO_FILE_SELECTED]: 'No file selected',
    [SELECT_JSON_FILE]: 'Please select a JSON file to populate with.',
    [INVALID_JSON_FILE]: 'Invalid JSON file',
    [SELECTED_JSON_FILE_INVALID]: 'The selected JSON file is invalid.',
    [UNABLE_TO_LOAD_SELECTED_JSON_FILE]: 'Unable to load the selected JSON file.',

    // Populate from URL
    [POPULATE_FROM_URL_TITLE]: 'Populate from URL',
    [POPULATE_FROM_URL_DESCRIPTION]: `Please enter the URL of the API from which you'd like to fetch live data to populate your design with and configure the options.`,
    [URL]: 'URL',
    [URL_PLACEHOLDER]: `Must start with https://`,
    [NO_URL_ENTERED]: 'No URL entered',
    [ENTER_URL]: `Please enter the URL of the API from which you'd like to fetch data to populate with.`,
    [INVALID_URL]: 'Invalid URL',
    [URL_ENTERED_INVALID]: 'The URL you entered is invalid.',
    [UNABLE_TO_LOAD_JSON_AT_URL]: 'Unable to load the JSON at the specified URL.',
    [UNABLE_TO_LOAD_JSON_AT_LAST_USED_URL]: 'Unable to load the JSON at the last used URL.',
    [HEADERS]: 'Headers',
    [ADD]: 'Add',
    [NAME]: 'Name',
    [VALUE]: 'Value',
    [REMOVE]: 'Remove',
    [LOAD]: 'Load',

    // Populate Again
    [POPULATE_AGAIN_TITLE]: 'Populate Again',
    [POPULATE_AGAIN_DESCRIPTION]: 'Re-populate the selected layers with the last used data.',
    [NO_ACTIVE_CONFIGURATION]: 'No active configuration',

    // Populate
    [DATA_PATH]: 'Data Path',
    [DATA_PATH_PLACEHOLDER]: 'Root Level',
    [DATA_PATH_HELP_TEXT]:
      'The JSON key used as the starting point for populating. The key with the most objects is automatically detected.',
    [DATA_OPTIONS]: 'Data Options',
    [RANDOMIZE_DATA_ORDER]: 'Randomize data order',
    [TRIM_TEXT]: 'Trim overflowing text (area text layers)',
    [INSERT_ELLIPSIS]: 'Insert ellipsis after trimmed text',
    [DEFAULT_SUBSTITUTE]: 'Default Substitute',
    [DEFAULT_SUBSTITUTE_HELP_TEXT]: `The substitute text used if you append a '?' to your placeholder i.e. {placeholder?}. Can be customized per placeholder as well: {placeholder?custom substitute}.`,
    [DEFAULT_SUBSTITUTE_PLACEHOLDER]: 'e.g. No Data',
    [LAYOUT_OPTIONS]: 'Layout Options',
    [CREATE_GRID]: 'Create grid',
    [ROWS]: 'Rows',
    [COLUMNS]: 'Columns',
    [MARGIN]: 'Margin',

    [RELOAD]: 'Reload',
    [CANCEL]: 'Cancel',
    [OK]: 'OK',
    [POPULATE]: 'Populate',

    [NO_LAYERS_SELECTED]: 'No layers selected',
    [SELECT_LAYERS_TO_POPULATE]: 'Please select the layers to populate.',
    [POPULATING_FAILED]: 'Populating failed',
    [NO_MATCHING_KEYS]: `The selected layers' placeholders did not match any keys in the JSON data.`,
    [UNABLE_TO_PREVIEW_JSON]: 'Unable to preview JSON',
    [LOADING_DATA]: 'Loading data...',

    [CLICKED_CANCEL_BUTTON]: 'Clicked cancel button',
    [CLOSED_DIALOG_WITH_ESC_KEY]: 'Closed dialog with ESC key',

    // Last Used Data
    [LAST_USED_DATA_TITLE]: 'Last Used Data',
    [LAST_USED_DATA_DESCRIPTION]:
      'Your last used command, JSON, data path, data options and default substitute are shown below.',
    [COMMAND]: 'Command',
    [LOADING_FAILED]: 'Loading failed',
    [NO_LAST_USED_DATA]: 'No last used data',
    [FIRST_TIME_USING_DATA_POPULATOR]: `As this is your first time using the Data Populator plugin, please use one of the other commands such as 'Populate with Preset' or 'Populate from URL'.`,

    // Clear layers
    [CLEAR_LAYERS_TITLE]: 'Clear Layers',
    [CLEAR_LAYERS_DESCRIPTION]: 'Clear populated data from the selected layers.',
    [SELECT_LAYERS_TO_CLEAR]: 'Please select the layers to clear.',

    // Presets library
    [REVEAL_PRESETS_LIBRARY_TITLE]: 'Reveal Presets Library',
    [REVEAL_PRESETS_LIBRARY_DESCRIPTION]: 'Open the folder storing your presets library.',
    [SET_PRESETS_LIBRARY_TITLE]: 'Set Presets Library',
    [SET_PRESETS_LIBRARY_DESCRIPTION]: 'Choose the folder containing your preset library.',
    [PRESETS_LIBRARY_NOT_FOUND]:
      "Presets library was not found. Please set it via 'Set Presets Library'",

    // Need help?
    [NEED_HELP_TITLE]: 'Need Help?',
    [NEED_HELP_DESCRIPTION]: 'Find useful tips & tricks and ask for help.'
  }
}

/**
 * Returns the string that corresponds to the passed in key.
 *
 * @returns {String}
 */
export default function (stringKey, ...data) {
  let string = strings.en[stringKey]

  let index = 0
  while (string.indexOf('{data}') > -1) {
    string = string.replace('{data}', data[index])
    index++
  }

  return string
}
