import React from 'react'

import BlockHeading from '../components/BlockHeading'
import Block from '../components/Block'
import Body from '../components/Body'
import Button from '../components/Button'
import Column from '../components/Column'
import DataSource from '../components/DataSource'
import Fill from '../components/Fill'
import Heading from '../components/Heading'
import Margin from '../components/Margin'
import Row from '../components/Row'

const strings = require('../strings').get('blocks.dataSources')

export default props => {
  return (
    <Column style={{ flex: 1 }}>
      {/* Heading */}
      <Margin bottom={20}>
        <Row>
          <Fill>
            <Heading>{strings.title()}</Heading>
            <Body>{strings.subtitle()}</Body>
          </Fill>

          <Margin left={10}>
            <Button type="primary" onClick={props.onAddButtonClick}>
              {strings.add()}
            </Button>
          </Margin>
        </Row>
      </Margin>

      <Column style={{ flex: 1 }}>
        <Column
          style={{
            overflowX: 'hidden',
            overflowY: 'auto',
            minHeight: 0,

            marginRight: -12,
            paddingRight: 12,
            flex: 1
          }}
        >
          <div style={{ flexShrink: 0 }}>
            {/* Used data sources */}
            {props.usedDataSources?.length > 0 && (
              <Block isLast={false}>
                <BlockHeading
                  label={strings.usedDataSources()}
                  icon="HelpOutline"
                  onIconClick={() => props.onHelpClick('usedDataSources')}
                />

                {props.usedDataSources.map((dataSource, index) => {
                  let menuActions = []
                  if (
                    dataSource.isMissing &&
                    (props.libraryDataSources?.length || props.documentDataSources?.length)
                  ) {
                    menuActions = [
                      { id: 'showMissingDataSourceRelinkOptions', name: strings.relink() }
                    ]
                  }

                  return (
                    <div key={index} style={{ flexShrink: 0 }}>
                      <Margin bottom={index === props.usedDataSources.length - 1 ? 0 : 10}>
                        <DataSource
                          name={dataSource.name}
                          type={dataSource.type}
                          info={!dataSource.isMissing ? strings[dataSource.origin]() : undefined}
                          error={dataSource.isMissing ? strings.missing() : undefined}
                          layerCount={dataSource.layers?.length}
                          onClick={
                            !dataSource.isMissing
                              ? () => props.onDataSourceAction(dataSource, 'showDataPreview')
                              : undefined
                          }
                          menuActions={menuActions}
                          onAction={action => props.onDataSourceAction(dataSource, action)}
                        />
                      </Margin>
                    </div>
                  )
                })}
              </Block>
            )}

            {/* Document data sources */}
            <Block isLast={false}>
              <BlockHeading
                label={strings.documentDataSources()}
                icon="HelpOutline"
                onIconClick={() => props.onHelpClick('documentDataSources')}
              />

              {props.documentDataSources.map((dataSource, index) => {
                let menuActions = [
                  { id: 'editDataSource', name: strings.edit() },
                  { id: 'removeDataSource', name: strings.remove() }
                ]

                if (!dataSource.inLibrary) {
                  menuActions.push({ id: 'addDataSourceToLibrary', name: strings.addToLibrary() })
                }

                if (dataSource.outOfSync) {
                  menuActions.push({
                    id: 'updateDataSourceToLibraryVersion',
                    name: strings.updateToLibraryVersion()
                  })
                }

                return (
                  <div key={index} style={{ flexShrink: 0 }}>
                    <Margin bottom={index === props.documentDataSources.length - 1 ? 0 : 10}>
                      <DataSource
                        name={dataSource.name}
                        type={dataSource.type}
                        warning={dataSource.outOfSync ? strings.outOfSync() : undefined}
                        onClick={() => props.onDataSourceAction(dataSource, 'showDataPreview')}
                        menuActions={menuActions}
                        onAction={action => props.onDataSourceAction(dataSource, action)}
                      />
                    </Margin>
                  </div>
                )
              })}

              {!props.documentDataSources?.length && <Body>{strings.noDocumentDataSources()}</Body>}
            </Block>

            {/* Library data sources */}
            <Block isLast={true}>
              <BlockHeading
                label={strings.libraryDataSources()}
                icon="HelpOutline"
                onIconClick={() => props.onHelpClick('libraryDataSources')}
              />

              {props.libraryDataSources.map((dataSource, index) => {
                let menuActions = [
                  { id: 'editDataSource', name: strings.edit() },
                  { id: 'removeDataSource', name: strings.remove() }
                ]

                if (!dataSource.inDocument) {
                  menuActions.push({ id: 'addDataSourceToDocument', name: strings.addToDocument() })
                }

                if (dataSource.overridden) {
                  menuActions.push({
                    id: 'updateDataSourceToDocumentVersion',
                    name: strings.updateToDocumentVersion()
                  })
                }

                return (
                  <div key={index} style={{ flexShrink: 0 }}>
                    <Margin bottom={index === props.libraryDataSources.length - 1 ? 0 : 10}>
                      <DataSource
                        name={dataSource.name}
                        type={dataSource.type}
                        warning={dataSource.overridden ? strings.overridden() : undefined}
                        onClick={() => props.onDataSourceAction(dataSource, 'showDataPreview')}
                        menuActions={menuActions}
                        onAction={action => props.onDataSourceAction(dataSource, action)}
                      />
                    </Margin>
                  </div>
                )
              })}

              {!props.libraryDataSources?.length && <Body>{strings.noLibraryDataSources()}</Body>}
            </Block>
          </div>
        </Column>
      </Column>
    </Column>
  )
}
