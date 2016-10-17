/**
 * Context
 *
 * Provides a convenient way to set and get the current command context.
 */

//store context
let context = null

//set and get context via the same function
export default function (newContext) {

  //set new context
  if (newContext) {
    context = newContext
  }

  return context
}