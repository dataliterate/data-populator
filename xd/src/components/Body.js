import React from 'react'
import { withTheme } from 'styled-components'

export default withTheme(props => (
  <sp-body
    script="latin"
    size={props.size ? props.size : 'XS'}
    style={{
      padding: 0,
      margin: 0,
      fontWeight: props.fontWeight ? props.fontWeight : 400,
      wordBreak: 'break-word',
      color: props.color ? props.color : props.theme.gray600,
      fontFamily: props.monospace ? "Menlo, Monaco, 'Courier New', monospace" : undefined,
      ...(props.style ? props.style : {})
    }}
    onClick={props.onClick}
  >
    {props.children}
  </sp-body>
))
