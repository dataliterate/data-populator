import React from 'react'
import { withTheme } from 'styled-components'

export default withTheme(props => (
  <sp-label script="latin" style={{ padding: 0, margin: 0, color: props.theme.gray700 }}>
    {props.children}
  </sp-label>
))
