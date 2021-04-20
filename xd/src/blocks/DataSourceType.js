import React from 'react'

import BlockHeading from '../components/BlockHeading'
import Margin from '../components/Margin'
import RadioGroup from '../components/RadioGroup'

const strings = require('../strings').get('blocks.dataSourceType')

export default props => (
  <Margin bottom={20}>
    <BlockHeading
      label={strings.title()}
      icon="HelpOutline"
      onIconClick={() => props.onHelpClick('dataSourceType')}
    />

    <RadioGroup
      options={[
        { id: 'local', name: strings.local() },
        { id: 'remote', name: strings.remote() }
      ]}
      value={props.value}
      onChange={props.onChange}
    />
  </Margin>
)
