import React from 'react'

import Block from '../components/Block'
import BlockHeading from '../components/BlockHeading'
import TextField from '../components/TextField'

const strings = require('../strings').get('blocks.name')

export default props => (
  <Block>
    <BlockHeading label={strings.title()} />

    <TextField
      ref={props.textFieldRef ? props.textFieldRef : undefined}
      placeholder={strings.dataSourceName()}
      value={props.value}
      onChange={props.onChange}
    />
  </Block>
)
