/**
 * Clear Layers
 *
 * Clears the selected layers of any populated data and removes any metadata.
 */


import Context from '../context'
import * as Layers from '../library/layers'
import * as Populator from '../library/populator'


export default (context) => {
  Context(context)

  //get selected layers
  let selectedLayers = Layers.getSelectedLayers()
  if (!selectedLayers.length) {
    return Context().document.showMessage('Please select the text layers you would like to restore.')
  }

  //clear layers
  selectedLayers.forEach((layer) => {
    Populator.clearLayer(layer)
  })
}