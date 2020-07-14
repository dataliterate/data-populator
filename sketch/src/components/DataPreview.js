import React from 'react'
import './DataPreview.scss'
import Strings, * as STRINGS from '@data-populator/core/strings'
import classNames from 'classnames'
import ReactDOM from 'react-dom'
import $ from 'jquery'

class DataPreview extends React.Component {
  constructor() {
    super()

    this.state = {
      // needToUpdateMaxLeft: false,

      showOverlay: false,
      loading: false,
      overlayMessage: '',

      html: undefined
    }

    this.reloadDataPreview = this.reloadDataPreview.bind(this)
    this.checkWhetherToShowOverlay = this.checkWhetherToShowOverlay.bind(this)
    this.isValidURL = this.isValidURL.bind(this)
    this.getHTML = this.getHTML.bind(this)
    this.handleClick = this.handleClick.bind(this)

    this.lineNumberDigits = undefined
  }

  componentWillMount() {
    $(document).on('reloadDataPreview', this.reloadDataPreview)
    this.checkWhetherToShowOverlay()
    this.reloadDataPreview()
  }

  componentWillUnmount() {
    $(document).off('reloadDataPreview', this.reloadDataPreview)
  }

  componentDidUpdate(prevProps) {
    if (this.props !== prevProps) {
      this.checkWhetherToShowOverlay()
    }

    // if (this.state.needToUpdateMaxLeft) {
    //   setTimeout(() => {
    //     let lines = $('.line')
    //     let maxLeft = 0
    //     for (let i = 0; i < lines.length; i++) {
    //       let left = $(lines[i]).find('.end')[0].offsetLeft
    //       if (left > maxLeft) maxLeft = left
    //     }
    //
    //     console.log('maxLeft', maxLeft)
    //     this.setState({
    //       needToUpdateMaxLeft: false
    //     })
    //     $('.lines-container, .line').css({width: maxLeft + 30})
    //   })
    // }
  }

  reloadDataPreview() {
    // console.log('reloading')

    this.setState(
      {
        html: <div />
      },
      () => {
        this.setState({
          // needToUpdateMaxLeft: true,
          html: this.getHTML()
        })
      }
    )
  }

  checkWhetherToShowOverlay() {
    if (
      this.props.loading ||
      this.props.apiURLInvalid ||
      this.props.invalidData ||
      !this.props.data
    ) {
      let dataPreview = ReactDOM.findDOMNode(this.refs.dataPreview)
      if (dataPreview) dataPreview.scrollTop = 0
    }

    if (this.props.loading) {
      this.setState({
        showOverlay: true,
        loading: true,
        overlayMessage: Strings(STRINGS.LOADING_DATA)
      })
    } else if (this.props.apiURLInvalid) {
      // console.log('invalid url')
      this.setState({
        showOverlay: true,
        loading: false,
        overlayMessage: Strings(STRINGS.INVALID_URL)
      })
    } else if (this.props.invalidData) {
      // console.log('invalid data')
      this.setState({
        showOverlay: true,
        loading: false,
        overlayMessage:
          this.props.type !== 'url'
            ? Strings(STRINGS.UNABLE_TO_PREVIEW_JSON)
            : Strings(STRINGS.UNABLE_TO_LOAD_JSON_AT_URL)
      })
    } else if (!this.props.data) {
      // console.log('no data')
      this.setState({
        showOverlay: true,
        loading: false,
        overlayMessage:
          this.props.type !== 'url'
            ? Strings(STRINGS.NO_FILE_SELECTED)
            : Strings(STRINGS.NO_URL_ENTERED)
      })
    } else {
      this.setState({
        showOverlay: false
      })
    }
  }

  isValidURL(url) {
    if (
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)/g.test(
        url
      )
    ) {
      return true
    } else {
      return false
    }
  }

  getHTML() {
    if (!this.props.data) return
    // console.log('showing data')

    let data = JSON.parse(JSON.stringify(this.props.data))

    let string = JSON.stringify(data, null, '\t')
    let realLines = string.split('\n')
    let lines
    let linesSlicedTo250 = false

    let autoFoldLines = []
    if (realLines[0].trim() === '[') {
      lines = realLines

      for (let i = 1; i < lines.length; i++) {
        if (lines[i] === '\t{') {
          autoFoldLines.push([i])
        } else if (['\t}', '\t},'].indexOf(lines[i]) > -1) {
          autoFoldLines[autoFoldLines.length - 1].push(i)
        }
      }
    } else {
      lines = realLines.slice(0, 250)

      if (realLines.length > 250) {
        linesSlicedTo250 = true
      }
    }

    this.lineNumberDigits = lines.length.toString().length

    let indent = 0
    lines = lines.map((line, index) => {
      line = line.trim()
      let lineElements = {}

      let valueClass
      let foldArrow
      let key, value
      if (line.indexOf(':') > -1) {
        key = line.substring(0, line.indexOf(':')).trim()
        value = line.substring(line.indexOf(':') + 1, line.length).trim()
        lineElements.key = key
      } else {
        value = line
      }

      let hasComma = value[value.length - 1] === ','
      if (hasComma) value = value.substring(0, value.length - 1)

      if (/^"/.test(value)) {
        value = value.substring(1, value.length - 1)
        if (this.isValidURL(value, true)) {
          lineElements.fullURL = value
          valueClass = 'url'
        } else {
          valueClass = 'string'
        }
      } else {
        if (/true|false/.test(value)) {
          valueClass = 'boolean'
        } else if (/null/.test(value)) {
          valueClass = 'null'
        } else if (
          value.indexOf('{') === -1 &&
          value.indexOf('}') === -1 &&
          value.indexOf('[') === -1 &&
          value.indexOf(']') === -1
        ) {
          valueClass = 'number'
        }
      }

      let ellipsisStart, ellipsisEnd, httpStart
      if (valueClass === 'url') {
        httpStart = value.split('://')[0] + '://'
        if (value.indexOf('/') > -1 && value[value.length - 1] !== '/') {
          ellipsisStart = true
          value = '/' + value.split('/')[value.split('/').length - 1]
        }
        if (value.indexOf('?') > -1) {
          ellipsisEnd = true
          value = value.split('?')[0]
        }
      }
      if (value.length > 70) {
        ellipsisEnd = true
        value = value.substring(0, 70)
      }

      if (ellipsisStart) value = httpStart + '...' + value
      if (ellipsisEnd) value = value + '...'

      lineElements.value = value

      let currentIndent = indent
      if (['[', '{'].indexOf(lineElements.value) > -1) {
        indent++
        foldArrow = true
      }
      if (['}', '},', ']', '],'].indexOf(lineElements.value) > -1) {
        indent--
        currentIndent--
      }

      let hiddenLine = false
      let hiddenStartLine = false
      let hiddenStartLineIndex
      if (autoFoldLines.length > 1) {
        for (let i = 1; i < autoFoldLines.length; i++) {
          let start = autoFoldLines[i][0]
          let end = autoFoldLines[i][1]

          if (index >= start && index <= end) {
            if (index === start) {
              hiddenStartLine = true
            } else {
              hiddenStartLineIndex = start
              hiddenLine = true
            }
            break
          }
        }
      }

      return (
        <div
          id={`line-${index}`}
          key={`line-${index}`}
          className={`line${hiddenLine ? ` hidden hidden-${hiddenStartLineIndex}` : ''}`}
        >
          <p className="line-number" style={{ width: 12 + 8 * this.lineNumberDigits }}>
            {index + 1}
          </p>
          <div className="fold" style={{ marginRight: currentIndent * 13 }}>
            {foldArrow && !linesSlicedTo250 ? (
              <div className={`arrow${hiddenStartLine ? ' folded' : ''}`} />
            ) : (
              ''
            )}
          </div>
          {lineElements.key ? <p className="key">{lineElements.key}</p> : ''}
          {lineElements.key ? <p className="colon">:</p> : ''}

          {valueClass === 'url' || valueClass === 'string' ? (
            <p className="value-quote-start">{'"'}</p>
          ) : (
            ''
          )}
          {valueClass === 'url' || valueClass === 'string' ? (
            <p
              title={valueClass === 'url' ? lineElements.fullURL : undefined}
              className={`value ${valueClass}`}
            >
              {lineElements.value}
            </p>
          ) : (
            ''
          )}
          {valueClass === 'url' || valueClass === 'string' ? (
            <p className="value-quote-end">{'"'}</p>
          ) : (
            ''
          )}

          {valueClass !== 'url' && valueClass !== 'string' ? (
            <p className={`value ${valueClass}`}>{lineElements.value}</p>
          ) : (
            ''
          )}
          {hasComma ? <p className="comma">{','}</p> : ''}
          {hiddenStartLine ? <p className="dots" /> : ''}
          {valueClass === 'url' ? <p className="full-url">{lineElements.fullURL}</p> : ''}

          <p className="end" />
        </div>
      )
    })

    if (linesSlicedTo250) {
      for (let i = 0; i < 2; i++) {
        let endLine = (
          <div key={`endline-${i}`} className="line">
            <p className={`line-number digits-${this.lineNumberDigits}`}>.</p>
            <div className="fold" />
          </div>
        )

        lines.push(endLine)
      }
    }

    return lines
  }

  handleClick(e) {
    if (!this.props.data) return

    if (
      ['arrow', 'arrow folded'].indexOf(e.target.className) > -1 ||
      e.target.className === 'dots'
    ) {
      let data = JSON.parse(JSON.stringify(this.props.data))
      let string = JSON.stringify(data, null, '\t')
      let lines = string.split('\n')

      let arrow
      if (e.target.className.indexOf('arrow') > -1) {
        arrow = e.target
      } else if (e.target.className.indexOf('dots') > -1) {
        arrow = e.target.parentNode
          .getElementsByClassName('fold')[0]
          .getElementsByClassName('arrow')[0]
      }

      let arrowIndex = Number(arrow.parentNode.parentNode.id.split('-')[1])
      let arrowLine = lines[arrowIndex]
      let dataPreview = ReactDOM.findDOMNode(this.refs.dataPreview)
      let arrowLineElement = dataPreview.getElementsByClassName('line')[arrowIndex]

      let arrowLineIndent = 0
      for (let i = 0; i <= arrowLine.length; i++) {
        if (arrowLine[i] === '\t') arrowLineIndent++
      }

      let foldEndIndex
      for (let i = arrowIndex; i < lines.length; i++) {
        let line = lines[i]
        let lineIndent = 0
        for (let j = 0; j <= line.length; j++) {
          if (line[j] === '\t') lineIndent++
        }

        if (lineIndent === arrowLineIndent && i !== arrowIndex) {
          foldEndIndex = i
          break
        }
      }

      // let foldEndLineValue = lines[foldEndIndex].trim()
      if (arrow.className === 'arrow') {
        let dotsDiv = document.createElement('div')
        dotsDiv.className = 'dots'
        arrowLineElement.insertBefore(dotsDiv, arrowLineElement.getElementsByClassName('end')[0])

        let lineDIVs = dataPreview.getElementsByClassName('line')

        for (let i = arrowIndex + 1; i <= foldEndIndex; i++) {
          if (lineDIVs[i].className === 'line')
            lineDIVs[i].className = 'line hidden hidden-' + arrowIndex
        }

        arrow.className = 'arrow folded'
      } else {
        let arrowLineValue
        if (arrowLine.indexOf(':') > -1) {
          arrowLineValue = arrowLine.substring(arrowLine.indexOf(':') + 1, arrowLine.length).trim()
        } else {
          arrowLineValue = arrowLine.trim()
        }
        arrowLineElement.getElementsByClassName('value')[0].textContent = arrowLineValue
        arrowLineElement.getElementsByClassName('dots')[0].remove()
        // arrowLineElement.getElementsByClassName('foldEndLineValue')[0].remove()

        let lineDIVs = dataPreview.getElementsByClassName('line')
        for (let i = arrowIndex + 1; i <= foldEndIndex; i++) {
          if (lineDIVs[i].className === 'line hidden hidden-' + arrowIndex) {
            lineDIVs[i].className = 'line'
          }
        }

        arrow.className = 'arrow'
      }
    } else if (e.target.className === 'value url') {
      let elem = e.target
      let fullURL = elem.parentNode.getElementsByClassName('full-url')[0].textContent

      let thumbnailContainerDIV = document.createElement('div')
      thumbnailContainerDIV.className = 'thumbnail-container'

      let thumbnail = document.createElement('div')
      thumbnail.className = 'thumbnail'
      thumbnail.style.backgroundImage = `url(${fullURL})`

      thumbnailContainerDIV.appendChild(thumbnail)

      if (elem.parentNode.getElementsByClassName('thumbnail-container').length === 0) {
        elem.parentNode.getElementsByClassName('fold')[0].appendChild(thumbnailContainerDIV)
      }
    }
  }

  render() {
    let dataPreviewClass = classNames({
      'data-preview': true,
      'has-overlay': this.state.showOverlay
    })

    return (
      <div ref="dataPreview" className={dataPreviewClass} onClick={this.handleClick}>
        <div className="lines-container">{this.state.html}</div>

        <div className="overlay-container">
          <div className="overlay-content">
            {this.state.loading ? <div className="spinner" /> : ''}
            <p>{this.state.overlayMessage}</p>
          </div>
        </div>
      </div>
    )
  }
}

export default DataPreview
