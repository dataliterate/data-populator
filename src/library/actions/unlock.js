/**
 * Unlock action
 */


export const name = 'unlock'
export const alias = 'u'


/**
 * Unlocks the layer if the condition is true or locks it otherwise.
 *
 * @param {boolean} condition
 * @param {MSLayer} layer
 * @param {Array} params
 */
export function perform(condition, layer, params) {
  layer.setIsLocked(!condition)
}