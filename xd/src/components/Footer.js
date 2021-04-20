import React from 'react'

import Body from './Body'
import Button from './Button'
import Divider from './Divider'
import Fill from './Fill'
import Margin from './Margin'
import Row from './Row'

export default props => (
  <Margin top={12} right={12}>
    <Divider />

    <Margin top={20}>
      <Row>
        <Fill>
          <Body>{props.text}</Body>
        </Fill>

        <Margin left={10}>
          <Button
            type={props.buttonType ? props.buttonType : 'secondary'}
            onClick={props.onButtonClick}
          >
            {props.buttonTitle}
          </Button>
        </Margin>
      </Row>
    </Margin>
  </Margin>
)
