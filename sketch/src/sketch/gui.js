/**
 * Gui
 *
 * Provides functionality to create various user interface components.
 */

import Context from './context'
import MochaJSDelegate from 'mocha-js-delegate'
import * as Handlers from './handlers'
import * as Utils from './utils'

// only exists when a window is currently shown
let pendingWindowResolve = null
let callResolves = {}

export async function showWindow(data) {
  await setupWindow()
  return new Promise((resolve, reject) => {
    // do not open again if a window resolve is pending
    if (pendingWindowResolve) {
      return
    }

    // get thread dictionary
    let threadDictionary = NSThread.mainThread().threadDictionary()

    // nothing to show if the window doesn't exist
    let webView = threadDictionary['com.datapopulator.sketch.ui.web']
    if (!webView) return

    // store reference to resolve handler to call it later when window closes
    pendingWindowResolve = resolve

    // ask window to be shown with given data
    let windowObject = webView.windowScriptObject()
    let encodedData = Utils.encode(data)
    windowObject.evaluateWebScript(`window.callHandler('show', '${encodedData}')`)

    // NSApp.beginSheet_modalForWindow_modalDelegate_didEndSelector_contextInfo(threadDictionary['com.datapopulator.sketch.ui.window'], Context().document.window(), null, null, null)
  })
}

export function hideWindow(data) {
  let threadDictionary = NSThread.mainThread().threadDictionary()
  let webWindow = threadDictionary['com.datapopulator.sketch.ui.window']
  if (!webWindow) return

  NSApp.endSheet(webWindow)
  webWindow.orderOut(null)

  if (pendingWindowResolve) {
    pendingWindowResolve(data)
    pendingWindowResolve = null
  }

  destroyWindow()
}

export async function call(uiHandler, data) {
  await setupWindow()
  return new Promise(resolve => {
    // get thread dictionary
    let threadDictionary = NSThread.mainThread().threadDictionary()

    // nothing to show if the window doesn't exist
    let webView = threadDictionary['com.datapopulator.sketch.ui.web']
    if (!webView) return

    let callId = Utils.encode(`${uiHandler}${Date.now()}`)
    callResolves[callId] = resolve

    // ask window to be shown with given data
    let windowObject = webView.windowScriptObject()
    let encodedData = Utils.encode(data)
    windowObject.evaluateWebScript(
      `window.callHandler('${uiHandler}', '${encodedData}', '${callId}')`
    )
  })
}

export function setupWindow() {
  coscript.setShouldKeepAround(true)

  return new Promise((resolve, reject) => {
    // get thread dictionary
    let threadDictionary = NSThread.mainThread().threadDictionary()

    // ignore creating new window if already exists
    if (threadDictionary['com.datapopulator.sketch.ui.window']) return resolve()

    // create window
    let windowWidth = 868
    let windowHeight = 680 + 22
    let webWindow = NSWindow.alloc().init()
    webWindow.setFrame_display(NSMakeRect(0, 0, windowWidth, windowHeight), true)

    // keep reference to the window
    threadDictionary['com.datapopulator.sketch.ui.window'] = webWindow

    // create web view
    let webView = WebView.alloc().initWithFrame(NSMakeRect(0, -22, windowWidth, windowHeight))
    threadDictionary['com.datapopulator.sketch.ui.web'] = webView
    webWindow.contentView().addSubview(webView)

    // listen for webview delegate method calls
    let webViewDelegate = new MochaJSDelegate({
      'webView:didFinishLoadForFrame:': function (webView, webFrame) {
        resolve()
      },

      'webView:didChangeLocationWithinPageForFrame:': function (webView, webFrame) {
        // get data from hash
        let windowObject = webView.windowScriptObject()
        let encodedResponse = windowObject.evaluateWebScript('window.location.hash').substring(1)

        // reset hash to 'waiting' to enable further communication
        if (encodedResponse === 'waiting') return
        windowObject.evaluateWebScript('window.location.hash="waiting"')

        // get response from UI
        let response = Utils.decode(encodedResponse)

        // shows window
        if (response.handler === 'ready') {
          NSApp.beginSheet_modalForWindow_modalDelegate_didEndSelector_contextInfo(
            webWindow,
            Context().document.window(),
            null,
            null,
            null
          )
        }

        // just hide window
        else if (response.handler === 'cancel') {
          hideWindow()
        }

        // confirmation
        // hides window and returns response
        else if (response.handler === 'confirm') {
          hideWindow(response.data)
        }

        // ui handler call response
        else if (response.handler === 'resolveCall') {
          let callResolve = callResolves[response.callId]

          if (callResolve) {
            callResolve(response.data)
            delete callResolves[response.callId]
            destroyWindow()
          }
        }

        // forward to handlers
        else {
          let handler = Handlers[response.handler]
          if (handler) {
            handler((uiHandler, data) => {
              try {
                let encodedData = Utils.encode(data)
                windowObject.evaluateWebScript(
                  `window.callHandler('${uiHandler}', '${encodedData}')`
                )
              } catch (e) {
                console.log(e)
              }
            }, response.data)
          }
        }
      }
    })

    // load web UI
    webView.setFrameLoadDelegate_(webViewDelegate.getClassInstance())
    const url =
      process.env.NODE_ENV === 'production'
        ? Context().plugin.urlForResourceNamed('index.html').path()
        : 'http://localhost:4444'
    webView.setMainFrameURL_(url)
  })
}

export function destroyWindow() {
  // get thread dictionary
  let threadDictionary = NSThread.mainThread().threadDictionary()

  // end async session
  threadDictionary['com.datapopulator.sketch.ui.window'] = null
  threadDictionary['com.datapopulator.sketch.ui.web'] = null
  coscript.setShouldKeepAround(false)
}
