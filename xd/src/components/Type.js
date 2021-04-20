import React from 'react'
import styled from 'styled-components'

const strings = require('../strings').get('components.type')

const Type = styled.div`
  font-size: 11px;
  color: ${props => props.theme.blue600};
  font-weight: 500;
`

export default props => {
  const types = {
    local: strings.local(),
    remote: strings.remote()
  }

  return <Type>{types[props.type]}</Type>
}
