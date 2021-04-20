import React, { useState, useRef } from 'react'

import ActionButton from '../components/ActionButton'
import Block from '../components/Block'
import BlockHeading from '../components/BlockHeading'
import Fill from '../components/Fill'
import IconButton from '../components/IconButton'
import Margin from '../components/Margin'
import Row from '../components/Row'
import TextField from '../components/TextField'
import TextArea from '../components/TextArea'
import Populated from '../components/Populated'

const strings = require('../strings').get('blocks.url')

export default props => {
  const [variables, setVariables] = useState(props.variables ? props.variables : [])
  const variablesRef = useRef(props.variables ? props.variables : [])

  const [headers, setHeaders] = useState(props.headers ? props.headers : [])
  const headersRef = useRef(props.headers ? props.headers : [])

  const addVariable = () => {
    const newVariables = [...variables, { variable: '', defaultValue: '' }]

    setVariables(newVariables)
    variablesRef.current = newVariables
    props.onVariablesChange(newVariables)

    setTimeout(() => {
      const inputElems = document
        .getElementsByClassName('variables')[0]
        .getElementsByTagName('sp-textfield')
      inputElems[inputElems.length - 1 - 1].focus()
    })
  }

  const setVariable = (index, key, value) => {
    const newVariables = [...variablesRef.current]

    const variable = newVariables[index]
    newVariables[index] = {
      ...variable,
      variable: key === 'variable' ? value : variable.variable,
      defaultValue: key === 'defaultValue' ? value : variable.defaultValue
    }

    setVariables(newVariables)
    variablesRef.current = newVariables
    props.onVariablesChange(newVariables)
  }

  const removeVariable = index => {
    const newVariables = [...variablesRef.current.filter((variable, i) => i !== index)]

    setVariables(newVariables)
    variablesRef.current = newVariables
    props.onVariablesChange(newVariables)
  }

  const addHeader = () => {
    const newHeaders = [...headers, { key: '', value: '' }]

    setHeaders(newHeaders)
    headersRef.current = newHeaders
    props.onHeadersChange(newHeaders)

    setTimeout(() => {
      const inputElems = document
        .getElementsByClassName('headers')[0]
        .getElementsByTagName('sp-textfield')
      inputElems[inputElems.length - 1 - 1].focus()
    })
  }

  const setHeader = (index, key, value) => {
    const newHeaders = [...headersRef.current]

    const header = newHeaders[index]
    newHeaders[index] = {
      key: key === 'key' ? value : header.key,
      value: key === 'value' ? value : header.value
    }

    setHeaders(newHeaders)
    headersRef.current = newHeaders
    props.onHeadersChange(newHeaders)
  }

  const removeHeader = index => {
    const newHeaders = [...headersRef.current.filter((header, i) => i !== index)]

    setHeaders(newHeaders)
    headersRef.current = newHeaders
    props.onHeadersChange(newHeaders)
  }

  return (
    <Block>
      <BlockHeading label={strings.title()} />

      <Margin bottom={20}>
        <Row style={{ alignItems: 'center' }}>
          <Fill style={{ maxWidth: '100%' }}>
            <TextArea
              placeholder={strings.enterURL()}
              value={props.url}
              onChange={props.onUrlChange}
            />

            {props.variables?.length > 0 && <Populated>{props.populatedUrl}</Populated>}
          </Fill>
        </Row>
      </Margin>

      <Margin bottom={25}>
        <BlockHeading
          label={strings.variables()}
          icon="HelpOutline"
          onIconClick={() => props.onHelpClick('urlVariables')}
        />

        <div className="variables">
          {variables.map((variable, index) => (
            <Margin key={index} bottom={10}>
              <Row style={{ alignItems: 'center' }}>
                <Fill>
                  <Margin right={10}>
                    <TextField
                      placeholder={strings.variable()}
                      value={variable.variable}
                      onChange={value => setVariable(index, 'variable', value)}
                    />
                  </Margin>
                </Fill>

                <Fill>
                  <Margin right={8}>
                    <TextField
                      placeholder={strings.defaultValue()}
                      value={variable.defaultValue}
                      onChange={value => setVariable(index, 'defaultValue', value)}
                    />
                  </Margin>
                </Fill>

                <IconButton icon="Remove" onClick={() => removeVariable(index)} />
              </Row>
            </Margin>
          ))}
        </div>

        <ActionButton isQuiet={true} icon="Add" onClick={addVariable}>
          {strings.addVariable()}
        </ActionButton>
      </Margin>

      <div>
        <BlockHeading label={strings.headers()} />

        <div className="headers">
          {headers.map((header, index) => (
            <Margin key={index} bottom={10}>
              <Row style={{ alignItems: 'center' }}>
                <Fill>
                  <Margin right={10}>
                    <TextField
                      placeholder={strings.key()}
                      value={header.key}
                      onChange={value => setHeader(index, 'key', value)}
                    />
                  </Margin>
                </Fill>

                <Fill>
                  <Margin right={8}>
                    <TextField
                      placeholder={strings.value()}
                      value={header.value}
                      onChange={value => setHeader(index, 'value', value)}
                    />
                  </Margin>
                </Fill>

                <IconButton icon="Remove" onClick={() => removeHeader(index)} />
              </Row>
            </Margin>
          ))}
        </div>

        <ActionButton isQuiet={true} icon="Add" onClick={addHeader}>
          {strings.addHeader()}
        </ActionButton>
      </div>
    </Block>
  )
}
