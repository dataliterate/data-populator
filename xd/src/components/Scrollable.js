import React from 'react'

export default props => (
  <div
    style={{
      paddingTop: 30 - 12,
      paddingRight: 12,
      paddingBottom: 30 - 12,
      flex: 1,
      minHeight: 0,
      overflowY: 'auto',
      overflowX: 'hidden'
    }}
  >
    {props.children}
  </div>
)
