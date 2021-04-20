import React from 'react'

import showClearActionModal from '../modals/ClearActionModal'

import Divider from '../components/Divider'
import Margin from '../components/Margin'
import ActionButton from '../components/ActionButton'

import analytics from '@data-populator/core/analytics'

const strings = require('../strings').get('blocks.clearActions')

export default props => {
  const openClearPopulatedDataModal = () => {
    analytics.track('showClear', {
      context: props.context,
      clearPopulatedData: true
    })

    showClearActionModal({
      type: 'populatedData',
      canClearChildren: props.canClearChildren,
      onClear: props.onClear
    })
  }

  const openClearOptionsModal = () => {
    analytics.track('showClear', {
      context: props.context,
      clearOptions: true
    })

    showClearActionModal({
      type: 'options',
      canClearChildren: props.canClearChildren,
      onClear: props.onClear
    })
  }

  if (!props.canClear) return null

  return (
    <Margin top={12} right={12}>
      <Divider />

      <Margin top={15}>
        <ActionButton isQuiet={true} icon="ClearLayers" onClick={openClearPopulatedDataModal}>
          {strings.clearLayers()}
        </ActionButton>

        <Margin top={5}>
          <ActionButton isQuiet={true} icon="ClearOptions" onClick={openClearOptionsModal}>
            {strings.clearOptions()}
          </ActionButton>
        </Margin>
      </Margin>
    </Margin>
  )
}
