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
import DataPreview from '../blocks/DataPreview'
import DataSource from '../blocks/DataSource'

import { useData, showHelp } from '.'
import * as populatorLib from '../libraries/populator'
import * as layersLib from '../libraries/layers'

import analytics from '@data-populator/core/analytics'

const strings = require('../strings').get('panels.group')

export default withTheme(({ selectedLayer, selectedLayerType }) => {
  // Special case - define panel context
  const panelContext = selectedLayerType === 'RepeatGrid' ? 'repeatGrid' : 'group'

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
  const childrenWithOptions = populatorLib.findChildrenWithOptions(selectedLayer)

  // Populate conditions
  const canPopulate =
    childrenWithOptions.withPopulateOptions.length &&
    (data?.data || childrenWithOptions.withDataOptions.length)

  // Clear conditions
  const canClear = populatorLib.hasOptions(selectedLayer) || !!childrenWithOptions.any.length
  const canClearChildren = panelContext !== 'repeatGrid' && !!childrenWithOptions.any.length

  const clearLayer = options => {
    analytics.track('clear', {
      context: panelContext,
      ...options
    })

    editDocument(async () => {
      await populatorLib.clearLayers([selectedLayer], options)
      await loadOptions()
    })
  }

  const populateLayer = async () => {
    analytics.track('populate', {
      context: panelContext
    })

    editDocument(async () => {
      await populatorLib.populateLayers([selectedLayer])
    })
  }

  const updateDataSource = async (selectedDataSourceId, userInitiated) => {
    userInitiated &&
      analytics.track('setDataSource', {
        context: panelContext,
        dataSource: !!selectedDataSourceId
      })

    editDocument(async () => {
      userInitiated && (await populatorLib.setDataSource(selectedLayer, selectedDataSourceId))
      setDataSourceId(selectedDataSourceId)
    })
  }

  const updateUrlVariableOverride = async (variable, value) => {
    analytics.trackDebounced('setUrlVariableOverride', {
      context: panelContext
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
      context: panelContext,
      rootPath: !!value.length
    })

    editDocument(() => {
      populatorLib.setDataOption(selectedLayer, 'rootPath', value)
      setRootPath(value)
    })
  }

  const updateShuffleItems = value => {
    analytics.track('setShuffleItems', {
      context: panelContext,
      shuffleItems: value
    })

    editDocument(() => {
      populatorLib.setDataOption(selectedLayer, 'shuffleItems', value)
      setShuffleItems(value)
    })
  }

  const updateRepeatItems = value => {
    analytics.track('setRepeatItems', {
      context: panelContext,
      repeatItems: value
    })

    editDocument(() => {
      populatorLib.setDataOption(selectedLayer, 'repeatItems', value)
      setRepeatItems(value)
    })
  }

  const loadOptions = async () => {
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
        title={panelContext === 'repeatGrid' ? strings.repeatGridTitle() : strings.title()}
        subtitle={layerPath}
        hasButton={true}
        buttonTitle={strings.populate()}
        onButtonClick={populateLayer}
        isButtonDisabled={!canPopulate}
      />

      <Scrollable>
        <ChildLayers layers={childrenWithOptions.withPopulateOptions} />

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
          showShuffleItems={dataSourceId || !!rootPath?.length}
          shuffleItems={shuffleItems}
          onShuffleItemsChange={updateShuffleItems}
          showRepeatItems={dataSourceId || !!rootPath?.length}
          repeatItems={repeatItems}
          onRepeatItemsChange={updateRepeatItems}
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
        context={panelContext}
        canClear={canClear}
        canClearChildren={canClearChildren}
        onClear={clearLayer}
      />
    </Panel>
  )
})
