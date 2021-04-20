import React, { useState, useEffect, useRef } from 'react'
import styled, { withTheme } from 'styled-components'

import { showModal } from './index'

import Body from '../components/Body'
import Button from '../components/Button'
import Data from '../components/Data'
import Fill from '../components/Fill'
import Heading from '../components/Heading'
import IconButton from '../components/IconButton'
import Margin from '../components/Margin'
import Row from '../components/Row'
import Type from '../components/Type'

import analytics from '@data-populator/core/analytics'

const strings = require('../strings').get('modals.dataPreview')

const Container = styled.div`
  width: ${800 - 34 - 34}px;
  padding: ${40 - 34}px;
`

const URL = styled.div`
  font-size: 11px;
  color: ${props => props.theme.gray600};

  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`

const DataPreviewModal = withTheme(props => {
  const [data, setData] = useState()
  const [isDataLoading, setIsDataLoading] = useState(true)
  const dataTimeout = useRef(null)

  const loadData = ignoreDataCache => {
    setData()
    setIsDataLoading(true)

    clearTimeout(dataTimeout.current)
    dataTimeout.current = setTimeout(async () => {
      setData(
        await props.dataSource.getData({
          ignoreDataCache,
          path: props.path,
          variableOverrides: props.urlVariableOverrides
        })
      )

      setIsDataLoading(false)
    }, 100)
  }

  // Load data source data
  useEffect(() => {
    loadData()
  }, [])

  const reload = () => {
    analytics.track('refreshFullDataPreview')

    loadData(true)
  }

  const dismiss = () => {
    props.dialog.close()
  }

  return (
    <Container>
      <Margin bottom={20}>
        <Row>
          <Fill>
            <Heading>{strings.title()}</Heading>

            <Row>
              <Body color={props.theme.gray800}>{props.dataSource.name}</Body>

              {props.dataSource.origin && (
                <Margin left={4}>
                  <Body>({strings[props.dataSource.origin]()})</Body>
                </Margin>
              )}

              <Margin top={3} left={props.dataSource.name.length > 0 ? 8 : 0}>
                <Type type={props.dataSource.type} />
              </Margin>
            </Row>

            {props.dataSource.type === 'remote' && (
              <URL>{props.dataSource.getPopulatedUrl(props.urlVariableOverrides)}</URL>
            )}
          </Fill>

          {props.dataSource.type === 'remote' && (
            <Margin left={10}>
              <IconButton icon="Refresh" onClick={reload} />
            </Margin>
          )}
        </Row>
      </Margin>

      <Margin bottom={25}>
        <Data isLoading={isDataLoading} data={data} />
      </Margin>

      <Row style={{ alignItems: 'center' }}>
        <Fill />

        <Margin left={10}>
          <Button type="primary" onClick={dismiss}>
            {strings.dismiss()}
          </Button>
        </Margin>
      </Row>
    </Container>
  )
})

export default params => {
  showModal(DataPreviewModal, params)
}
