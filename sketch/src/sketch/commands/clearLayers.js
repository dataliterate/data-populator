/**
 * Clear Layers
 *
 * Clears the selected layers of any populated data and removes any metadata.
 */

import Context from '../context'
import * as Layers from '../layers'
import * as Populator from '../populator'
import Strings, * as STRINGS from '@data-populator/core/strings'

export default context => {
  Context(context)

  // get selected layers
  let selectedLayers = Layers.getSelectedLayers()
  if (!selectedLayers.length) {
    return Context().document.showMessage(Strings(STRINGS.SELECT_LAYERS_TO_CLEAR))
  }

  // clear layers
  selectedLayers.forEach(layer => {
    Populator.clearLayer(layer)
  })

  // restore selected layers
  Layers.selectLayers(selectedLayers)

  context.document.reloadInspector()
}
