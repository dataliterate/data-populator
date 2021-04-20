import React from 'react'

import Fill from './Fill'
import IconButton from './IconButton'
import Label from './Label'
import Margin from './Margin'
import Row from './Row'

export default props => (
  <Margin bottom={6}>
    <Row style={{ height: 18, alignItems: 'center' }}>
      <Fill>{props.label && <Label>{props.label}</Label>}</Fill>

      {props.icon && (
        <Margin left={5}>
          <IconButton icon={props.icon} onClick={props.onIconClick} />
        </Margin>
      )}
    </Row>
  </Margin>
)
