import React from 'react'
import styled from 'styled-components'

import Body from './Body'
import Button from './Button'
import Column from './Column'
import Fill from './Fill'
import Heading from './Heading'
import IconButton from './IconButton'
import Margin from './Margin'
import Row from './Row'

const BackArrowRow = styled.div`
  display: flex;
  flex-direction: row;

  margin-top: 3px;
  max-width: fit-content;
`

const BackArrowRowSlim = styled.div`
  display: flex;
  flex-direction: row;

  margin-top: 0px;
  max-width: fit-content;
`

export default props => (
  <Margin right={12} bottom={12}>
    <Row>
      <Fill>
        {props.hasTitle && (
          <Column>
            {/* <BackArrowRowSlim>
              <Margin top={0} right={2}>
                <IconButton
                  icon="ChevronLeft"
                  parent={IconButton}
                  onClick={props.onBackArrowClick}
                />
              </Margin>

              <Margin top={2}>
                <Heading>{props.title}</Heading>
              </Margin>
            </BackArrowRowSlim> */}

            <Heading>{props.title}</Heading>
            <Body>{props.subtitle}</Body>
          </Column>
        )}

        {props.hasBackArrow && (
          <BackArrowRow>
            <Margin top={1} right={5}>
              <IconButton icon="ChevronLeft" parent={IconButton} onClick={props.onBackArrowClick} />
            </Margin>

            <Margin top={3}>
              <Heading>{props.title}</Heading>
            </Margin>
          </BackArrowRow>
        )}
      </Fill>

      {props.hasButton && (
        <Margin left={10}>
          <Button isDisabled={props.isButtonDisabled} type="cta" onClick={props.onButtonClick}>
            {props.buttonTitle}
          </Button>
        </Margin>
      )}
    </Row>
  </Margin>
)
