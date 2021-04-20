import React from 'react'

import Margin from './Margin'

export default props => (
  <Margin bottom={props.isLast ? 0 : props.bottom ? props.bottom : 25}>{props.children}</Margin>
)
