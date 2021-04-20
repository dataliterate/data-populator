import React from 'react'
import styled, { withTheme } from 'styled-components'

import Body from '../components/Body'
import Margin from '../components/Margin'

import Modal from '../components/Modal'

const strings = require('../strings').get('components.modals.help')

const ImageContainer = styled.div`
  width: 100%;
  padding-top: 56.25%;

  background-image: url(${props => props.src});
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  background-color: ${props => props.theme.gray300};
`

export default withTheme(props => {
  const keys = [
    'contentTemplateArtboard',
    'contentTemplateText',
    'contentTemplateShape',
    'dataSource',
    'urlVariableOverrides',
    'rootPath',
    'usedDataSources',
    'documentDataSources',
    'libraryDataSources',
    'missingDataSources',
    'dataSourceType',
    'dataSourceDestination',
    'defaultFallbackArtboard',
    'defaultFallbackText',
    'defaultFallbackShape',
    'dataSources',
    'textTrimming',
    'urlVariables'
  ]

  const titles = {}
  const imageSrcs = {}
  const descriptions = {}

  keys.forEach(k => {
    titles[k] = strings[k].title()
    imageSrcs[k] = null
    descriptions[k] = strings[k].description()
  })

  const title = titles[props.type]
  const imageSrc = imageSrcs[props.type]
  const description = descriptions[props.type]

  return (
    <Modal icon="HelpOutline" title={title} onClose={props.onClose}>
      {imageSrc && (
        <Margin bottom={12}>
          <ImageContainer src={imageSrc} />
        </Margin>
      )}

      <Body size={'S'} color={props.theme.gray800}>
        {description}
      </Body>
    </Modal>
  )
})
