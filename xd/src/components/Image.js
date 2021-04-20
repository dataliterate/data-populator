import React from 'react'
import styled from 'styled-components'

import defaultSrc from '../images/imageDefaultFallback.png'

const Image = styled.div`
  width: 32px;
  height: 32px;

  border-radius: 4px;

  background-image: url(${props => props.src});
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  background-color: ${props => props.theme.gray300};
`

export default props => {
  const src = props.src ? props.src : defaultSrc

  return <Image src={src} />
}
