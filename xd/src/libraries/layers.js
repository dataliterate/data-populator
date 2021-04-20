import * as coreLibs from '@data-populator/core'

export function getLayerData(layer, key) {
  const data = layer.pluginData?.[key]

  // Return empty objects as undefined
  if (typeof data === 'object' && !Object.keys(data).length) return

  return data
}

export function setLayerData(layer, key, value) {
  layer.pluginData = { ...(layer.pluginData || {}), [key]: value }
}

export function getAncestors(layer, upToAndExcludingAncestor) {
  if (!layer) return []

  const ancestors = []

  let ancestor = layer.parent
  while (
    ancestor &&
    ancestor.constructor.name !== 'RootNode' &&
    ancestor !== upToAndExcludingAncestor
  ) {
    // Skip adding direct/model child group of repeat grids
    if (ancestor?.parent.constructor.name !== 'RepeatGrid') {
      ancestors.push(ancestor)
    }

    ancestor = ancestor.parent
  }

  return ancestors
}

export function getLayerPath(layer) {
  if (!layer) return []
  const ancestors = getAncestors(layer).reverse()
  return [...ancestors, layer]
}

export function getLayerPathString(layer) {
  return (
    getLayerPath(layer)
      ?.map(l => l.name)
      .join(' / ') || ''
  )
}

export function findNearestMatchingAncestor(layer, conditions) {
  if (!layer) return

  const ancestors = getAncestors(layer)
  for (let ancestor of ancestors) {
    if (coreLibs.utils.objectSatisfiesConditions(ancestor, conditions)) return ancestor
  }
}

export function findMatchingAncestors(layer, conditions) {
  const ancestors = getAncestors(layer)

  const matchingAncestors = []
  ancestors.forEach(ancestor => {
    if (coreLibs.utils.objectSatisfiesConditions(ancestor, conditions))
      matchingAncestors.push(ancestor)
  })

  return matchingAncestors
}

export function findMatchingChildren(layer, conditions) {
  if (!layer) return []
  if (
    !['Artboard', 'Group', 'RootNode', 'ScrollableGroup', 'RepeatGrid'].includes(
      layer.constructor.name
    )
  )
    return []

  const matchingChildren = []
  layer.children.forEach(child => {
    if (coreLibs.utils.objectSatisfiesConditions(child, conditions)) matchingChildren.push(child)

    if (['Artboard', 'Group', 'ScrollableGroup', 'RepeatGrid'].includes(child.constructor.name)) {
      matchingChildren.push(...findMatchingChildren(child, conditions))
    }
  })

  return matchingChildren
}
