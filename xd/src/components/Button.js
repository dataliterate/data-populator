import React from 'react'

export default props => (
  <sp-button
    disabled={props.isDisabled ? true : undefined}
    quiet={props.isQuiet ? true : undefined}
    variant={props.type}
    onClick={props.onClick}
  >
    {props.children}
  </sp-button>
)
