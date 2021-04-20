import React from 'react'

import Block from '../components/Block'
import BlockHeading from '../components/BlockHeading'
import Checkbox from '../components/Checkbox'

const strings = require('../strings').get('blocks.textTrimming')

export default props => (
  <Block>
    <BlockHeading
      label={strings.title()}
      icon="HelpOutline"
      onIconClick={() => props.onHelpClick('textTrimming')}
    />

    <Checkbox isChecked={props.trim} onChange={props.onTrimChange}>
      {strings.trim()}
    </Checkbox>

    <Checkbox isChecked={props.insertEllipsis} onChange={props.onInsertEllipsisChange}>
      {strings.ellipsis()}
    </Checkbox>
  </Block>
)
