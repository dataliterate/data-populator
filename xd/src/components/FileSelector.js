import React, { useState } from 'react'

import Button from './Button'
import Fill from './Fill'
import Margin from './Margin'
import Row from './Row'
import TextField from './TextField'

import * as FileSystem from '../libraries/fileSystem'

const strings = require('../strings').get('components.fileSelector')

export default props => {
  const [name, setName] = useState('')

  const browse = async () => {
    const file = await FileSystem.selectFile(props.types)
    if (!file) {
      props.onChange()
      setName('')
    } else {
      props.onChange(file)
      setName(file.file.name)
    }
  }

  return (
    <Row style={{ alignItems: 'center' }}>
      <Fill>
        <TextField isReadOnly={true} placeholder={strings.selectFile()} value={name} />
      </Fill>

      <Margin left={15}>
        <Button type="primary" onClick={browse}>
          {strings.browse()}
        </Button>
      </Margin>
    </Row>
  )
}
