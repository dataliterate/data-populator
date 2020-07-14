import React from 'react'
import './HeadersList.scss'
import Strings, * as STRINGS from '@data-populator/core/strings'
import $ from 'jquery'
import ReactDOM from 'react-dom'

import TextField from './TextField'
import Button from './Button'

class HeadersList extends React.Component {
  constructor(props) {
    super(props)

    this.initialHeaders = [].concat(props.headers)

    this.headersEqualToInitialHeaders = this.headersEqualToInitialHeaders.bind(this)
    this.scrollToBottom = this.scrollToBottom.bind(this)
  }

  componentWillMount() {
    $(document).on('scrollHeadersListToBottom', this.scrollToBottom)
  }

  componentWillUnmount() {
    $(document).off('scrollHeadersListToBottom', this.scrollToBottom)
  }

  componentDidUpdate() {}

  headersEqualToInitialHeaders() {
    let same = true
    let length = Math.max(this.initialHeaders.length, (this.props.headers || []).length)

    for (let i = 0; i < length; i++) {
      if (this.initialHeaders[i] && this.props.headers[i]) {
        if (this.initialHeaders[i].name !== this.props.headers[i].name) same = false
        if (this.initialHeaders[i].value !== this.props.headers[i].value) same = false
      } else {
        same = false
      }
    }

    return same
  }

  scrollToBottom() {
    let headersList = ReactDOM.findDOMNode(this.refs.headersList)
    headersList.scrollTop = headersList.scrollHeight
  }

  render() {
    return (
      <div
        ref="headersList"
        className="headers-list"
        style={{
          marginBottom: (this.props.headers || []).length > 0 && !this.props.readOnly ? 6 : 0
        }}
      >
        {this.props.headers.map((header, index) => {
          return (
            <div className="header" key={index}>
              <TextField
                readOnly={this.props.readOnly}
                autoFocus={
                  index === this.props.headers.length - 1 && !this.headersEqualToInitialHeaders()
                }
                style={{
                  width: !this.props.readOnly ? 'calc(50% - 30px - 4px)' : 'calc(50% - 2px)',
                  marginRight: 4,
                  marginBottom: index === this.props.headers.length - 1 ? 0 : 4
                }}
                name={`${index}/name`}
                placeholder={Strings(STRINGS.NAME)}
                value={this.props.headers[index]['name']}
                handleChange={this.props.handleHeadersChange}
              />
              <TextField
                readOnly={this.props.readOnly}
                style={{
                  width: !this.props.readOnly ? 'calc(50% - 30px - 5px)' : 'calc(50% - 2px)',
                  marginRight: !this.props.readOnly ? 5 : 0,
                  marginBottom: index === this.props.headers.length - 1 ? 0 : 4
                }}
                name={`${index}/value`}
                placeholder={Strings(STRINGS.VALUE)}
                value={this.props.headers[index]['value']}
                handleChange={this.props.handleHeadersChange}
              />
              {!this.props.readOnly ? (
                <Button
                  style={{ paddingLeft: 0, paddingRight: 0, width: 60, marginTop: 2 }}
                  small
                  text={Strings(STRINGS.REMOVE)}
                  handleClick={() => this.props.handleRemoveHeaderButton(index)}
                />
              ) : (
                ''
              )}
            </div>
          )
        })}
      </div>
    )
  }
}

export default HeadersList
