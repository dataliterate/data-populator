import React, { useState, useRef, useEffect, useReducer } from 'react'
import { ThemeProvider } from 'styled-components'

import theme from './theme'
import context from './libraries/context'

import DocumentPanel from './panels/DocumentPanel'
import MultiSelectionPanel from './panels/MultiSelectionPanel'
import ArtboardPanel from './panels/ArtboardPanel'
import GroupPanel from './panels/GroupPanel'
import TextPanel from './panels/TextPanel'
import ShapePanel from './panels/ShapePanel'
import UnsupportedSelectionPanel from './panels/UnsupportedSelectionPanel'

const PANELS = {
  document: DocumentPanel,
  multiSelection: MultiSelectionPanel,
  artboard: ArtboardPanel,
  group: GroupPanel,
  text: TextPanel,
  shape: ShapePanel,
  unsupportedSelection: UnsupportedSelectionPanel
}

const App = () => {
  const [activePanel, setActivePanel] = useState()
  const [_, forceUpdate] = useReducer(x => x + 1, 0)
  const isPanelLocked = useRef(false)

  // locking
  const lockPanel = () => {
    isPanelLocked.current = true
  }

  const unlockPanel = () => {
    isPanelLocked.current = false

    updateActivePanel()
  }

  const updateActivePanel = () => {
    if (isPanelLocked.current) return

    const currentActivePanel = activePanel
    let newActivePanel

    // No layers selected
    if (!context()?.selection?.items || context().selection.items.length < 1) {
      newActivePanel = 'document'
    }

    // Multiple layers selected
    else if (context().selection.items.length > 1) {
      const supportedLayerTypes = [
        'Artboard',
        'Group',
        'RepeatGrid',
        'ScrollableGroup',
        'Text',
        'Rectangle',
        'Ellipse',
        'Polygon',
        'Path',
        'BooleanGroup'
      ]

      let allSelectedLayersNotSupported = true
      context().selection.items.forEach(layer => {
        if (supportedLayerTypes.includes(layer.constructor.name)) {
          allSelectedLayersNotSupported = false
        }
      })

      if (allSelectedLayersNotSupported) {
        newActivePanel = 'unsupportedSelection'
      } else {
        newActivePanel = 'multiSelection'
      }
    }

    // One layer selected
    else {
      const layer = context().selection.items[0]
      const layerType = layer.constructor.name

      if (layerType === 'Artboard') {
        newActivePanel = 'artboard'
      } else if (['Group', 'ScrollableGroup', 'RepeatGrid'].includes(layerType)) {
        newActivePanel = 'group'
      } else if (layerType === 'Text') {
        newActivePanel = 'text'
      } else if (['Rectangle', 'Ellipse', 'Polygon', 'Path', 'BooleanGroup'].includes(layerType)) {
        newActivePanel = 'shape'
      } else {
        newActivePanel = 'unsupportedSelection'
      }
    }

    // Panel changed
    if (currentActivePanel !== newActivePanel) {
      setActivePanel(newActivePanel)
    }

    // Only selection changed
    else {
      forceUpdate()
    }
  }

  // Handle panel update event
  useEffect(() => {
    document.addEventListener('update', updateActivePanel)
    document.addEventListener('lockPanel', lockPanel)
    document.addEventListener('unlockPanel', unlockPanel)

    return () => {
      document.removeEventListener('update', updateActivePanel)
      document.removeEventListener('lockPanel', lockPanel)
      document.removeEventListener('unlockPanel', unlockPanel)
    }
  }, [activePanel])

  // Get panel to render
  const Panel = PANELS[activePanel]

  // Get selected layer
  const selectedLayers = context()?.selection?.items
  const selectedLayer = selectedLayers?.[0]
  const selectedLayerType = selectedLayer?.constructor.name

  return (
    <ThemeProvider theme={theme}>
      {Panel && (
        <Panel
          selectedLayers={selectedLayers}
          selectedLayer={selectedLayer}
          selectedLayerType={selectedLayerType}
        />
      )}
    </ThemeProvider>
  )
}

export default App
