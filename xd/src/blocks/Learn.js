import React from 'react'

import Body from '../components/Body'
import Column from '../components/Column'
import Fill from '../components/Fill'
import Heading from '../components/Heading'
import IconButton from '../components/IconButton'
import LearnButton from '../components/LearnButton'
import Margin from '../components/Margin'
import Row from '../components/Row'
import TutorialStep from '../components/TutorialStep'

import step1 from '../images/learn/step1.png'
import step2 from '../images/learn/step2.png'
import step3 from '../images/learn/step3.png'

const strings = require('../strings').get('blocks.learn')

export default props => {
  // Tutorial
  const imageSrcs = {
    1: step1,
    2: step2,
    3: step3
  }

  const imageHeightRatios = {
    1: 67, //35
    2: 67,
    3: 67
  }

  const instructions = {
    1: strings.tutorial['one'].instructions(),
    2: strings.tutorial['two'].instructions(),
    3: strings.tutorial['three'].instructions()
  }

  // Options
  const options = [
    { id: 'tutorial', icon: 'OneTwoThree', title: strings.options.tutorial() },
    { id: 'download', icon: 'Download', title: strings.options.download() },
    { id: 'learn', icon: 'Book', title: strings.options.learn() },
    { id: 'contact', icon: 'Chat', title: strings.options.contact() }
  ]

  return (
    <Column>
      <Margin bottom={props.isExpanded ? 20 : 0}>
        <Row>
          <Fill>
            <Heading onClick={props.toggleIsExpanded}>{strings.title()}</Heading>
            {props.isExpanded && <Body>{strings.subtitle()}</Body>}
          </Fill>

          <Margin left={10}>
            <IconButton
              icon={props.isExpanded ? 'ChevronDown' : 'ChevronRight'}
              onClick={props.toggleIsExpanded}
            />
          </Margin>
        </Row>
      </Margin>

      {props.isExpanded &&
        (props.isViewingTutorial ? (
          <TutorialStep
            imageSrc={imageSrcs[props.tutorialStep]}
            imageHeightRatio={imageHeightRatios[props.tutorialStep]}
            step={props.tutorialStep}
            instructions={instructions[props.tutorialStep]}
            CTAButtonTitle={strings.tutorial.buttonTitle()}
            onNextStepClick={props.onTutorialNextStepClick}
            onPreviousStepClick={props.onTutorialPreviousStepClick}
            onCTAButtonClick={props.onTutorialCTAButtonClick}
            onSkipButtonClick={props.onTutorialSkipButtonClick}
          />
        ) : (
          <Column>
            {options.map((option, index) => (
              <Margin key={option.id} bottom={index === options.length - 1 ? 0 : 10}>
                <LearnButton icon={option.icon} onClick={() => props.onOptionClick(option.id)}>
                  {option.title}
                </LearnButton>
              </Margin>
            ))}
          </Column>
        ))}
    </Column>
  )
}
