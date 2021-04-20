import React from 'react'

import showDataPreviewModal from '../modals/DataPreviewModal'

import Block from '../components/Block'
import BlockHeading from '../components/BlockHeading'
import Body from '../components/Body'
import Data from '../components/Data'
import Margin from '../components/Margin'

import analytics from '@data-populator/core/analytics'

const strings = require('../strings').get('blocks.dataPreview')

export default props => {
  const openDataModal = context => {
    analytics.track('showFullDataPreview', {
      context: context === 'icon' ? 'smallPreviewIcon' : 'smallPreviewData'
    })

    showDataPreviewModal({
      dataSource: props.dataSource,
      urlVariableOverrides: props.urlVariableOverrides,
      path: props.path
    })
  }

  if (!props.dataSource) return null

  const title = props.isInherited ? strings.titleSample() : strings.titlePreview()

  return (
    <Block>
      {props.data ? (
        <BlockHeading label={title} icon="ViewDetail" onIconClick={() => openDataModal('icon')} />
      ) : (
        <BlockHeading label={title} />
      )}

      <Data
        isPreview={true}
        isLoading={props.isDataLoading}
        data={props.data}
        onClick={() => openDataModal('data')}
      />

      {props.data && (
        <Margin top={10}>
          <Body>{strings.path({ path: props.path?.length ? props.path : 'root' })}</Body>
        </Margin>
      )}
    </Block>
  )
}
