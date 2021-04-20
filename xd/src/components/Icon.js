import React from 'react'
import styled from 'styled-components'

import { ReactComponent as OneTwoThreeSource } from './../icons/123.svg'
import { ReactComponent as AddSource } from './../icons/Add.svg'
import { ReactComponent as BookSource } from './../icons/Book.svg'
import { ReactComponent as ChatSource } from './../icons/Chat.svg'
import { ReactComponent as ChevronDownSource } from './../icons/ChevronDown.svg'
import { ReactComponent as ChevronLeftSource } from './../icons/ChevronLeft.svg'
import { ReactComponent as ChevronRightSource } from './../icons/ChevronRight.svg'
import { ReactComponent as CloseSource } from './../icons/Close.svg'
import { ReactComponent as DownloadSource } from './../icons/Download.svg'
import { ReactComponent as EditSource } from './../icons/Edit.svg'
import { ReactComponent as ExportSource } from './../icons/Export.svg'
import { ReactComponent as HelpOutlineSource } from './../icons/HelpOutline.svg'
import { ReactComponent as ImportSource } from './../icons/Import.svg'
import { ReactComponent as LinkSource } from './../icons/Link.svg'
import { ReactComponent as RefreshSource } from './../icons/Refresh.svg'
import { ReactComponent as RemoveSource } from './../icons/Remove.svg'
import { ReactComponent as ViewDetailSource } from './../icons/ViewDetail.svg'
import { ReactComponent as ClearLayersSource } from './../icons/ClearLayers.svg'
import { ReactComponent as ClearOptionsSource } from './../icons/ClearOptions.svg'
import { ReactComponent as MoreSource } from './../icons/More.svg'

const Container = styled.div`
  width: 18px;
  height: 18px;

  svg {
    rect,
    circle,
    use,
    g,
    path {
      fill: ${props => (props.color ? props.color : props.theme.gray700)};
    }
  }

  ${props =>
    props.hoverColor &&
    `
      ${props.parent ? `${props.parent}:hover & svg, ` : ``}&:hover svg {
        rect,
        circle,
        use,
        g,
        path {
          fill: ${props.hoverColor};
        }
      }
    `}
`

const Sources = {
  OneTwoThree: OneTwoThreeSource,
  Add: AddSource,
  Book: BookSource,
  Chat: ChatSource,
  ChevronDown: ChevronDownSource,
  ChevronLeft: ChevronLeftSource,
  ChevronRight: ChevronRightSource,
  Close: CloseSource,
  Download: DownloadSource,
  Edit: EditSource,
  Export: ExportSource,
  HelpOutline: HelpOutlineSource,
  Import: ImportSource,
  Link: LinkSource,
  Refresh: RefreshSource,
  Remove: RemoveSource,
  ViewDetail: ViewDetailSource,
  ClearLayers: ClearLayersSource,
  ClearOptions: ClearOptionsSource,
  More: MoreSource
}
const Components = {}

Object.entries(Sources).forEach(entry => {
  const id = entry[0]
  const Source = entry[1]

  Components[id] = props => (
    <Container {...props}>
      <Source />
    </Container>
  )
})

export default Components
