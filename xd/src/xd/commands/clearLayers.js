/**
 * Clear Layers
 *
 * Clears the selected layers of any populated data.
 */

import log from '@data-populator/core/log'
import Context from '../context'
import * as Gui from '../gui'
import * as Populator from '../populator'
import Strings, * as STRINGS from '@data-populator/core/strings'

export default async (selection, root) => {
  Context(selection, root)

  // nothing to clear
  if (!selection.items.length) {
    await Gui.createAlert(
      Strings(STRINGS.NO_LAYERS_SELECTED),
      Strings(STRINGS.SELECT_LAYERS_TO_CLEAR)
    )
    return
  }

  // clear layers
  await Populator.clearLayers(selection.items)

  log('DONE')
}
