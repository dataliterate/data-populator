import React from 'react'

import Block from '../components/Block'
import BlockHeading from '../components/BlockHeading'
import ImageTextField from '../components/ImageTextField'
import TextField from '../components/TextField'

const strings = require('../strings').get('blocks.defaultFallback')

export default props => {
  const titles = {
    artboard: strings.artboardTitle(),
    text: strings.textTitle(),
    shape: strings.shapeTitle()
  }

  const helpId = `defaultFallback${props.type[0].toUpperCase() + props.type.substring(1)}`

  return (
    <Block bottom={props.bottom}>
      <BlockHeading
        label={titles[props.type]}
        icon="HelpOutline"
        onIconClick={() => props.onHelpClick(helpId)}
      />

      {props.type !== 'shape' ? (
        <TextField placeholder={strings.empty()} value={props.value} onChange={props.onChange} />
      ) : (
        <ImageTextField
          placeholder={strings.default()}
          value={props.value}
          image={props.preview}
          onChange={props.onChange}
        />
      )}
    </Block>
  )
}
