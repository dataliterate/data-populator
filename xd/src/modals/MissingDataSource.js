import React, { useState } from 'react'
import { withTheme } from 'styled-components'

import { editDocument } from 'application'

import Block from '../components/Block'
import BlockHeading from '../components/BlockHeading'
import Button from '../components/Button'
import DataSource from '../components/DataSource'
import Dropdown from '../components/Dropdown'
import Fill from '../components/Fill'
import Margin from '../components/Margin'
import Row from '../components/Row'

import Modal from '../components/Modal'

import * as populatorLib from '../libraries/populator'

import analytics from '@data-populator/core/analytics'

const strings = require('../strings').get('components.modals.missingDataSource')

export default withTheme(props => {
  const [newDataSourceId, setNewDataSourceId] = useState(-1)

  const isDisabled = newDataSourceId === -1

  const onConfirmClick = async () => {
    // Get the selected data source
    const selectedDataSource = props.dataSources.find(
      dataSource => dataSource.id === newDataSourceId
    )
    if (!selectedDataSource) return

    analytics.track('relinkMissingDataSource', {
      affectedLayers: props.missingDataSource?.layers?.length
    })

    editDocument(() => {
      // Update each layer that's missing the given data source
      props.missingDataSource.layers.forEach(layer => {
        const currentDataOptions = populatorLib.getDataOptions(layer)

        populatorLib.setDataOptions(layer, {
          ...currentDataOptions,
          dataSource: {
            id: selectedDataSource.id,
            name: selectedDataSource.name,
            type: selectedDataSource.type
          }
        })
      })
    })

    props.onClose()
  }

  return (
    <Modal icon="Link" title={strings.title()} onClose={props.onClose}>
      <Margin top={20 - 12}>
        <Block>
          <BlockHeading label={strings.dataSourceToRelink()} />

          <DataSource
            isOnWhiteBackground={true}
            name={props.missingDataSource.name}
            type={props.missingDataSource.type}
            layerCount={props.missingDataSource.layers.length}
          />
        </Block>
      </Margin>

      <Block>
        <BlockHeading label={strings.newDataSource()} />

        <Dropdown
          placeholder={strings.selectSource()}
          options={props.dataSources}
          value={newDataSourceId}
          onChange={setNewDataSourceId}
        />
      </Block>

      <Row style={{ paddingBottom: 20 - 12 }}>
        <Fill />

        <Button isDisabled={isDisabled} type="cta" onClick={onConfirmClick}>
          {strings.confirm()}
        </Button>
      </Row>
    </Modal>
  )
})
