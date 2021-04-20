import React, { useState, useEffect } from 'react'
import { withTheme } from 'styled-components'

import { editDocument } from 'application'

import BlockDivider from '../components/BlockDivider'
import Header from '../components/Header'
import Margin from '../components/Margin'
import Panel from '../components/Panel'
import Scrollable from '../components/Scrollable'

import ChildLayers from '../blocks/ChildLayers'
import ClearActions from '../blocks/ClearActions'
import PopulateWithRow from '../blocks/PopulateWithRow'
import ContentTemplate from '../blocks/ContentTemplate'
import DataPreview from '../blocks/DataPreview'
import DataSource from '../blocks/DataSource'
import DefaultFallback from '../blocks/DefaultFallback'

import { useData, showHelp } from '.'
import * as populatorLib from '../libraries/populator'
import * as layersLib from '../libraries/layers'

import analytics from '@data-populator/core/analytics'

const strings = require('../strings').get('panels.artboard')

export default withTheme(({ selectedLayer }) => {
  // Populate options
  const [nameTemplate, setNameTemplate] = useState('')
  const [defaultDataFallback, setDefaultDataFallback] = useState('')
  const [populateWithRow, setPopulateWithRow] = useState(false)

  // Data options
  const [dataSourceId, setDataSourceId] = useState()
  const [rootPath, setRootPath] = useState('')
  const [shuffleItems, setShuffleItems] = useState(false)
  const [repeatItems, setRepeatItems] = useState(false)
  const [urlVariableOverrides, setUrlVariableOverrides] = useState({})

  // Data
  const { dataSources, data, isDataLoading } = useData(selectedLayer, dataSourceId, [
    urlVariableOverrides,
    rootPath
  ])

  // Derived values
  const layerPath = layersLib.getLayerPathString(selectedLayer)
  const namePreview = populatorLib.getPopulatedString(nameTemplate, defaultDataFallback, data?.data)

  // Children
  const childrenWithOptions = populatorLib.findChildrenWithOptions(selectedLayer)

  // Populate conditions
  const canPopulate =
    (populatorLib.getPopulateOptions(selectedLayer) && data?.data) ||
    (childrenWithOptions.withDataSource.length && childrenWithOptions.withPopulateOptions.length)

  // Clear conditions
  const canClear = populatorLib.hasOptions(selectedLayer) || !!childrenWithOptions.any.length
  const canClearChildren = !!childrenWithOptions.any.length

  const clearLayer = options => {
    analytics.track('clear', {
      context: 'artboard',
      ...options
    })

    editDocument(async () => {
      await populatorLib.clearLayers([selectedLayer], options)
      await loadOptions()
    })
  }

  const populateLayer = async () => {
    analytics.track('populate', {
      context: 'artboard'
    })

    editDocument(async () => {
      await populatorLib.populateLayers([selectedLayer])
    })
  }

  const updateNameTemplate = value => {
    analytics.trackDebounced('setNameTemplate', {
      context: 'artboard',
      nameTemplate: !!value.length
    })

    editDocument(() => {
      populatorLib.setPopulateOption(selectedLayer, 'nameTemplate', value)
      setNameTemplate(value)
    })
  }

  const updateDefaultDataFallback = value => {
    analytics.trackDebounced('setDefaultDataFallback', {
      context: 'artboard',
      defaultDataFallback: !!value.length
    })

    editDocument(() => {
      populatorLib.setPopulateOption(selectedLayer, 'defaultDataFallback', value)
      setDefaultDataFallback(value)
    })
  }

  const updatePopulateWithRow = value => {
    analytics.track('setPopulateWithRow', {
      context: 'artboard',
      populateWithRow: value
    })

    editDocument(() => {
      populatorLib.setPopulateOption(selectedLayer, 'populateWithRow', value)
      setPopulateWithRow(value)
    })
  }

  const updateDataSource = async (selectedDataSourceId, userInitiated) => {
    userInitiated &&
      analytics.track('setDataSource', {
        context: 'artboard',
        dataSource: !!selectedDataSourceId
      })

    editDocument(async () => {
      userInitiated && (await populatorLib.setDataSource(selectedLayer, selectedDataSourceId))
      setDataSourceId(selectedDataSourceId)
    })
  }

  const updateUrlVariableOverride = async (variable, value) => {
    analytics.trackDebounced('setUrlVariableOverride', {
      context: 'artboard'
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
      context: 'artboard',
      rootPath: !!value.length
    })

    editDocument(() => {
      populatorLib.setDataOption(selectedLayer, 'rootPath', value)
      setRootPath(value)
    })
  }

  const updateShuffleItems = value => {
    analytics.track('setShuffleItems', {
      context: 'artboard',
      shuffleItems: value
    })

    editDocument(() => {
      populatorLib.setDataOption(selectedLayer, 'shuffleItems', value)
      setShuffleItems(value)
    })
  }

  const updateRepeatItems = value => {
    analytics.track('setRepeatItems', {
      context: 'artboard',
      repeatItems: value
    })

    editDocument(() => {
      populatorLib.setDataOption(selectedLayer, 'repeatItems', value)
      setRepeatItems(value)
    })
  }

  const loadOptions = async () => {
    // Populate options
    const populateOptions = populatorLib.getPopulateOptions(selectedLayer)
    setNameTemplate(populateOptions?.nameTemplate || '')
    setDefaultDataFallback(populateOptions?.defaultDataFallback || '')
    setPopulateWithRow(populateOptions?.populateWithRow || false)

    // Data options
    const dataOptions = populatorLib.getDataOptions(selectedLayer)
    setDataSourceId(dataOptions?.dataSource?.id)
    setRootPath(dataOptions?.rootPath || '')
    setShuffleItems(dataOptions?.shuffleItems || false)
    setRepeatItems(dataOptions?.repeatItems || false)
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
          type="artboard"
          onHelpClick={showHelp}
          value={nameTemplate}
          onChange={updateNameTemplate}
          preview={namePreview}
        />

        <DefaultFallback
          type="artboard"
          onHelpClick={showHelp}
          value={defaultDataFallback}
          onChange={updateDefaultDataFallback}
          bottom={20}
        />

        {/* <PopulateWithRow populateWithRow={populateWithRow} onChange={updatePopulateWithRow} /> */}

        <BlockDivider />

        <ChildLayers layers={childrenWithOptions.withPopulateOptions} />

        <BlockDivider />

        <DataSource
          isInheritable={false}
          onHelpClick={showHelp}
          dataSources={dataSources}
          dataSourceId={dataSourceId}
          data={data}
          onDataSourceIdChange={updateDataSource}
          urlVariableOverrides={urlVariableOverrides}
          onUrlVariableOverrideChange={updateUrlVariableOverride}
          rootPath={rootPath}
          onRootPathChange={updateRootPath}
          showShuffleItems={true}
          shuffleItems={shuffleItems}
          onShuffleItemsChange={updateShuffleItems}
          showRepeatItems={true}
          repeatItems={repeatItems}
          onRepeatItemsChange={updateRepeatItems}
        />

        <Margin top={20}>
          <DataPreview
            isDataLoading={isDataLoading}
            dataSource={data?.dataSource}
            urlVariableOverrides={urlVariableOverrides}
            path={data?.path}
            data={data?.data}
          />
        </Margin>
      </Scrollable>

      <ClearActions
        context="artboard"
        canClear={canClear}
        canClearChildren={canClearChildren}
        onClear={clearLayer}
      />
    </Panel>
  )
})
