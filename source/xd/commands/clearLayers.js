/**
 * Clear Layers
 *
 * Clears the selected layers of any populated data.
 */

import {log} from '../../core'
import Context from '../library/context'
import * as Gui from '../library/gui'
import * as Populator from '../library/populator'
import Strings, * as STRINGS from '../../core/library/strings'

export default async (selection, root) => {
  Context(selection, root)

  // nothing to clear
  if (!selection.items.length) {
    await Gui.createAlert(Strings(STRINGS.NO_LAYERS_SELECTED), Strings(STRINGS.SELECT_LAYERS_TO_CLEAR))
    return
  }

  // clear layers
  await Populator.clearLayers(selection.items)

  log('DONE')
}
