import React from 'react'
import styled, { withTheme } from 'styled-components'

import Divider from './Divider'
import Fill from './Fill'
import Heading from './Heading'
import Icon from './Icon'
import IconButton from './IconButton'
import Margin from './Margin'
import Row from './Row'

const Container = styled.div`
  position: relative;

  width: 100%;
  flex: 1;

  display: flex;
  flex-direction: column;
  align-items: center;

  padding: 20px 15px;
`

const Overlay = styled.div`
  position: absolute;
  z-index: 1;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;

  background-color: ${props => props.theme.alpha(props.theme.background, 85)};
`

const Content = styled.div`
  position: relative;
  z-index: 1;

  width: 100%;
  max-width: 360px;
  padding: 12px;

  border-radius: 5px;
  background-color: ${props => props.theme.white};
  border: 2px solid ${props => props.theme.field};

  display: flex;
  flex-direction: column;

  overflow: hidden;
`

export default withTheme(props => {
  const Icon_ = Icon[props.icon]

  return (
    <Container>
      <Overlay onClick={props.onClose} />

      <Content>
        <Margin bottom={12}>
          <Row>
            <Fill>
              <Row style={{ marginTop: 2 }}>
                <Margin top={1} right={8}>
                  <Icon_ color={props.theme.gray600} />
                </Margin>

                <Heading>{props.title}</Heading>
              </Row>
            </Fill>

            <Margin left={10}>
              <IconButton icon="Close" onClick={props.onClose} />
            </Margin>
          </Row>
        </Margin>

        <Margin bottom={12}>
          <Divider />
        </Margin>

        <Fill>{props.children}</Fill>
      </Content>
    </Container>
  )
})
