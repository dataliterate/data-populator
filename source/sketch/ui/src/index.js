/**
 * Index
 */

import React from 'react'
import $ from 'jquery'
import ReactDOM from 'react-dom'
import Root from './screens/Root'
import * as Utils from './library/utils'
import * as Handlers from './handlers'

// disable backspace from navigating page backwards
$(document).bind('keydown keypress', function (e) {
  let rx = /INPUT|SELECT|TEXTAREA|DIV/i
  if (e.which === 8) { // 8 == backspace
    if (!rx.test(e.target.tagName) || e.target.disabled || e.target.readOnly) {
      e.preventDefault()
    }
  }
})

// handle calls to UI from Sketch plugin
let rootRef
window.callHandler = function (handlerName, encodedData, callId) {

  try {
    if (!rootRef) rootRef = ReactDOM.render(<Root />, document.getElementById('root'))
  } catch (e) {
  }

  console.log('called handler', handlerName)

  if (Handlers[handlerName]) {
    let data = Utils.decode(encodedData)
    Handlers[handlerName](Utils.callPlugin, data, rootRef, callId)
  }
}
