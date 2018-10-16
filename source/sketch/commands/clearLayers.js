/**
 * Clear Layers
 *
 * Clears the selected layers of any populated data and removes any metadata.
 */

import Context from '../library/context'
import * as Layers from '../library/layers'
import * as Populator from '../library/populator'
import Strings, * as STRINGS from '../../core/library/strings'

export default (context) => {
  Context(context)

  // get selected layers
  let selectedLayers = Layers.getSelectedLayers()
  if (!selectedLayers.length) {
    return Context().document.showMessage(Strings(STRINGS.SELECT_LAYERS_TO_CLEAR))
  }

  // clear layers
  selectedLayers.forEach((layer) => {
    Populator.clearLayer(layer)
  })

  // reload inspector to update displayed data
  context.document.reloadInspector()
}
