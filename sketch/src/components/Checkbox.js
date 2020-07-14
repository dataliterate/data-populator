import React from 'react'
import './Checkbox.scss'
import classNames from 'classnames'
import $ from 'jquery'

class Checkbox extends React.Component {
  constructor(props) {
    super()

    this.state = {
      checked: props.checked
    }

    this.handleClick = this.handleClick.bind(this)
    this.setValue = this.setValue.bind(this)
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      checked: nextProps.checked
    })
  }

  componentWillMount() {
    $(document).on('setCheckboxValue', this.setValue)
  }

  componentWillUnmount() {
    $(document).off('setCheckboxValue', this.setValue)
  }

  setValue(e, data) {
    if (data.name === this.props.name) {
      this.setState({
        checked: data.value
      })
    }
  }

  handleClick() {
    if (this.props.readOnly) return

    this.setState(
      {
        checked: !this.state.checked
      },
      () => {
        this.props.handleChange(this.props.name, this.state.checked)
      }
    )
  }

  render() {
    let checkboxClass = classNames({
      checkbox: true,
      'margin-bottom': this.props.marginBottom
    })

    return (
      <div className={checkboxClass} onClick={this.handleClick} style={this.props.style}>
        <input
          readOnly={this.props.readOnly}
          type="checkbox"
          checked={this.state.checked}
          onChange={() => {}}
        />
        <p>{this.props.label}</p>
      </div>
    )
  }
}

export default Checkbox
