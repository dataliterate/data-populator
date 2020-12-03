import React from 'react'
import './Button.scss'
import classNames from 'classnames'

class Button extends React.Component {
  render() {
    let buttonClass = classNames({
      button: true,
      small: this.props.small,
      blue: this.props.blue,
      disabled: this.props.disabled
    })

    return (
      <div className={buttonClass} onClick={this.props.handleClick} style={this.props.style}>
        <p>{this.props.text}</p>
      </div>
    )
  }
}

export default Button
