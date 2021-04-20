import React from 'react'
import { withTheme } from 'styled-components'

export default withTheme(props => (
  <div
    style={{
      width: '100%',
      height: 2,
      backgroundColor: props.isDark ? props.theme.gray900 : props.theme.gray300,
      borderRadius: 1
    }}
  />
))
