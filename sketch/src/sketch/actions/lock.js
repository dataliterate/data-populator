/**
 * Lock action
 */

export const name = 'lock'
export const alias = 'l'

/**
 * Locks the layer if the condition is true or unlocks it otherwise.
 *
 * @param {Boolean} condition
 * @param {MSLayer} layer
 * @param {Array} params
 */
export function perform(condition, layer, params) {
  layer.setIsLocked(condition)
}
