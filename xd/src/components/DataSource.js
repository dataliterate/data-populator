import React, { useState, useRef, useEffect } from 'react'
import styled, { withTheme } from 'styled-components'

import Body from './Body'
import IconButton from './IconButton'
import Margin from './Margin'
import Row from './Row'
import Type from './Type'

import Dropdown from './Dropdown'

const strings = require('../strings').get('components.dataSource')

const Wrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
`

const Container = styled.div`
  background-color: ${props =>
    !props.isOnWhiteBackground ? props.theme.white : props.theme.background};
  border-radius: 4px;

  display: flex;
  flex-direction: row;
  align-items: center;

  padding-right: ${(32 - 24) / 2}px;
`

const ContentContainer = styled.div`
  padding: 6px 8px;

  min-height: 34px;

  flex: 1;

  display: flex;
  flex-direction: column;
  justify-content: center;
`

const Name = styled.div`
  font-size: 14px;
  color: ${props => props.theme.gray800};
  line-height: 18px;

  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;

  ${props => props.hoverParent}:hover && {
    color: ${props => (props.hasClickHandler ? props.theme.black : props.theme.gray800)};
  }
`

const IconButtonContainer = styled.div`
  margin-left: 2px;

  width: 24px;
  height: 24px;

  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`

const MenuContainer = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  max-width: 100%;
  height: 0;
  overflow: hidden;

  width: ${props => props.width}px;
`

export default withTheme(props => {
  // Workaround - used to rerender dropdown and deselect last selected item
  const [actionMenuEnabled, setActionMenuEnabled] = useState(true)
  const [menuWidth, setMenuWidth] = useState(0)
  const dropdownRef = useRef(null)

  const onMenuItemClick = (optionId, userInitiated) => {
    if (!userInitiated) return

    setActionMenuEnabled(false)
    onAction(optionId)

    setTimeout(() => {
      setActionMenuEnabled(true)
    })
  }

  const onAction = action => {
    props.onAction && props.onAction(action)
  }

  const updateMenuWidth = () => {
    // Find longest option
    let longestOption = ''
    if (props.menuActions) {
      for (let option of props.menuActions) {
        if (option.name.length > longestOption.length) {
          longestOption = option.name
        }
      }
    }

    if (longestOption.length) {
      // Create temp text elem
      const tempText = document.createElement('div')
      tempText.innerHTML = longestOption
      tempText.style.display = 'inline-block'
      tempText.style.fontSize = '12px'
      tempText.style.opacity = 0
      document.getElementById('root').appendChild(tempText)

      // Leave time to render temp elem
      const checkWidthInterval = setInterval(() => {
        const tempTextWidth = tempText.clientWidth
        if (!tempTextWidth) return

        clearInterval(checkWidthInterval)

        setMenuWidth(tempTextWidth + 60)

        // Remove temp elem
        document.getElementById('root').removeChild(tempText)
      }, 50)
    } else {
      setMenuWidth(0)
    }
  }

  const hasLayerCount = props.layerCount !== undefined

  useEffect(() => {
    updateMenuWidth()
  }, [props.menuActions])

  return (
    <Wrapper>
      {props.menuActions && actionMenuEnabled && (
        <MenuContainer width={menuWidth}>
          <Dropdown ref={dropdownRef} options={props.menuActions} onChange={onMenuItemClick} />
        </MenuContainer>
      )}

      <Container isOnWhiteBackground={props.isOnWhiteBackground}>
        <ContentContainer hasLayerCount={hasLayerCount} onClick={props.onClick}>
          <Row style={{ width: '100%', minWidth: 0, alignItems: 'center', overflow: 'hidden' }}>
            <Name hoverParent={ContentContainer} hasClickHandler={!!props.onClick}>
              {props.name}
            </Name>

            <Margin left={8}>
              <Type type={props.type} />
            </Margin>
          </Row>

          <Row>
            {props.info && (
              <Margin right={8}>
                <Body>{props.info}</Body>
              </Margin>
            )}

            {props.warning && (
              <Margin right={8}>
                <Body fontWeight={500} color={props.theme.orange500}>
                  {props.warning}
                </Body>
              </Margin>
            )}

            {props.error && (
              <Margin right={8}>
                <Body fontWeight={500} color={props.theme.red700}>
                  {props.error}
                </Body>
              </Margin>
            )}

            {hasLayerCount && (
              <Body>
                {strings.layerCount({ count: props.layerCount, plural: props.layerCount !== 1 })}
              </Body>
            )}
          </Row>
        </ContentContainer>

        {props.menuActions?.length > 0 && (
          <IconButtonContainer>
            <IconButton
              icon="More"
              color={props.theme.gray500}
              hoverColor={props.theme.gray700}
              onClick={() => dropdownRef.current.click()}
            />
          </IconButtonContainer>
        )}
      </Container>
    </Wrapper>
  )
})
