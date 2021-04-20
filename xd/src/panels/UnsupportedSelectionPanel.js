import React, { useEffect } from 'react'
import { withTheme } from 'styled-components'

import Header from '../components/Header'
import Panel from '../components/Panel'

import analytics from '@data-populator/core/analytics'

const strings = require('../strings').get('panels.unsupportedSelection')

export default withTheme(props => {
  useEffect(() => {
    analytics.trackDebounced('selectUnsupportedLayers')
  }, [props])

  return (
    <Panel>
      <Header hasTitle={true} title={strings.title()} subtitle={strings.subtitle()} />
    </Panel>
  )
})
