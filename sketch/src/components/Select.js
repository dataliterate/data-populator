import React from 'react'
import './Select.scss'

class Select extends React.Component {
  render() {
    return (
      <div className="select">
        <div className="background" />
        <select value={this.props.selected} onChange={e => this.props.handleChange(e.target.value)}>
          {this.props.data.map((o, index) => {
            return <option key={index}>{o}</option>
          })}
        </select>
      </div>
    )
  }
}

export default Select
