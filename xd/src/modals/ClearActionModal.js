import React, { useState } from 'react'
import styled, { withTheme } from 'styled-components'

import { showModal } from './index'

import Body from '../components/Body'
import Button from '../components/Button'
import Checkbox from '../components/Checkbox'
import Fill from '../components/Fill'
import Heading from '../components/Heading'
import Margin from '../components/Margin'
import Row from '../components/Row'

const strings = require('../strings').get('modals.clearAction')

const Container = styled.div`
  width: ${420 - 34 - 34}px;
  padding: ${40 - 34}px;
`

const ClearActionModal = withTheme(props => {
  const [applyToChildren, setApplyToChildren] = useState(false)

  const cancel = () => {
    props.dialog.close()
  }

  const clear = async () => {
    if (props.onClear)
      await props.onClear({
        clearPopulatedData: props.type === 'populatedData',
        clearOptions: props.type === 'options',
        applyToChildren
      })
    props.dialog.close()
  }

  const typeStrings = strings[props.type]

  return (
    <Container>
      <Margin bottom={25}>
        <Row>
          <Fill>
            <Heading>{typeStrings.title()}</Heading>

            <Margin top={10}>
              <Body size={'S'} color={props.theme.gray800}>
                {typeStrings.info()}
              </Body>
            </Margin>
          </Fill>
        </Row>
      </Margin>

      {props.canClearChildren && (
        <Margin bottom={15}>
          <Checkbox isChecked={applyToChildren} onChange={setApplyToChildren}>
            {strings.applyToChildren()}
          </Checkbox>
        </Margin>
      )}

      <Row style={{ alignItems: 'center' }}>
        <Fill />

        <Button type={'secondary'} isQuiet={true} onClick={cancel}>
          {strings.cancel()}
        </Button>

        <Margin left={10}>
          <Button type="warning" onClick={clear}>
            {strings.clear()}
          </Button>
        </Margin>
      </Row>
    </Container>
  )
})

export default params => {
  showModal(ClearActionModal, params)
}
