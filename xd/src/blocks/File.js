import React from 'react'

import Block from '../components/Block'
import BlockHeading from '../components/BlockHeading'
import FileSelector from '../components/FileSelector'

const strings = require('../strings').get('blocks.file')

export default props => {
  const title = !props.isUpdate ? strings.toImport() : strings.toUpdate()

  return (
    <Block>
      <BlockHeading label={title} />

      <FileSelector types={props.types} onChange={props.onChange} />
    </Block>
  )
}
