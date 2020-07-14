import React from 'react'
import './FileBrowseField.scss'
import Strings, * as STRINGS from '@data-populator/core/strings'
import ReactDOM from 'react-dom'
import $ from 'jquery'

import Button from './Button'

class FileBrowseField extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      filePath: ''
    }

    this.setPath = this.setPath.bind(this)
    this.handleBrowseButtonClick = this.handleBrowseButtonClick.bind(this)
    this.handleFileChange = this.handleFileChange.bind(this)
  }

  componentWillMount() {
    $(document).on('setJSONFilePath', this.setPath)
  }

  componentWillUnmount() {
    $(document).off('setJSONFilePath', this.setPath)
  }

  setPath(e, data) {
    this.setState({
      filePath: data.path
    })
  }

  handleBrowseButtonClick(e) {
    this.props.onClick()
  }

  handleFileChange(e) {
    let file = e.target.files[0]
    if (!file) return
    this.setState({
      file
    })

    this.props.handleChange(file)
  }

  render() {
    return (
      <div className="file-browse-field">
        <input
          style={{ width: !this.props.readOnly ? 201 : '100%' }}
          readOnly
          type="text"
          value={this.state.filePath ? this.state.filePath : ''}
        />
        {/* <input ref='fileInput' type='file' onChange={this.handleFileChange} accept={this.props.accept} /> */}
        {!this.props.readOnly ? (
          <Button
            text={Strings(STRINGS.BROWSE)}
            style={{ width: 72, marginLeft: 12 }}
            handleClick={this.handleBrowseButtonClick}
          />
        ) : (
          ''
        )}
      </div>
    )
  }
}

export default FileBrowseField
