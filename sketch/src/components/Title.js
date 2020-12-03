import React from 'react'
import './Title.scss'
import classNames from 'classnames'
import ReactDOM from 'react-dom'

class Title extends React.Component {
  constructor() {
    super()

    this.state = {
      showTooltip: false,
      tooltipTop: 0,
      tooltipLeft: 0
    }

    this.showTooltip = this.showTooltip.bind(this)
    this.hideTooltip = this.hideTooltip.bind(this)
  }

  showTooltip() {
    let questionMark = ReactDOM.findDOMNode(this.refs.questionMark)
    let titleContainer = ReactDOM.findDOMNode(this.refs.titleContainer)

    this.setState({
      tooltipTop: titleContainer.offsetTop + questionMark.offsetTop - 7,
      tooltipLeft: titleContainer.offsetLeft + questionMark.offsetLeft + 16 + 5,
      showTooltip: true
    })
  }

  hideTooltip() {
    this.setState({ showTooltip: false })
  }

  render() {
    let titleContainerClass = classNames({
      'title-container': true,
      'sub-title': this.props.subTitle
    })

    let tooltipClass = classNames({
      tooltip: true,
      show: this.state.showTooltip
    })

    return (
      <div ref="titleContainer" className={titleContainerClass} style={this.props.style}>
        <h1>{this.props.title}</h1>
        {this.props.description && !this.props.subTitle ? <h2>{this.props.description}</h2> : ''}
        {this.props.description && this.props.subTitle ? (
          <div
            ref="questionMark"
            onMouseEnter={this.showTooltip}
            onMouseLeave={this.hideTooltip}
            className="question-mark"
          >
            <p>?</p>
          </div>
        ) : (
          ''
        )}
        {this.props.description && this.props.subTitle ? (
          <div
            style={{ top: this.state.tooltipTop, left: this.state.tooltipLeft }}
            className={tooltipClass}
          >
            <p>{this.props.description}</p>
          </div>
        ) : (
          ''
        )}
      </div>
    )
  }
}

export default Title
