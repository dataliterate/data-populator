import React from 'react'
import { withTheme } from 'styled-components'

import Block from '../components/Block'
import BlockHeading from '../components/BlockHeading'
import Body from '../components/Body'
import Margin from '../components/Margin'

const strings = require('../strings').get('blocks.childLayers')

export default withTheme(props => {
  const layerTypeCounts = {}
  let layerCount = 0
  let ownDataOptionsCount = 0

  props.layers.forEach(layer => {
    const layerType = layer.layer.constructor.name
    let typeCategory

    if (['RepeatGrid'].includes(layerType)) {
      typeCategory = 'repeatGrid'
    } else if (layerType === 'Text') {
      typeCategory = 'text'
    } else if (['Rectangle', 'Ellipse', 'Polygon', 'Path', 'BooleanGroup'].includes(layerType)) {
      typeCategory = 'shape'
    }

    if (!typeCategory) return

    if (layerTypeCounts[typeCategory]) layerTypeCounts[typeCategory]++
    else layerTypeCounts[typeCategory] = 1

    layerCount++

    if (layer.hasDataSource) ownDataOptionsCount++
  })

  const getLayerString = type => {
    const count = layerTypeCounts[type]

    return strings.layerTypeCount[type]({ count, plural: count > 1 })
  }

  return (
    <Block>
      <BlockHeading label={strings.title()} />

      {Object.keys(layerTypeCounts).map(type => (
        <Body key={type} size="S" color={props.theme.gray800}>
          {getLayerString(type)}
        </Body>
      ))}

      {layerCount === 0 && (
        <Margin top={10}>
          <Body>{strings.noPopulatableLayersDescription()}</Body>
        </Margin>
      )}

      {ownDataOptionsCount > 0 && (
        <Margin top={10}>
          <Body>
            {ownDataOptionsCount > 1
              ? strings.ownDataOptionsDescriptionPlural({ count: ownDataOptionsCount })
              : strings.ownDataOptionsDescription()}
          </Body>
        </Margin>
      )}
    </Block>
  )
})
