import React from 'react'

export default props => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      ...(props.style ? props.style : {})
    }}
  >
    {props.children}
  </div>
)
