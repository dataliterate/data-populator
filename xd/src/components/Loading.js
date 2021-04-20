import React, { useState, useRef, useEffect } from 'react'
import styled, { withTheme } from 'styled-components'

const Container = styled.div`
  position: relative;

  width: ${props => props.size}px;
  height: ${props => props.size}px;
`

const Ball = styled.div`
  position: absolute;
  top: ${props => `${props.y}px`};
  left: ${props => `${props.x}px`};

  width: ${props => `${props.ballSize}px`};
  height: ${props => `${props.ballSize}px`};

  border-radius: 50%;
  background-color: ${props => (!props.isHighlighted ? props.color : props.secondaryColor)};
`

export default withTheme(props => {
  const color = props.color ? props.color : props.theme.gray500
  const secondaryColor = props.secondaryColor ? props.secondaryColor : props.theme.gray600
  const size = props.size ? props.size : 18

  const ballSize = Math.floor((size + 2) / 5) // 18 -> 20 -> 4
  const gap = ballSize - 1

  // animation
  const [animationIndex, setAnimationIndex] = useState(0)

  const interval = useRef(null)
  useEffect(() => {
    interval.current = setInterval(() => {
      setAnimationIndex(i => (i < 3 - 1 ? i + 1 : 0))
    }, 250)

    return () => {
      clearInterval(interval.current)
    }
  }, [])

  return (
    <Container size={size}>
      {[...Array(3)].map((a, index) => (
        <Ball
          key={index}
          index={index}
          x={index * (gap + ballSize)}
          y={Math.round(size / 2 - ballSize / 2)}
          color={color}
          secondaryColor={secondaryColor}
          size={size}
          ballSize={ballSize}
          isHighlighted={index === animationIndex}
        />
      ))}
    </Container>
  )
})
