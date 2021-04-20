import React from 'react'
import styled, { withTheme } from 'styled-components'

import Body from './Body'
import Button from './Button'
import TextButton from './TextButton'
import IconButton from './IconButton'

const strings = require('../strings').get('components.tutorialStep')

const Container = styled.div`
  width: 100%;
`

const ImageContainer = styled.div`
  width: 100%;

  display: flex;
  flex-direction: row;
  justify-content: center;

  margin-bottom: 15px;
`

const Img = styled.div`
  width: 100%;
  max-width: 260px;

  background-image: url(${props => props.src});
  max-height: 175px;
  padding-top: 67%;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  margin: 0 10px;
`

const StepsContainer = styled.div`
  width: 100%;

  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;

  margin-bottom: 10px;
`

const StepContainer = styled.div`
  width: ${props => (props.isSelected ? 16 : 6)}px;
  height: ${props => (props.isSelected ? 16 : 6)}px;
  border-radius: 50%;

  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;

  background-color: ${props => (props.isSelected ? props.theme.blue600 : props.theme.gray500)};

  ${props => !props.isLast && `margin-right: 10px;`};
`

const StepText = styled.div`
  font-size: 10px;
  font-weight: 500;
  width: 16px;
  height: 16px;
  line-height: 16px;
  text-align: center;

  color: ${props => (props.isSelected ? props.theme.white : props.theme.gray500)};
`

const BodyContainer = styled.div`
  margin-bottom: 12px;
  text-align: center;
`

const ButtonContainer = styled.div`
  width: 100%;

  display: flex;
  flex-direction: row;
  justify-content: center;

  margin-bottom: 10px;
`

const TextButtonContainer = styled.div`
  width: 100%;

  display: flex;
  flex-direction: row;
  justify-content: center;
`

const ImageContainerWrapper = styled.div`
  width: 100%;

  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
`

const ArrowButtonContainer = styled.div`
  ${props =>
    props.hide &&
    `
    opacity: 0;  
    `}
`

export default withTheme(props => {
  return (
    <Container>
      <ImageContainerWrapper>
        <ArrowButtonContainer hide={props.step === 1}>
          <IconButton icon={'ChevronLeft'} onClick={props.onPreviousStepClick} />
        </ArrowButtonContainer>
        <ImageContainer step={props.step}>
          <Img src={props.imageSrc} heightRatio={props.imageHeightRatio} />
        </ImageContainer>
        <ArrowButtonContainer hide={props.step === 3}>
          <IconButton icon={'ChevronRight'} onClick={props.onNextStepClick} />
        </ArrowButtonContainer>
      </ImageContainerWrapper>

      <StepsContainer>
        {[...Array(3)].map((a, index) => (
          <StepContainer key={index + 1} isSelected={props.step === index + 1} isLast={index === 2}>
            {index + 1 === props.step && (
              <StepText isSelected={props.step === index + 1}>{index + 1}</StepText>
            )}
          </StepContainer>
        ))}
      </StepsContainer>

      <BodyContainer>
        <Body size="S" color={props.theme.gray800}>
          {props.instructions}
        </Body>
      </BodyContainer>

      <ButtonContainer>
        <Button type="cta" onClick={props.onCTAButtonClick}>
          {props.CTAButtonTitle}
        </Button>
      </ButtonContainer>

      <TextButtonContainer>
        <TextButton onClick={props.onSkipButtonClick}>{strings.skip()}</TextButton>
      </TextButtonContainer>
    </Container>
  )
})
