import React, { useState, useEffect, useRef } from 'react'
import { withTheme } from 'styled-components'
import * as coreLibs from '@data-populator/core'

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

import { useData, showHelp } from '.'
import * as populatorLib from '../libraries/populator'
import * as layersLib from '../libraries/layers'

import analytics from '@data-populator/core/analytics'

const strings = require('../strings').get('panels.shape')

export default withTheme(({ selectedLayer }) => {
  // Populate options
  const [imagePath, setImagePath] = useState('')
  const [fallbackImageUrl, setFallbackImageUrl] = useState('')

  // Data options
  const [dataSourceId, setDataSourceId] = useState()
  const [rootPath, setRootPath] = useState('')
  const [urlVariableOverrides, setUrlVariableOverrides] = useState({})

  // Data
  const { dataSources, data, isDataLoading } = useData(selectedLayer, dataSourceId, [
    urlVariableOverrides,
    rootPath
  ])

  // Images
  const [imageData, setImageData] = useState()
  const [fallbackImageData, setFallbackImageData] = useState()
  const imageLoadingTimeout = useRef(null)
  const fallbackImageLoadingTimeout = useRef(null)

  // Derived values
  const layerPath = layersLib.getLayerPathString(selectedLayer)
  const imageUrl = coreLibs.utils.accessObjectByString(data?.data, imagePath) || imagePath

  // Populate conditions
  const canPopulate =
    populatorLib.getPopulateOptions(selectedLayer) && (imageData || fallbackImageData)

  // Clear conditions
  const canClear = populatorLib.hasOptions(selectedLayer)

  const clearLayer = options => {
    analytics.track('clear', {
      context: 'shape',
      ...options
    })

    editDocument(async () => {
      await populatorLib.clearLayers([selectedLayer], options)
      await loadOptions()
    })
  }

  const populateLayer = async () => {
    analytics.track('populate', {
      context: 'shape'
    })

    editDocument(async () => {
      await populatorLib.populateLayers([selectedLayer])
    })
  }

  const updateImagePath = value => {
    analytics.trackDebounced('setImagePath', {
      context: 'shape',
      imagePath: !!value.length
    })

    editDocument(() => {
      populatorLib.setPopulateOption(selectedLayer, 'imagePath', value)
      setImagePath(value)
    })
  }

  const updateFallbackImageUrl = value => {
    analytics.trackDebounced('setFallbackImageUrl', {
      context: 'shape',
      fallbackImageUrl: !!value.length
    })

    editDocument(() => {
      populatorLib.setPopulateOption(selectedLayer, 'fallbackImageUrl', value)
      setFallbackImageUrl(value)
    })
  }

  const updateDataSource = async (selectedDataSourceId, userInitiated) => {
    userInitiated &&
      analytics.track('setDataSource', {
        context: 'shape',
        dataSource: !!selectedDataSourceId
      })

    editDocument(async () => {
      userInitiated && (await populatorLib.setDataSource(selectedLayer, selectedDataSourceId))
      setDataSourceId(selectedDataSourceId)
    })
  }

  const updateUrlVariableOverride = async (variable, value) => {
    analytics.trackDebounced('setUrlVariableOverride', {
      context: 'shape'
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
      context: 'shape',
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
    setImagePath(populateOptions?.imagePath || '')
    setFallbackImageUrl(populateOptions?.fallbackImageUrl || '')

    // Data options
    const dataOptions = populatorLib.getDataOptions(selectedLayer)
    setDataSourceId(dataOptions?.dataSource?.id)
    setRootPath(dataOptions?.rootPath || '')
    setUrlVariableOverrides(dataOptions?.urlVariableOverrides || {})

    // Reset images
    setImageData()
    setFallbackImageData()
  }

  useEffect(() => {
    clearTimeout(imageLoadingTimeout.current)

    imageLoadingTimeout.current = setTimeout(async () => {
      setImageData(
        await populatorLib.getImageBase64(imageUrl?.length ? imageUrl : null, data?.dataSource?.id)
      )
    }, 300)

    return () => {
      clearTimeout(imageLoadingTimeout.current)
    }
  }, [imageUrl, data])

  useEffect(() => {
    clearTimeout(fallbackImageLoadingTimeout.current)

    fallbackImageLoadingTimeout.current = setTimeout(async () => {
      setFallbackImageData(
        await populatorLib.getImageBase64(fallbackImageUrl, data?.dataSource?.id)
      )
    }, 300)

    return () => {
      clearTimeout(fallbackImageLoadingTimeout.current)
    }
  }, [fallbackImageUrl, data])

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
          type="shape"
          onHelpClick={showHelp}
          value={imagePath}
          onChange={updateImagePath}
          preview={imageData}
        />

        <DefaultFallback
          type="shape"
          onHelpClick={showHelp}
          value={fallbackImageUrl}
          onChange={updateFallbackImageUrl}
          preview={fallbackImageData}
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
        context="shape"
        canClear={canClear}
        canClearChildren={false}
        onClear={clearLayer}
      />
    </Panel>
  )
})
