import React from 'react'
import Strings, * as STRINGS from '@data-populator/core/strings'
import './LayoutOptionsTextFieldBlock.scss'
import * as OPTIONS from '../library/options'

import TextField from './TextField'

class LayoutOptionsTextFieldBlock extends React.Component {
  render() {
    return (
      <div className="layout-options-text-field-block">
        <div className="column">
          <p>{Strings(STRINGS.ROWS)}</p>
          <p>{Strings(STRINGS.COLUMNS)}</p>
        </div>
        <div className="column">
          <TextField
            height={22}
            style={{ display: 'block', width: 60, height: 22, marginBottom: 4 }}
            readOnly={this.props.readOnly}
            name={OPTIONS.ROWS_COUNT}
            value={this.props.rows}
            handleChange={this.props.handleTextFieldChange}
          />
          <TextField
            height={22}
            style={{ display: 'block', width: 60, height: 22, marginBottom: 0 }}
            readOnly={this.props.readOnly}
            name={OPTIONS.COLUMNS_COUNT}
            value={this.props.columns}
            handleChange={this.props.handleTextFieldChange}
          />
        </div>
        <div className="column">
          <p>{Strings(STRINGS.MARGIN)}</p>
          <p>{Strings(STRINGS.MARGIN)}</p>
        </div>
        <div className="column">
          <TextField
            height={22}
            style={{ display: 'block', width: 60, height: 22, marginBottom: 4 }}
            readOnly={this.props.readOnly}
            name={OPTIONS.ROWS_MARGIN}
            value={this.props.rowsMargin}
            handleChange={this.props.handleTextFieldChange}
          />
          <TextField
            height={22}
            style={{ display: 'block', width: 60, height: 22, marginBottom: 0 }}
            readOnly={this.props.readOnly}
            name={OPTIONS.COLUMNS_MARGIN}
            value={this.props.columnsMargin}
            handleChange={this.props.handleTextFieldChange}
          />
        </div>
      </div>
    )
  }
}

export default LayoutOptionsTextFieldBlock
