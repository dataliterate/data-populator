/**
 * Reset options
 *
 * Used for debugging.
 */

import Context from '../context'
import * as Options from '../options'

export default context => {
  Context(context)

  Options.remove()
}
