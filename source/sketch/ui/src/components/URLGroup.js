import React from 'react'
import './URLGroup.scss'
import Strings, * as STRINGS from '../../../../core/library/strings'
import classNames from 'classnames'

import Title from '../components/Title'
import TextField from '../components/TextField'
import Button from '../components/Button'
import HeadersList from '../components/HeadersList'
import * as OPTIONS from '../../../library/options'

class URLGroup extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      headersVisible: props.headersVisible
    }

    this.toggleHeaders = this.toggleHeaders.bind(this)
  }

  toggleHeaders () {
    this.setState({
      headersVisible: !this.state.headersVisible
    }, () => {
      this.props.handleHeadersVisibilityChange(this.state.headersVisible)
    })
  }

  render () {
    let urlGroupClass = classNames({
      'url-group': true,
      'read-only-no-headers': this.props.readOnly && (this.props.headers || []).length === 0
    })

    return (
      <div className={urlGroupClass}>
        <Title subTitle style={{ display: 'inline-block', verticalAlign: 'top' }} title={Strings(STRINGS.URL)} />
        {!this.props.readOnly ? (
          <div className='show-headers-toggle' onClick={this.toggleHeaders} />
        ) : ''}
        <TextField readOnly={this.props.readOnly} style={{ marginBottom: 18 }} autoFocus name={OPTIONS.URL} placeholder={Strings(STRINGS.URL_PLACEHOLDER)} value={this.props.urlValue} handleChange={this.props.handleURLChange} />

        {((!this.props.readOnly && this.state.headersVisible) || (this.props.readOnly && (this.props.headers || []).length)) ? (
          <div>
            <Title subTitle title={Strings(STRINGS.HEADERS)} />
            <HeadersList readOnly={this.props.readOnly} headers={this.props.headers} handleHeadersChange={this.props.handleHeadersChange} handleRemoveHeaderButton={this.props.handleRemoveHeaderButton} />
            {!this.props.readOnly ? (
              <Button style={{ marginBottom: 18 }} small text={Strings(STRINGS.ADD)} handleClick={this.props.handleAddHeaderButton} />
            ) : ''}
          </div>
        ) : ''}

        {!this.props.readOnly ? (
          <Button disabled={this.props.urlValue.length === 0} style={{ width: '100%' }} blue text={Strings(STRINGS.LOAD)} handleClick={this.props.handleLoadURLButtonClick} />
        ) : ''}
      </div>
    )
  }
}

export default URLGroup
