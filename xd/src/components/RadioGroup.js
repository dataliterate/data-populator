import React, { useRef, useEffect } from 'react'

export default props => {
  const radioGroupRef = useRef(null)
  useEffect(() => {
    const elem = radioGroupRef.current
    if (elem) elem.addEventListener('change', onChange)

    return () => {
      if (elem) elem.removeEventListener('change', onChange)
    }
  }, [radioGroupRef, props.onChange])

  const onChange = e => {
    props.onChange(e.target.value)
  }

  return (
    <sp-radio-group column ref={radioGroupRef}>
      {props.options.map(option => (
        <sp-radio
          key={option.id}
          checked={props.value === option.id ? true : undefined}
          value={option.id}
        >
          {option.name}
        </sp-radio>
      ))}
    </sp-radio-group>
  )
}
