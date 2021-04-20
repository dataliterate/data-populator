import React from 'react'

import Block from '../components/Block'
import Checkbox from '../components/Checkbox'

const strings = require('../strings').get('blocks.populateWithRow')

export default props => {
  return (
    <Block>
      <Checkbox isChecked={props.populateWithRow} onChange={props.onChange}>
        {strings.populateWithRow()}
      </Checkbox>
    </Block>
  )
}
