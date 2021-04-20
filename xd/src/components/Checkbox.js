import React, { useRef, useEffect } from 'react'

export default props => {
  const checkboxRef = useRef(null)
  useEffect(() => {
    const elem = checkboxRef.current
    if (elem) elem.addEventListener('change', onChange)

    return () => {
      if (elem) elem.removeEventListener('change', onChange)
    }
  }, [checkboxRef, props.onChange])

  const onChange = e => {
    props.onChange(e.target.checked)
  }

  return (
    <sp-checkbox
      ref={checkboxRef}
      checked={props.isChecked ? true : undefined}
      style={{ width: '100%' }}
    >
      {props.children}
    </sp-checkbox>
  )
}
