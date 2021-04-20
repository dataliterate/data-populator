import React, { useState, useEffect } from 'react'

import Column from './Column'

import Help from '../modals/Help'
import MissingDataSource from '../modals/MissingDataSource'

export default props => {
  const [openModal, setOpenModal] = useState(null)
  const [modalData, setModalData] = useState({})
  const [modalHandlers, setModalHandlers] = useState({})

  useEffect(() => {
    document.addEventListener('openModal', onOpenModal)

    return () => {
      document.removeEventListener('openModal', onOpenModal)
    }
  }, [])

  const onOpenModal = ({ detail: e }) => {
    setModalData(e.data)
    setOpenModal(e.id)

    const handlers = {}
    if (e.onClose) {
      handlers.onClose = e.onClose
    }
    setModalHandlers(handlers)

    disableTextFields(true)
  }

  const onCloseModal = () => {
    setOpenModal(null)
    setModalData({})

    modalHandlers.onClose && modalHandlers.onClose()

    disableTextFields(false)
  }

  const disableTextFields = value => {
    const textFieldElems = document.getElementsByTagName('sp-textfield')
    const textAreaElems = document.getElementsByTagName('sp-textarea')
    const elems = [...textFieldElems, ...textAreaElems]

    elems.forEach(elem => {
      elem.disabled = value
    })
  }

  return (
    <Column
      style={{
        position: 'absolute',
        top: 0,
        right: -12,
        bottom: 0,
        left: 0,
        overflow: 'hidden'
      }}
    >
      {openModal !== null && (
        <Column
          style={{ position: 'fixed', zIndex: 2, top: -12, right: -12, bottom: -12, left: -12 }}
        >
          {openModal === 'help' && <Help {...modalData} onClose={onCloseModal} />}
          {openModal === 'missingDataSource' && (
            <MissingDataSource {...modalData} onClose={onCloseModal} />
          )}
        </Column>
      )}

      <Column style={{ flex: 1, position: 'relative', zIndex: 1 }}>{props.children}</Column>
    </Column>
  )
}
