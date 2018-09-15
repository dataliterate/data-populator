/**
 * Hide action
 */


export const name = 'hide'
export const alias = 'h'


/**
 * Hides the layer if the condition is true or shows it otherwise.
 *
 * @param {boolean} condition
 * @param {MSLayer} layer
 * @param {Array} params
 */
export function perform(condition, layer, params) {
  layer.setIsVisible(!condition)
}