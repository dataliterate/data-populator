import React from 'react'

export default props => {
  const style = {
    ...(props.style ? props.style : {})
  }
  if (props.top) style.marginTop = props.top
  if (props.right) style.marginRight = props.right
  if (props.bottom) style.marginBottom = props.bottom
  if (props.left) style.marginLeft = props.left

  return <div style={style}>{props.children}</div>
}
