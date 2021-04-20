import React from 'react'

import Block from '../components/Block'
import BlockHeading from '../components/BlockHeading'
import Body from '../components/Body'
import Checkbox from '../components/Checkbox'
import DataSource from '../components/DataSource'
import Dropdown from '../components/Dropdown'
import Margin from '../components/Margin'
import Row from '../components/Row'
import Fill from '../components/Fill'
import TextField from '../components/TextField'
import Populated from '../components/Populated'

const strings = require('../strings').get('blocks.dataSource')

export default props => {
  const types = {
    local: strings.local(),
    remote: strings.remote()
  }

  const dataSources = []

  // Add Inherit or None based on type
  if (!props.isInheritable)
    dataSources.push({
      id: '_none',
      name: strings.none()
    })
  else
    dataSources.push({
      id: '_inherit',
      name: strings.inherit(),
      data: []
    })

  if (props.dataSources.length > 0)
    dataSources.push({
      id: '_divider',
      isDivider: true
    })

  dataSources.push(
    ...props.dataSources.map(dataSource => {
      return {
        ...dataSource,
        name: strings.dataSourceOption({
          name: dataSource.name,
          type: types[dataSource.type],
          isMissing: dataSource.isMissing
        })
      }
    })
  )

  const missingDataSource = props.dataSources.find(ds => ds.isMissing)

  const onDataSourceIdChange = (newValue, userInitiated) => {
    props.onDataSourceIdChange(
      ['_inherit', '_none'].includes(newValue) ? undefined : newValue,
      userInitiated
    )
  }

  return (
    <>
      <Block>
        <BlockHeading
          label={strings.dataSource()}
          icon="HelpOutline"
          onIconClick={() => props.onHelpClick('dataSource')}
        />

        <Dropdown
          placeholder={strings.loadingDataSources()}
          options={dataSources}
          value={props.dataSourceId || (props.isInheritable ? '_inherit' : '_none')}
          onChange={onDataSourceIdChange}
        />

        <Margin top={10}>
          {props.data?.dataSource ? (
            <>
              <DataSource
                {...props.data.dataSource}
                info={strings[props.data.dataSource.origin]()}
              />

              {/* Hide ancestor layer path */}
              {/* <Margin top={10}>
                <Body>{props.data.layerPath?.map(layer => layer.name)?.join(' / ') || ''}</Body>
              </Margin> */}
            </>
          ) : missingDataSource ? (
            <DataSource {...missingDataSource} error={strings.missing()} />
          ) : (
            <Body>{strings.noInheritableDataSource()}</Body>
          )}
        </Margin>

        {props.data?.dataSource?.type === 'remote' && (
          <Populated>{props.data.dataSource.getPopulatedUrl(props.urlVariableOverrides)}</Populated>
        )}

        {props.dataSourceId && Object.keys(props.data?.dataSource?.variables || {}).length > 0 && (
          <Margin top={20}>
            <BlockHeading
              label={strings.urlVariableOverrides()}
              icon="HelpOutline"
              onIconClick={() => props.onHelpClick('urlVariableOverrides')}
            />

            {Object.keys(props.data.dataSource.variables).map((variable, index) => (
              <Margin key={index} top={index === 0 ? 0 : 10}>
                <Row style={{ alignItems: 'center' }}>
                  <div style={{ marginRight: 10, minWidth: 30 }}>
                    <Body>{variable}</Body>
                  </div>

                  <Fill>
                    <TextField
                      placeholder={props.data.dataSource.variables[variable]}
                      value={props.urlVariableOverrides?.[variable]}
                      onChange={value => props.onUrlVariableOverrideChange(variable, value)}
                    />
                  </Fill>
                </Row>
              </Margin>
            ))}
          </Margin>
        )}
      </Block>

      {(props.isInheritable || props.dataSourceId) && (
        <>
          <Margin bottom={20}>
            <BlockHeading
              label={strings.rootPath()}
              icon="HelpOutline"
              onIconClick={() => props.onHelpClick('rootPath')}
            />

            <TextField
              placeholder={strings.root()}
              value={props.rootPath}
              onChange={props.onRootPathChange}
            />
          </Margin>

          {props.showShuffleItems && (
            <Checkbox isChecked={props.shuffleItems} onChange={props.onShuffleItemsChange}>
              {strings.shuffleItems()}
            </Checkbox>
          )}

          {props.showRepeatItems && (
            <Checkbox isChecked={props.repeatItems} onChange={props.onRepeatItemsChange}>
              {strings.repeatItems()}
            </Checkbox>
          )}
        </>
      )}
    </>
  )
}
