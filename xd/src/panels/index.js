import { useState, useEffect, useRef } from 'react'

import * as dataSourcesLib from '../libraries/dataSources'
import * as populatorLib from '../libraries/populator'

import analytics from '@data-populator/core/analytics'

export function showHelp(type) {
  analytics.track('showHelp', {
    topic: type
  })

  document.dispatchEvent(
    new CustomEvent('openModal', {
      detail: {
        id: 'help',
        data: {
          type
        }
      }
    })
  )
}

export function useData(layer, dataSourceId, dependencies) {
  const [dataSources, setDataSources] = useState([])
  const [data, setData] = useState()

  const [isDataLoading, setIsDataLoading] = useState(false)

  const isMounted = useRef(true)
  const updateTimeout = useRef(null)

  const update = async () => {
    // Get data options of the layer
    const dataOptions = populatorLib.getDataOptions(layer)

    // Load available data sources
    // Make sure that the stored data source is always in the list of available sources, even if missing
    let _dataSources = await dataSourcesLib.getDataSources()
    if (
      dataOptions?.dataSource &&
      !_dataSources.map(ds => ds.id).includes(dataOptions?.dataSource.id)
    ) {
      const missingDataSource = {
        ...dataOptions?.dataSource,
        isMissing: true
      }
      _dataSources = [missingDataSource].concat(_dataSources)
    }

    // Clear all cached data to fetch fresh data
    dataSourcesLib.removeCachedData()

    // Get layer data
    const _data = await populatorLib.getDataForLayer(layer)

    // Update state
    if (!isMounted.current) return
    setDataSources(_dataSources)
    setData(_data)
  }

  // Track mounted state
  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  })

  // Update when layer or dependencies change
  useEffect(() => {
    setIsDataLoading(true)

    clearTimeout(updateTimeout.current)
    updateTimeout.current = setTimeout(async () => {
      await update()

      setIsDataLoading(false)
    }, 500)

    return () => {
      clearTimeout(updateTimeout.current)
    }
  }, [...dependencies])

  // Update without delay if layer or data source changed
  useEffect(() => {
    setIsDataLoading(true)

    setTimeout(async () => {
      await update()
      setIsDataLoading(false)
    })
  }, [layer, dataSourceId])

  return {
    dataSources,
    data,
    isDataLoading
  }
}
