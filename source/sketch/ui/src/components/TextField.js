import React from 'react'
import './TextField.scss'
import $ from 'jquery'

class TextField extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      value: props.value
    }

    this.setValue = this.setValue.bind(this)
    this.handleChange = this.handleChange.bind(this)
  }

  componentWillMount () {
    $(document).on('setTextFieldValue', this.setValue)
  }

  componentWillUnmount () {
    $(document).off('setTextFieldValue', this.setValue)
  }

  setValue (e, data) {
    if (data.name === this.props.name) {
      this.setState({
        value: data.value
      })
    }
  }

  handleChange (e) {
    if (this.props.readOnly) return

    this.setState({
      value: e.target.value
    }, () => {
      this.props.handleChange(this.props.name, this.state.value)
    })
  }

  render () {
    return (
      <div className='text-field' style={this.props.style}>
        <input autoFocus={this.props.autoFocus} style={{ width: this.props.width ? this.props.width : '100%', height: this.props.height ? this.props.height : 24, lineHeight: this.props.height ? (this.props.height - 8) + 'px' : '16px' }} readOnly={this.props.readOnly} type='text' placeholder={this.props.placeholder} value={(!this.props.readOnly) ? this.state.value : this.props.value} onChange={this.handleChange} />
      </div>
    )
  }
}

export default TextField
