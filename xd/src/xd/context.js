/**
 * Context
 *
 * Provides a convenient way to set and get the current command selection
 * and root.
 */

// store context
let selection = null
let root = null

// set and get context via the same function
export default function (newSelection, newRoot) {
  // set new context
  if (newSelection) {
    selection = newSelection
    root = newRoot
  }

  return {
    selection,
    root
  }
}
