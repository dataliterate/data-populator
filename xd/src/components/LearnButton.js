import React from 'react'
import styled, { withTheme } from 'styled-components'

import Icon from './Icon'

const Container = styled.div`
  background-color: ${props => props.theme.white};
  border-radius: 4px;

  padding: 7px 8px;

  display: flex;
  flex-direction: row;
`

const IconContainer = styled.div`
  margin-right: 8px;

  width: 24px;
  height: 18px;

  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`

const Title = styled.div`
  flex: 1;

  font-size: 14px;
  color: ${props => props.theme.gray800};
  line-height: 18px;

  ${Container}:hover & {
    color: ${props => props.theme.gray900};
  }
`

export default withTheme(props => {
  const Icon_ = Icon[props.icon]

  return (
    <Container onClick={props.onClick}>
      <IconContainer>
        <Icon_ parent={Container} color={props.theme.blue400} hoverColor={props.theme.blue700} />
      </IconContainer>

      <Title>{props.children}</Title>
    </Container>
  )
})
