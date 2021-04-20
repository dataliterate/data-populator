import React, { useState, useEffect } from 'react'
import { withTheme } from 'styled-components'

import { editDocument } from 'application'

import BlockDivider from '../components/BlockDivider'
import Header from '../components/Header'
import Margin from '../components/Margin'
import Panel from '../components/Panel'
import Scrollable from '../components/Scrollable'

import ContentTemplate from '../blocks/ContentTemplate'
import ClearActions from '../blocks/ClearActions'
import DataPreview from '../blocks/DataPreview'
import DataSource from '../blocks/DataSource'
import DefaultFallback from '../blocks/DefaultFallback'
import TextTrimming from '../blocks/TextTrimming'

import { useData, showHelp } from '.'
import * as populatorLib from '../libraries/populator'
import * as layersLib from '../libraries/layers'

import analytics from '@data-populator/core/analytics'

const strings = require('../strings').get('panels.text')

export default withTheme(({ selectedLayer }) => {
  // Populate options
  const [contentTemplate, setContentTemplate] = useState('')
  const [defaultDataFallback, setDefaultDataFallback] = useState('')
  const [trimOverflowingText, setTrimOverflowingText] = useState(false)
  const [insertEllipsisAfterTrimmingText, setInsertEllipsisAfterTrimmingText] = useState(false)

  // Data options
  const [dataSourceId, setDataSourceId] = useState()
  const [rootPath, setRootPath] = useState('')
  const [urlVariableOverrides, setUrlVariableOverrides] = useState({})

  // Data
  const { dataSources, data, isDataLoading } = useData(selectedLayer, dataSourceId, [
    urlVariableOverrides,
    rootPath
  ])

  // Derived values
  const layerPath = layersLib.getLayerPathString(selectedLayer)
  const contentPreview = populatorLib.getPopulatedString(
    contentTemplate,
    defaultDataFallback,
    data?.data
  )

  // Populate conditions
  const canPopulate = populatorLib.getPopulateOptions(selectedLayer) && data?.data

  // Clear conditions
  const canClear = populatorLib.hasOptions(selectedLayer)

  const clearLayer = options => {
    analytics.track('clear', {
      context: 'text',
      ...options
    })

    editDocument(async () => {
      await populatorLib.clearLayers([selectedLayer], options)
      await loadOptions()
    })
  }

  const populateLayer = async () => {
    analytics.track('populate', {
      context: 'text'
    })

    editDocument(async () => {
      await populatorLib.populateLayers([selectedLayer])
    })
  }

  const updateContentTemplate = value => {
    analytics.trackDebounced('setContentTemplate', {
      context: 'text',
      contentTemplate: !!value.length
    })

    editDocument(() => {
      populatorLib.setPopulateOption(selectedLayer, 'contentTemplate', value)
      setContentTemplate(value)
    })
  }

  const updateDefaultDataFallback = value => {
    analytics.trackDebounced('setDefaultDataFallback', {
      context: 'text',
      defaultDataFallback: !!value.length
    })

    editDocument(() => {
      populatorLib.setPopulateOption(selectedLayer, 'defaultDataFallback', value)
      setDefaultDataFallback(value)
    })
  }

  const updateTrimOverflowingText = value => {
    analytics.track('setTrimOverflowingText', {
      context: 'text',
      trimOverflowingText: value
    })

    editDocument(() => {
      populatorLib.setPopulateOption(selectedLayer, 'trimOverflowingText', value)
      setTrimOverflowingText(value)
    })
  }

  const updateInsertEllipsisAfterTrimmingText = value => {
    analytics.track('setInsertEllipsisAfterTrimmingText', {
      context: 'text',
      insertEllipsisAfterTrimmingText: value
    })

    editDocument(() => {
      populatorLib.setPopulateOption(selectedLayer, 'insertEllipsisAfterTrimmingText', value)
      setInsertEllipsisAfterTrimmingText(value)
    })
  }

  const updateDataSource = async (selectedDataSourceId, userInitiated) => {
    userInitiated &&
      analytics.track('setDataSource', {
        context: 'text',
        dataSource: !!selectedDataSourceId
      })

    editDocument(async () => {
      userInitiated && (await populatorLib.setDataSource(selectedLayer, selectedDataSourceId))
      setDataSourceId(selectedDataSourceId)
    })
  }

  const updateUrlVariableOverride = async (variable, value) => {
    analytics.trackDebounced('setUrlVariableOverride', {
      context: 'text'
    })

    editDocument(() => {
      const updatedOverrides = {
        ...urlVariableOverrides,
        [variable]: value?.length ? value : undefined
      }

      populatorLib.setDataOption(selectedLayer, 'urlVariableOverrides', updatedOverrides)
      setUrlVariableOverrides(updatedOverrides)
    })
  }

  const updateRootPath = value => {
    analytics.trackDebounced('setRootPath', {
      context: 'text',
      rootPath: !!value.length
    })

    editDocument(() => {
      populatorLib.setDataOption(selectedLayer, 'rootPath', value)
      setRootPath(value)
    })
  }

  const loadOptions = async () => {
    // Populate options
    const populateOptions = populatorLib.getPopulateOptions(selectedLayer)
    setContentTemplate(populateOptions?.contentTemplate || '')
    setDefaultDataFallback(populateOptions?.defaultDataFallback || '')
    setTrimOverflowingText(populateOptions?.trimOverflowingText || false)
    setInsertEllipsisAfterTrimmingText(populateOptions?.insertEllipsisAfterTrimmingText || false)

    // Data options
    const dataOptions = populatorLib.getDataOptions(selectedLayer)
    setDataSourceId(dataOptions?.dataSource?.id)
    setRootPath(dataOptions?.rootPath || '')
    setUrlVariableOverrides(dataOptions?.urlVariableOverrides || {})
  }

  useEffect(() => {
    loadOptions()
  }, [selectedLayer])

  return (
    <Panel>
      <Header
        hasTitle={true}
        title={strings.title()}
        subtitle={layerPath}
        hasButton={true}
        buttonTitle={strings.populate()}
        onButtonClick={populateLayer}
        isButtonDisabled={!canPopulate}
      />

      <Scrollable>
        <ContentTemplate
          type="text"
          onHelpClick={showHelp}
          value={contentTemplate}
          onChange={updateContentTemplate}
          preview={contentPreview}
        />

        <DefaultFallback
          type="text"
          onHelpClick={showHelp}
          value={defaultDataFallback}
          onChange={updateDefaultDataFallback}
        />

        <TextTrimming
          onHelpClick={showHelp}
          trim={trimOverflowingText}
          onTrimChange={updateTrimOverflowingText}
          insertEllipsis={insertEllipsisAfterTrimmingText}
          onInsertEllipsisChange={updateInsertEllipsisAfterTrimmingText}
        />

        <BlockDivider />

        <DataSource
          isInheritable={true}
          onHelpClick={showHelp}
          dataSources={dataSources}
          dataSourceId={dataSourceId}
          data={data}
          onDataSourceIdChange={updateDataSource}
          urlVariableOverrides={urlVariableOverrides}
          onUrlVariableOverrideChange={updateUrlVariableOverride}
          rootPath={rootPath}
          onRootPathChange={updateRootPath}
        />

        <Margin top={20}>
          <DataPreview
            isDataLoading={isDataLoading}
            isInherited={!dataSourceId}
            dataSource={data?.dataSource}
            urlVariableOverrides={urlVariableOverrides}
            path={data?.path}
            data={data?.data}
          />
        </Margin>
      </Scrollable>

      <ClearActions
        context="text"
        canClear={canClear}
        canClearChildren={false}
        onClear={clearLayer}
      />
    </Panel>
  )
})
