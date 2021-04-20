import React, { useState, useEffect, useRef } from 'react'
import { withTheme } from 'styled-components'

import { editDocument } from 'application'

import Column from '../components/Column'
import Footer from '../components/Footer'
import Header from '../components/Header'
import Scrollable from '../components/Scrollable'

import DataSourceType from '../blocks/DataSourceType'
import DataPreview from '../blocks/DataPreview'
import File from '../blocks/File'
import Name from '../blocks/Name'
import URL from '../blocks/URL'

import * as panelsLib from '.'
import * as dataSourcesLib from '../libraries/dataSources'
import * as populatorLib from '../libraries/populator'

import analytics from '@data-populator/core/analytics'

const strings = require('../strings').get('panels.editDataSource')

export default withTheme(props => {
  // Temporary data source and data for previewing while creating
  const [temporaryDataSource, setTemporaryDataSource] = useState(undefined)
  const [temporaryData, setTemporaryData] = useState(undefined)
  const [isTemporaryDataLoading, setIsTemporaryDataLoading] = useState(false)
  const temporaryDataTimeout = useRef(null)

  // Name
  const [name, setName] = useState(props.dataSource.name)
  const [type, setType] = useState(props.dataSource.type)
  const [file, setFile] = useState(null)
  const [url, setUrl] = useState(props.dataSource.url || '')
  const [variables, setVariables] = useState(
    // Convert variables object into array
    props.dataSource.variables
      ? Object.keys(props.dataSource.variables).map(variable => ({
          originalVariable: variable,
          variable,
          defaultValue: props.dataSource.variables[variable]
        }))
      : []
  )

  const [headers, setHeaders] = useState(
    // Convert headers object into array
    props.dataSource.headers
      ? Object.keys(props.dataSource.headers).map(key => ({
          key,
          value: props.dataSource.headers[key]
        }))
      : []
  )

  // Disable action button if required properties are missing
  const isDisabled = !(name.length > 0 && (file || url.length > 0 || temporaryData))

  const saveDataSource = async () => {
    editDocument(async () => {
      try {
        if (props.dataSource.origin === 'document') {
          await dataSourcesLib.updateDocumentDataSource(
            props.dataSource.id,
            prepareDataSourceProperties()
          )
        } else if (props.dataSource.origin === 'library') {
          await dataSourcesLib.updateLibraryDataSource(
            props.dataSource.id,
            prepareDataSourceProperties()
          )
        }

        // Update all variable overrides to handle variable name changes
        const affectedLayers = populatorLib.findChildrenWithDataSource(null, props.dataSource.id)
        if (affectedLayers.length) {
          // Only update overrides if data source already had variables
          if (props.dataSource.variables) {
            // Update each variable if needed for each affected layer
            for (let affectedLayer of affectedLayers) {
              const variableOverrides = populatorLib.getDataOption(
                affectedLayer,
                'urlVariableOverrides'
              )

              // Only if affected layer has variable overrides
              if (variableOverrides) {
                const updatedVariableOverrides = {}

                for (let variable of variables) {
                  // Only if affected layer has an override for this variable
                  if (variableOverrides[variable.originalVariable] !== undefined) {
                    updatedVariableOverrides[variable.variable] =
                      variableOverrides[variable.originalVariable]
                  }
                }

                // Set updated variable overrides
                populatorLib.setDataOption(
                  affectedLayer,
                  'urlVariableOverrides',
                  updatedVariableOverrides
                )
              }
            }
          }
        }

        analytics.track('editDataSource', {
          originalType: props.dataSource.type,
          type,
          variables: type === 'remote' ? !!variables.length : undefined,
          headers: type === 'remote' ? !!headers.length : undefined
        })

        props.goBack()
      } catch (e) {}
    })
  }

  const prepareDataSourceProperties = () => {
    const properties = {
      name,
      type
    }

    if (type === 'local') {
      try {
        properties.data = file ? JSON.parse(file.data) : props.dataSource.data
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

  // Prepare temporary data source to preview data on panel load
  useEffect(() => {
    updateTemporaryDataSource(true)
  }, [])

  // Update data source when properties are changed
  useEffect(() => {
    updateTemporaryDataSource(true)
  }, [name, type, url, variables, headers])

  // Update data source and data when local file changes
  useEffect(() => {
    if (file) updateTemporaryDataSource(true)
  }, [file])

  return (
    <Column style={{ flex: 1 }}>
      <Header
        hasBackArrow={true}
        onBackArrowClick={props.goBack}
        title={strings.title()}
        hasButton={true}
        buttonTitle={strings.save()}
        isButtonDisabled={isDisabled}
        onButtonClick={saveDataSource}
      />

      <Scrollable>
        <Name value={name} onChange={setName} />

        <DataSourceType
          onHelpClick={panelsLib.showHelp}
          value={type}
          onChange={changeDataSourceType}
        />

        {type === 'local' && <File types={['json']} isUpdate={true} onChange={setFile} />}
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
      </Scrollable>

      {/* <Footer
        text={strings.footer()}
        buttonType="warning"
        buttonTitle={strings.delete()}
        onButtonClick={deleteDataSource}
      /> */}
    </Column>
  )
})
