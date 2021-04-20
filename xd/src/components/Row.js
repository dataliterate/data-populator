import React from 'react'

export default props => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'row',
      ...(props.style ? props.style : {})
    }}
  >
    {props.children}
  </div>
)
