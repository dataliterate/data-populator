/**
 * Delete action
 */

export const name = 'delete'
export const alias = 'd'

/**
 * Deletes the layer if the condition is true.
 *
 * @param {Boolean} condition
 * @param {MSLayer} layer
 * @param {Array} params
 */
export function perform (condition, layer, params) {
  if (!condition) return

  // remove layer from parent
  layer.removeFromParent()
}
