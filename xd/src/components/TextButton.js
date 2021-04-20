import React from 'react'
import styled from 'styled-components'

const Text = styled.div`
  font-size: 11px;
  color: ${props => props.theme.gray600};

  max-width: fit-content;

  &:hover {
    color: ${props => props.theme.gray800};
  }
`

export default props => {
  return <Text onClick={props.onClick}>{props.children}</Text>
}
