import React from 'react'
import { withTheme } from 'styled-components'

import { editDocument } from 'application'

import Header from '../components/Header'
import Panel from '../components/Panel'
import Scrollable from '../components/Scrollable'

import ChildLayers from '../blocks/ChildLayers'
import ClearActions from '../blocks/ClearActions'

import * as populatorLib from '../libraries/populator'

import analytics from '@data-populator/core/analytics'

const strings = require('../strings').get('panels.multiSelection')

export default withTheme(({ selectedLayers }) => {
  // Children
  const childrenWithOptions = populatorLib.findChildrenWithOptions(selectedLayers)

  // Populate conditions
  const canPopulate = !!childrenWithOptions.withPopulateOptions.length

  // Clear conditions
  const canClear = !!childrenWithOptions.any.length

  const clearLayers = options => {
    analytics.track('clear', {
      context: 'multi',
      ...options
    })

    editDocument(async () => {
      await populatorLib.clearLayers(selectedLayers, options)
    })
  }

  const populateLayers = async () => {
    analytics.track('populate', {
      context: 'multi'
    })

    editDocument(async () => {
      await populatorLib.populateLayers(selectedLayers)
    })
  }

  return (
    <Panel>
      <Header
        hasTitle={true}
        title={strings.title()}
        subtitle={strings.subtitle()}
        hasButton={true}
        buttonTitle={strings.populate()}
        onButtonClick={populateLayers}
        isButtonDisabled={!canPopulate}
      />

      <Scrollable>
        <ChildLayers layers={childrenWithOptions.withPopulateOptions} />
      </Scrollable>

      <ClearActions
        context="multi"
        canClear={canClear}
        canClearChildren={true}
        onClear={clearLayers}
      />
    </Panel>
  )
})
