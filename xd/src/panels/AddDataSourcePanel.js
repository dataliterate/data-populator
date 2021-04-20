import React, { useState, useEffect, useRef } from 'react'
import { withTheme } from 'styled-components'

import { editDocument } from 'application'

import Column from '../components/Column'
import Header from '../components/Header'
import Scrollable from '../components/Scrollable'

import DataSourceType from '../blocks/DataSourceType'
import DataSourceDestination from '../blocks/DataSourceDestination'
import DataPreview from '../blocks/DataPreview'
import File from '../blocks/File'
import Name from '../blocks/Name'
import URL from '../blocks/URL'

import * as panelsLib from '.'
import * as dataSourcesLib from '../libraries/dataSources'

import analytics from '@data-populator/core/analytics'

const strings = require('../strings').get('panels.addDataSource')

export default withTheme(props => {
  // Temporary data source and data for previewing while creating
  const [temporaryDataSource, setTemporaryDataSource] = useState(undefined)
  const [temporaryData, setTemporaryData] = useState(undefined)
  const [isTemporaryDataLoading, setIsTemporaryDataLoading] = useState(false)
  const temporaryDataTimeout = useRef(null)

  // Data source properties
  const [name, setName] = useState('')
  const [type, setType] = useState('local')
  const [file, setFile] = useState(null)
  const [url, setUrl] = useState('')
  const [variables, setVariables] = useState([])
  const [headers, setHeaders] = useState([])

  const [destination, setDestination] = useState('documentOnly')

  // Disable action button if required properties are missing
  const isDisabled = !(name.length > 0 && (file || url.length > 0))

  // Focus name on load
  const nameTextFieldRef = useRef(null)

  // Add data source to library
  const addDataSource = async () => {
    try {
      // Store data source to the selected destination
      editDocument(async () => {
        const preparedDataSource = prepareDataSourceProperties()

        if (destination === 'documentOnly') {
          await dataSourcesLib.addDocumentDataSource(preparedDataSource)
        } else if (destination === 'libraryOnly') {
          await dataSourcesLib.addLibraryDataSource(preparedDataSource)
        }
        if (destination === 'both') {
          const addedDataSource = await dataSourcesLib.addLibraryDataSource(preparedDataSource)
          await dataSourcesLib.addDocumentDataSource(addedDataSource)
        }

        analytics.track('addDataSource', {
          type,
          variables: type === 'remote' ? !!variables.length : undefined,
          headers: type === 'remote' ? !!headers.length : undefined
        })

        props.goBack()
      })
    } catch (e) {}
  }

  const prepareDataSourceProperties = () => {
    const properties = {
      name,
      type
    }

    if (type === 'local') {
      try {
        properties.data = file ? JSON.parse(file.data) : undefined
      } catch (e) {
        properties.dataInvalid = true
      }
    } else if (type === 'remote') {
      properties.url = url
      properties.variables = {}
      properties.headers = {}

      variables.forEach(variable => {
        if (!variable.variable || !variable.defaultValue) return
        properties.variables[variable.variable] = variable.defaultValue
      })

      headers.forEach(header => {
        if (!header.key || !header.value) return
        properties.headers[header.key] = header.value
      })
    }

    return properties
  }

  const updateTemporaryDataSource = async updateData => {
    const updatedDataSource = await dataSourcesLib.createDataSource(prepareDataSourceProperties())
    setTemporaryDataSource(updatedDataSource)

    if (updateData) {
      setTemporaryData(undefined)
      setIsTemporaryDataLoading(true)

      clearTimeout(temporaryDataTimeout.current)
      temporaryDataTimeout.current = setTimeout(async () => {
        setTemporaryData((await updatedDataSource.getData()) || null)

        setIsTemporaryDataLoading(false)
      }, 500)
    }
  }

  const changeDataSourceType = newType => {
    setType(newType)

    // Reset data source when type is changed
    setFile(undefined)
    setUrl('')
    setTemporaryDataSource(undefined)
    setTemporaryData(undefined)
  }

  const changeDataSourceDestination = newDestination => {
    setDestination(newDestination)
  }

  // Update data source when properties are changed
  useEffect(() => {
    updateTemporaryDataSource(true)
  }, [name, type, url, variables, headers])

  // Update data source and data when local file changes
  useEffect(() => {
    if (file) updateTemporaryDataSource(true)
  }, [file])

  useEffect(() => {
    if (nameTextFieldRef.current) nameTextFieldRef.current.focus()
  }, [nameTextFieldRef])

  return (
    <Column style={{ flex: 1 }}>
      <Header
        hasBackArrow={true}
        onBackArrowClick={props.goBack}
        title={strings.title()}
        hasButton={true}
        buttonTitle={strings.add()}
        isButtonDisabled={isDisabled}
        onButtonClick={addDataSource}
      />

      <Scrollable>
        <Name textFieldRef={nameTextFieldRef} value={name} onChange={setName} />

        <DataSourceType
          onHelpClick={panelsLib.showHelp}
          value={type}
          onChange={changeDataSourceType}
        />

        {type === 'local' && <File types={['json']} onChange={setFile} />}
        {type === 'remote' && (
          <URL
            onHelpClick={panelsLib.showHelp}
            url={url}
            populatedUrl={temporaryDataSource?.getPopulatedUrl()}
            onUrlChange={setUrl}
            variables={variables}
            onVariablesChange={setVariables}
            headers={headers}
            onHeadersChange={setHeaders}
            onPreview={() => updateTemporaryDataSource(true)}
          />
        )}

        {(isTemporaryDataLoading || temporaryData !== undefined) && (
          <DataPreview
            dataSource={temporaryDataSource}
            isDataLoading={isTemporaryDataLoading}
            data={temporaryData}
          />
        )}

        <DataSourceDestination
          onHelpClick={panelsLib.showHelp}
          value={destination}
          onChange={changeDataSourceDestination}
        />
      </Scrollable>
    </Column>
  )
})
