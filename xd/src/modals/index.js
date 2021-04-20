import React from 'react'
import ReactDOM from 'react-dom'
import { ThemeProvider } from 'styled-components'

import theme from '../theme'

let dialog

export const showModal = (Modal, params) => {
  // Create dialog element
  if (dialog) {
    document.body.removeChild(dialog)
  }
  dialog = document.createElement('dialog')

  // Render modal into the dialog element
  ReactDOM.render(
    <ThemeProvider theme={theme}>
      <Modal dialog={dialog} {...params} />
    </ThemeProvider>,
    dialog
  )

  // Show modal
  document.body.appendChild(dialog)
  dialog.showModal()
}
