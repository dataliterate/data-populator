import React from 'react'
import styled from 'styled-components'

import Divider from './Divider'

const HEIGHT = 32

const Container = styled.div`
  position: relative;
  width: 100%;

  ${props => props.hasBorder && `height: ${HEIGHT + 2}px;`}
  margin-bottom: 20px;
`

const Content = styled.div`
  position: relative;
  z-index: 2;

  ${props => (props.hasBorder ? `height: ${HEIGHT}px;` : `flex-wrap: wrap;`)}

  display: flex;
  flex-direction: row;
`

const DividerContainer = styled.div`
  position: relative;
  z-index: 1;
`

const Tab = styled.div`
  height: ${HEIGHT + 2}px;
  padding-bottom: 2px;

  ${props => props.isSelected && `padding-bottom: 0;`}
  ${props => !props.isLast && `margin-right: 24px;`}
`

const TabContent = styled.div`
  height: ${HEIGHT}px;

  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`

const TabText = styled.div`
  font-size: 14px;
  color: ${props => (props.isSelected ? props.theme.gray800 : props.theme.gray600)};

  ${Tab}:hover & {
    color: ${props => props.theme.gray800};
  }
`

export default props => (
  <Container hasBorder={props.hasBorder}>
    <Content hasBorder={props.hasBorder}>
      {props.tabs.map((tab, index) => (
        <Tab
          key={index}
          isLast={index === props.tabs.length}
          isSelected={props.selectedTabId === tab.id}
          onClick={() => props.onTabClick(tab.id)}
        >
          <TabContent>
            <TabText isSelected={props.selectedTabId === tab.id}>{tab.title}</TabText>
          </TabContent>

          {props.selectedTabId === tab.id && <Divider isDark={true} />}
        </Tab>
      ))}
    </Content>

    {props.hasBorder && (
      <DividerContainer>
        <Divider />
      </DividerContainer>
    )}
  </Container>
)
