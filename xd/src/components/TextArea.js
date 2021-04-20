import React, { useRef, useEffect } from 'react'

export default props => {
  const areaRef = useRef(null)
  useEffect(() => {
    const elem = areaRef.current
    if (elem) elem.addEventListener('input', onChange)

    return () => {
      if (elem) elem.removeEventListener('input', onChange)
    }
  }, [areaRef, props.onChange])

  const onChange = e => {
    props.onChange(e.target.value)
  }

  return (
    <sp-textarea
      ref={areaRef}
      placeholder={props.placeholder}
      value={props.value}
      readOnly={props.isReadOnly}
      style={{
        padding: 0,
        margin: 0,
        width: '100%',
        height: '75px',
        maxWidth: props.maxWidth ? props.maxWidth : 'none',
        wordBreak: 'break-word'
      }}
    ></sp-textarea>
  )
}
