import React from 'react'
import { withTheme } from 'styled-components'

export default withTheme(props => (
  <sp-heading
    script="latin"
    size="XXS"
    style={{
      padding: 0,
      margin: 0,
      color: props.theme.gray900
    }}
    onClick={props.onClick}
  >
    {props.children}
  </sp-heading>
))
