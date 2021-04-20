import React from 'react'
import { withTheme } from 'styled-components'

import Body from './Body'
import Margin from './Margin'

export default withTheme(props => (
  <Margin top={5} style={{ width: '100%' }}>
    <div
      style={{
        display: 'flex',
        borderLeft: `1px solid ${props.theme.gray500}`,
        paddingLeft: 13,
        width: '100%',
        overflow: 'hidden'
      }}
    >
      <Body
        style={{
          maxWidth: '100%'
        }}
      >
        {props.children}
      </Body>
    </div>
  </Margin>
))
