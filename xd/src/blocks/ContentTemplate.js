import React from 'react'

import Block from '../components/Block'
import BlockHeading from '../components/BlockHeading'
import ImageTextField from '../components/ImageTextField'
import Populated from '../components/Populated'
import TextArea from '../components/TextArea'

const strings = require('../strings').get('blocks.contentTemplate')

export default props => {
  const titles = {
    artboard: strings.artboardTitle(),
    text: strings.textTitle(),
    shape: strings.shapeTitle()
  }

  const helpId = `contentTemplate${props.type[0].toUpperCase() + props.type.substring(1)}`

  return (
    <Block>
      <BlockHeading
        label={titles[props.type]}
        icon="HelpOutline"
        onIconClick={() => props.onHelpClick(helpId)}
      />

      {props.type !== 'shape' ? (
        <>
          <TextArea placeholder={strings.empty()} value={props.value} onChange={props.onChange} />

          {props.preview?.length > 0 && <Populated>{props.preview}</Populated>}
        </>
      ) : (
        <ImageTextField
          placeholder={strings.empty()}
          value={props.value}
          onChange={props.onChange}
          image={props.preview}
        />
      )}
    </Block>
  )
}
