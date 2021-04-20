import React from 'react'

import Fill from './Fill'
import Image from './Image'
import Margin from './Margin'
import Row from './Row'
import TextField from './TextField'

export default props => (
  <Row style={{ alignItems: 'center' }}>
    <Fill>
      <TextField placeholder={props.placeholder} value={props.value} onChange={props.onChange} />
    </Fill>

    <Margin left={8}>
      <Image src={props.image} />
    </Margin>
  </Row>
)
