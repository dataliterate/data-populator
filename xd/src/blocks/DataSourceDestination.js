import React from 'react'

import BlockHeading from '../components/BlockHeading'
import Margin from '../components/Margin'
import RadioGroup from '../components/RadioGroup'

const strings = require('../strings').get('blocks.dataSourceDestination')

export default props => (
  <Margin bottom={20}>
    <BlockHeading
      label={strings.title()}
      icon="HelpOutline"
      onIconClick={() => props.onHelpClick('dataSourceDestination')}
    />

    <RadioGroup
      options={[
        { id: 'documentOnly', name: strings.documentOnly() },
        { id: 'libraryOnly', name: strings.libraryOnly() },
        { id: 'both', name: strings.both() }
      ]}
      value={props.value}
      onChange={props.onChange}
    />
  </Margin>
)
