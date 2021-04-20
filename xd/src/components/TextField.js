import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react'

export default forwardRef((props, ref) => {
  const inputRef = useRef(null)
  useImperativeHandle(ref, () => inputRef.current)

  useEffect(() => {
    const elem = inputRef.current
    if (elem) elem.addEventListener('input', onChange)

    return () => {
      if (elem) elem.removeEventListener('input', onChange)
    }
  }, [inputRef, props.onChange])

  const onChange = e => {
    props.onChange(e.target.value)
  }

  return (
    <sp-textfield
      ref={inputRef}
      placeholder={props.placeholder}
      value={props.value}
      readOnly={props.isReadOnly}
      style={{
        padding: 0,
        margin: 0,
        width: '100%',
        maxWidth: props.maxWidth ? props.maxWidth : 'none'
      }}
    ></sp-textfield>
  )
})
