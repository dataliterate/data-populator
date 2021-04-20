import React from 'react'
import styled from 'styled-components'

import Body from './Body'
import Loading from './Loading'

const strings = require('../strings').get('components.data')

const Container = styled.div`
  position: relative;

  width: 100%;
  height: ${props => 1 + 5 + 20 * props.lines + 5 + 1}px;

  border-radius: 4px;
  border: 1px solid ${props => props.theme.field};
  background-color: ${props => props.theme.white};

  overflow: auto;
  overflow-x: ${props => (props.canScrollHorizontally ? `auto` : `hidden`)};

  ${props =>
    props.hasClickHandler &&
    `
      &:hover {
        border: 1px solid ${props.theme.fieldHover};
      }
    `}
`

const DataContainer = styled.div`
  display: flex;
  flex-direction: row;

  padding: 5px 0;
`

const LineNumbersContainer = styled.div`
  padding-left: 10px;
`

const LineNumber = styled.div`
  font-family: Courier New;
  font-size: 12px;
  line-height: 20px;
  font-weight: 700;
  color: ${props => props.theme.gray500};
  text-align: right;
`

const CodeContainer = styled.div`
  padding: 0 10px;
`

const Code = styled.div`
  font-family: Courier New;
  font-size: 12px;
  font-weight: 700;
  line-height: 20px;

  white-space: pre-wrap;
  width: max-content;

  color: ${props => props.theme.blue600};
`

const FullData = styled.div`
  font-family: Courier New;
  font-size: 12px;
  font-weight: 700;
  line-height: 20px;
  color: ${props => props.theme.gray500};
`

const CenteredContainer = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;

  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`

export default props => {
  const hasClickHandler = !!props.onClick && props.data

  const lines = props.isPreview ? 6 : 20
  const canScrollHorizontally = !props.isPreview

  const PREVIEW_MAX_LINES = 100
  let data, dataLineCount, trimmedData, trimmedDataLineCount
  if (props.data) {
    data = JSON.stringify(props.data, null, 2)
    dataLineCount = data.split('\n').length

    if (props.isPreview)
      trimmedData =
        dataLineCount > PREVIEW_MAX_LINES
          ? data.split('\n').slice(0, PREVIEW_MAX_LINES).join('\n')
          : data
    else trimmedData = data

    trimmedDataLineCount = trimmedData.split('\n').length
  }

  const isTrimmed = trimmedDataLineCount < dataLineCount

  return (
    <Container
      lines={lines}
      canScrollHorizontally={canScrollHorizontally}
      hasClickHandler={hasClickHandler}
      onClick={hasClickHandler ? props.onClick : undefined}
    >
      {props.data ? (
        <DataContainer>
          <LineNumbersContainer>
            {[...Array(trimmedDataLineCount)].map((a, index) => (
              <LineNumber key={index + 1}>{index + 1}</LineNumber>
            ))}

            {isTrimmed && <LineNumber>...</LineNumber>}
          </LineNumbersContainer>

          <CodeContainer>
            <Code>{trimmedData}</Code>

            {isTrimmed && <FullData>{strings.expand()}</FullData>}
          </CodeContainer>
        </DataContainer>
      ) : (
        <CenteredContainer>
          {props.isLoading ? <Loading /> : <Body>No data</Body>}
        </CenteredContainer>
      )}
    </Container>
  )
}
