/**
 * Show action
 */


export const name = 'show'
export const alias = 's'


/**
 * Shows the layer if the condition is true or hides it otherwise.
 *
 * @param {boolean} condition
 * @param {MSLayer} layer
 * @param {Array} params
 */
export function perform(condition, layer, params) {
  layer.setIsVisible(condition)
}