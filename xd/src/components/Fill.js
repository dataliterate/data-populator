import React from 'react'

export default props => (
  <div
    style={{
      flex: 1,
      ...(props.style ? props.style : {})
    }}
  >
    {props.children}
  </div>
)
