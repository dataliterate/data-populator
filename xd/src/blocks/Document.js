import React from 'react'

import Block from '../components/Block'
import BlockHeading from '../components/BlockHeading'
import Body from '../components/Body'
import Column from '../components/Column'
import DataSource from '../components/DataSource'
import Fill from '../components/Fill'
import Heading from '../components/Heading'
import Margin from '../components/Margin'

const strings = require('../strings').get('blocks.document')

export default props => {
  const hasUsedDataSources = props.usedDataSources.length > 0
  const hasMissingDataSources = props.missingDataSources.length > 0

  return (
    <Column style={{ flex: 1 }}>
      <Margin bottom={20 - 3}>
        <Heading>{strings.title()}</Heading>
        <Body>{strings.subtitle()}</Body>
      </Margin>

      <Fill
        style={{
          overflowX: 'hidden',
          overflowY: 'auto',
          minHeight: 0,
          marginRight: -12,
          paddingTop: 3,
          paddingRight: 12
        }}
      >
        {!hasUsedDataSources && !hasMissingDataSources && (
          <Body>{strings.noDataSourcesUsed()}</Body>
        )}

        {hasUsedDataSources && (
          <Block isLast={!hasMissingDataSources}>
            <BlockHeading
              label={strings.usedDataSources()}
              icon="HelpOutline"
              onIconClick={() => props.onHelpClick('usedDataSources')}
            />

            {props.usedDataSources.map((dataSource, index) => (
              <Margin
                key={dataSource.id}
                bottom={index === props.usedDataSources.length - 1 ? 0 : 10}
              >
                <DataSource
                  name={dataSource.name}
                  type={dataSource.type}
                  showIconOnHover={true}
                  onClick={() => props.onUsedDataSourceClick(dataSource.id)}
                  onIconClick={() => props.onUsedDataSourceIconClick(dataSource.id)}
                />
              </Margin>
            ))}
          </Block>
        )}

        {hasMissingDataSources && (
          <Block isLast={true}>
            <BlockHeading
              label={strings.missingDataSources()}
              icon="HelpOutline"
              onIconClick={() => props.onHelpClick('missingDataSources')}
            />

            {props.missingDataSources.map((dataSource, index) => (
              <Margin
                key={dataSource.id}
                bottom={index === props.missingDataSources.length - 1 ? 0 : 10}
              >
                <DataSource
                  isMissing={true}
                  name={dataSource.name}
                  type={dataSource.type}
                  layerCount={dataSource.layerCount}
                  onIconClick={() => props.onMissingDataSourceClick(dataSource.id)}
                />
              </Margin>
            ))}
          </Block>
        )}
      </Fill>
    </Column>
  )
}
