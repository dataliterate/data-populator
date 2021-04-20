import React from 'react'
import { withTheme } from 'styled-components'

import Icon from './Icon'

export default withTheme(props => {
  const Icon_ = props.icon ? Icon[props.icon] : null

  return (
    <sp-action-button
      quiet={props.isQuiet ? true : undefined}
      style={{ maxHeight: 24, maxWidth: 'fit-content', ...(props.style ? props.style : {}) }}
      onClick={props.onClick}
    >
      {props.icon && (
        <Icon_
          slot="icon"
          color={props.iconColor ? props.iconColor : props.theme.gray700}
          hoverColor={props.iconHoverColor ? props.iconHoverColor : props.theme.gray900}
        />
      )}
      {props.children}
    </sp-action-button>
  )
})
