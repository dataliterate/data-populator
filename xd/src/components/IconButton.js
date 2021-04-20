import React from 'react'
import styled, { withTheme } from 'styled-components'

import Icon from './Icon'

const Container = styled.div`
  max-width: 24px;
  max-height: 24px;

  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`

export default withTheme(props => {
  const Icon_ = props.icon ? Icon[props.icon] : null

  return (
    <Container>
      <sp-action-button quiet style={{ maxWidth: 24, maxHeight: 24 }} onClick={props.onClick}>
        <Icon_
          color={props.color ? props.color : props.theme.gray700}
          hoverColor={props.hoverColor ? props.hoverColor : props.theme.gray900}
          parent={props.parent ? props.parent : Container}
          slot="icon"
        />
      </sp-action-button>
    </Container>
  )
})
