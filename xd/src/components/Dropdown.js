import React, { useRef, useEffect } from 'react'

export default React.forwardRef((props, forwardRef) => {
  const selectableOptions = props.options.filter(option => !option.isDivider)

  const lastChangeTimestamp = useRef(new Date())

  const dropdownRef = useRef(null)
  useEffect(() => {
    lastChangeTimestamp.current = new Date()

    const elem = dropdownRef.current
    if (elem) elem.addEventListener('change', onChange)

    return () => {
      if (elem) elem.removeEventListener('change', onChange)
    }
  }, [dropdownRef, forwardRef, props.onChange, props.options, props.value])

  const onChange = e => {
    const index = e.target.selectedIndex

    const option = selectableOptions[index]

    const userInitiated = new Date() - lastChangeTimestamp.current > 200

    props.onChange(option?.id, userInitiated)
  }

  const setRefs = elem => {
    dropdownRef.current = elem

    if (forwardRef) {
      forwardRef.current = elem
    }
  }

  return (
    <sp-dropdown ref={setRefs} placeholder={props.placeholder} style={{ width: '100%' }}>
      <sp-menu slot="options">
        {props.options.map(option =>
          option.isDivider ? (
            <sp-menu-divider key={option.id}></sp-menu-divider>
          ) : (
            <sp-menu-item key={option.id} selected={props.value === option.id ? true : undefined}>
              {option.name}
            </sp-menu-item>
          )
        )}
      </sp-menu>
    </sp-dropdown>
  )
})
