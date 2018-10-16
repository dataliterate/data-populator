/**
 * Reset options
 *
 * Used for debugging.
 */

import Context from '../library/context'
import * as Options from '../library/options'

export default (context) => {
  Context(context)

  Options.remove()
}
