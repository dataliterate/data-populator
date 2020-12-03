/**
 * Clear Layers
 *
 * Clears the selected layers of any populated data and removes any metadata.
 */

import Context from '../context'
import * as Layers from '../layers'
import * as Populator from '../populator'
import Strings, * as STRINGS from '@data-populator/core/strings'
import * as Utils from '../utils'
import Analytics from '@data-populator/core/analytics'

export default context => {
  Context(context)

  // configure analytics
  Analytics.configure(Utils.analyticsConfiguration())

  // get selected layers
  let selectedLayers = Layers.getSelectedLayers()
  if (!selectedLayers.length) {
    Context().document.showMessage(Strings(STRINGS.SELECT_LAYERS_TO_CLEAR))

    Analytics.track('clearLayersError', {
      reason: 'noSelection'
    })

    return
  }

  // clear layers
  selectedLayers.forEach(layer => {
    Populator.clearLayer(layer)
  })

  Analytics.track('clearLayers')

  // restore selected layers
  Layers.selectLayers(selectedLayers)

  context.document.reloadInspector()
}
