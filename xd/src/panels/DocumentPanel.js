import React, { useState, useEffect } from 'react'
import styled, { withTheme } from 'styled-components'
import uxp from 'uxp'

import { editDocument } from 'application'

import showDataPreviewModal from '../modals/DataPreviewModal'

import BlockDivider from '../components/BlockDivider'
import Column from '../components/Column'
import Panel from '../components/Panel'

import DataSources from '../blocks/DataSources'
import Learn from '../blocks/Learn'

import AddDataSourcePanel from './AddDataSourcePanel'
import EditDataSourcePanel from './EditDataSourcePanel'

import { showHelp } from '.'
import * as dataSourcesLib from '../libraries/dataSources'
import * as populatorLib from '../libraries/populator'
import * as optionsLib from '../libraries/options'

import analytics from '@data-populator/core/analytics'

const InnerPanelContainer = styled.div`
  display: flex;
  flex-direction: column;

  flex: 1;

  ${props => props.isHidden && `display: none;`}
`

export default withTheme(props => {
  // Data sources
  const [usedDataSources, setUsedDataSources] = useState([])
  const [documentDataSources, setDocumentDataSources] = useState([])
  const [libraryDataSources, setLibraryDataSources] = useState([])
  const [dataSources, setDataSources] = useState([])

  // Inner panels
  const [innerPanel, setInnerPanel] = useState(null)

  // Learn
  const [isLearnSectionExpanded, setIsLearnSectionExpanded] = useState(false)
  const [isViewingTutorial, setIsViewingTutorial] = useState(false)
  const [tutorialStep, setTutorialStep] = useState(1)

  const loadDataSources = async () => {
    const documentDataSources = await dataSourcesLib.getDocumentDataSources()
    const libraryDataSources = await dataSourcesLib.getLibraryDataSources()

    // Get full list of data sources
    // Document data sources take precedence over library data sources if both exist
    const allDataSources = await dataSourcesLib.getDataSources()
    const availableDataSourceIds = allDataSources.map(dataSource => dataSource.id)

    // Get layers in the whole document that use the plugin
    const layersWithADataSource = populatorLib.findChildrenWithADataSource()

    // Sort layers by data source id
    const layersByDataSourceId = {}
    layersWithADataSource.forEach(layer => {
      const dataOptions = populatorLib.getDataOptions(layer)

      if (!layersByDataSourceId[dataOptions.dataSource.id]) {
        layersByDataSourceId[dataOptions.dataSource.id] = []
      }
      layersByDataSourceId[dataOptions.dataSource.id].push(layer)
    })

    // Get stored details of all used data sources
    const usedDataSourceDetails = Object.keys(layersByDataSourceId).map(dataSourceId => {
      const layerForDataSource = layersByDataSourceId[dataSourceId][0]
      const dataSourceDetails = populatorLib.getDataOptions(layerForDataSource).dataSource

      return {
        ...dataSourceDetails,
        layers: layersByDataSourceId[dataSourceId]
      }
    })

    // Get only available data sources that are being used
    const usedDataSources = usedDataSourceDetails
      .map(dataSourceDetails => {
        if (availableDataSourceIds.includes(dataSourceDetails.id)) {
          return {
            ...allDataSources.find(dataSource => dataSource.id === dataSourceDetails.id),
            layers: dataSourceDetails.layers
          }
        } else {
          return {
            ...dataSourceDetails,
            isMissing: true
          }
        }
      })
      .sort((a, b) => (a.isMissing === b.isMissing ? 0 : a.isMissing ? -1 : 1))

    setUsedDataSources(usedDataSources)
    setDocumentDataSources(documentDataSources)
    setLibraryDataSources(libraryDataSources)
    setDataSources(allDataSources)
  }

  const openInnerPanel = (id, data) => {
    setInnerPanel({
      id,
      data
    })

    document.dispatchEvent(new CustomEvent('lockPanel'))
  }

  const closeInnerPanel = () => {
    setInnerPanel(null)

    // Reload data sources
    loadDataSources()

    document.dispatchEvent(new CustomEvent('unlockPanel'))
  }

  const showMissingDataSourceRelinkOptions = dataSource => {
    analytics.track('showMissingDataSourceRelinkOptions')

    document.dispatchEvent(
      new CustomEvent('openModal', {
        detail: {
          id: 'missingDataSource',
          data: {
            missingDataSource: dataSource,
            dataSources
          },
          onClose: () => {
            loadDataSources()
          }
        }
      })
    )
  }

  const addDataSource = () => {
    analytics.track('showAddDataSource')

    openInnerPanel('addDataSource', {})
  }

  const editDataSource = dataSource => {
    analytics.track('showEditDataSource', {
      context: 'dataSource'
    })

    openInnerPanel('editDataSource', {
      dataSource
    })
  }

  const removeDataSource = async dataSource => {
    analytics.track('deleteDataSource')

    editDocument(async () => {
      if (dataSource.origin === 'document') {
        await dataSourcesLib.removeDocumentDataSource(dataSource.id)
      } else if (dataSource.origin === 'library') {
        await dataSourcesLib.removeLibraryDataSource(dataSource.id)
      }

      loadDataSources()
    })
  }

  const addDataSourceToDocument = async dataSource => {
    analytics.track('addDataSourceToDocument')

    editDocument(async () => {
      await dataSourcesLib.addDocumentDataSource(dataSource)

      loadDataSources()
    })
  }

  const addDataSourceToLibrary = async dataSource => {
    analytics.track('addDataSourceToLibrary')

    editDocument(async () => {
      await dataSourcesLib.addLibraryDataSource(dataSource)

      loadDataSources()
    })
  }

  const updateDataSourceToLibraryVersion = async dataSource => {
    analytics.track('updateDataSourceToLibraryVersion')

    editDocument(async () => {
      const libraryVersion = await dataSourcesLib.getLibraryDataSource(dataSource.id)
      await dataSourcesLib.updateDocumentDataSource(dataSource.id, libraryVersion)

      loadDataSources()
    })
  }

  const updateDataSourceToDocumentVersion = async dataSource => {
    analytics.track('updateDataSourceToDocumentVersion')

    editDocument(async () => {
      const documentVersion = await dataSourcesLib.getDocumentDataSource(dataSource.id)
      await dataSourcesLib.updateLibraryDataSource(dataSource.id, documentVersion)

      loadDataSources()
    })
  }

  const showDataPreview = dataSource => {
    analytics.track('showFullDataPreview', {
      context: 'dataSource'
    })

    showDataPreviewModal({
      dataSource
    })
  }

  const onDataSourceAction = (dataSource, action) => {
    if (action === 'showDataPreview') {
      showDataPreview(dataSource)
    } else if (action === 'showMissingDataSourceRelinkOptions') {
      showMissingDataSourceRelinkOptions(dataSource)
    } else if (action === 'editDataSource') {
      editDataSource(dataSource)
    } else if (action === 'removeDataSource') {
      removeDataSource(dataSource)
    } else if (action === 'addDataSourceToDocument') {
      addDataSourceToDocument(dataSource)
    } else if (action === 'addDataSourceToLibrary') {
      addDataSourceToLibrary(dataSource)
    } else if (action === 'updateDataSourceToLibraryVersion') {
      updateDataSourceToLibraryVersion(dataSource)
    } else if (action === 'updateDataSourceToDocumentVersion') {
      updateDataSourceToDocumentVersion(dataSource)
    }
  }

  const toggleIsLearnSectionExpanded = async () => {
    const newExpandedState = !isLearnSectionExpanded
    setIsLearnSectionExpanded(newExpandedState)

    await optionsLib.setOptionForKey('collapseLearnSection', !newExpandedState)

    analytics.track('toggleLearnSection', {
      open: newExpandedState
    })
  }

  const onTutorialCTAButtonClick = async () => {
    analytics.track('downloadDataAndTemplates')

    uxp.shell.openExternal('https://www.datapopulator.com/data-sources')
  }

  const onTutorialNextStepClick = async () => {
    if (tutorialStep < 3) {
      analytics.track('nextTutorialStep', {
        step: tutorialStep + 1
      })

      setTutorialStep(tutorialStep + 1)
      await optionsLib.setOptionForKey('tutorialStep', tutorialStep + 1)
    }
  }

  const onTutorialPreviousStepClick = async () => {
    if (tutorialStep > 1) {
      analytics.track('previousTutorialStep', {
        step: tutorialStep - 1
      })

      setTutorialStep(tutorialStep - 1)
      await optionsLib.setOptionForKey('tutorialStep', tutorialStep - 1)
    }
  }

  const onTutorialSkipButtonClick = async () => {
    analytics.track('finishTutorial')

    setIsViewingTutorial(false)
    await optionsLib.setOptionForKey('tutorialClosed', true)
    await optionsLib.setOptionForKey('tutorialStep', undefined)
  }

  const onLearnButtonClick = async id => {
    if (id === 'tutorial') {
      analytics.track('showTutorial')

      setIsViewingTutorial(true)
      setTutorialStep(1)
      await optionsLib.setOptionForKey('tutorialClosed', false)
    } else if (id === 'learn') {
      analytics.track('learnMoreOnline')

      uxp.shell.openExternal('https://www.datapopulator.com/documentation')
    } else if (id === 'download') {
      analytics.track('downloadDataAndTemplates')

      uxp.shell.openExternal('https://www.datapopulator.com/data-sources')
    } else if (id === 'contact') {
      analytics.track('getInTouch')

      uxp.shell.openExternal('https://www.datapopulator.com/get-in-touch.html')
    }
  }

  const createDemoDataSources = async () => {
    const demoDataSourcesCreated = await optionsLib.getOptionForKey('demoDataSourcesCreated')
    if (!demoDataSourcesCreated) {
      // Create data sources
      await dataSourcesLib.addLibraryDataSource({
        id: 'demo-contacts',
        name: 'Demo Contacts',
        type: 'remote',
        url: 'https://www.datapopulator.com/data-sources/demo-contacts.json',
        headers: {}
      })

      await optionsLib.setOptionForKey('demoDataSourcesCreated', true)
      await loadDataSources()
    }
  }

  useEffect(() => {
    loadDataSources()

    // createDemoDataSources()
  }, [])

  useEffect(() => {
    void (async () => {
      const tutorialClosed = await optionsLib.getOptionForKey('tutorialClosed')
      const learnCollapsed = await optionsLib.getOptionForKey('collapseLearnSection')
      const step = await optionsLib.getOptionForKey('tutorialStep')

      setIsViewingTutorial(!tutorialClosed)
      setTutorialStep(step || 1)
      setIsLearnSectionExpanded(!learnCollapsed)
    })()
  }, [])

  return (
    <Panel>
      {innerPanel?.id === 'addDataSource' && (
        <InnerPanelContainer>
          <AddDataSourcePanel {...innerPanel?.data} goBack={closeInnerPanel} />
        </InnerPanelContainer>
      )}

      {innerPanel?.id === 'editDataSource' && (
        <InnerPanelContainer>
          <EditDataSourcePanel {...innerPanel?.data} goBack={closeInnerPanel} />
        </InnerPanelContainer>
      )}

      <InnerPanelContainer isHidden={innerPanel !== null} style={{ paddingRight: 12 }}>
        <Column style={{ marginBottom: isLearnSectionExpanded ? 20 : 5 }}>
          <Learn
            isExpanded={isLearnSectionExpanded}
            toggleIsExpanded={toggleIsLearnSectionExpanded}
            isViewingTutorial={isViewingTutorial}
            tutorialStep={tutorialStep}
            onTutorialNextStepClick={onTutorialNextStepClick}
            onTutorialPreviousStepClick={onTutorialPreviousStepClick}
            onTutorialCTAButtonClick={onTutorialCTAButtonClick}
            onTutorialSkipButtonClick={onTutorialSkipButtonClick}
            onOptionClick={onLearnButtonClick}
          />
        </Column>

        {isLearnSectionExpanded && <BlockDivider />}

        <Column style={{ flex: 1 }}>
          <Column style={{ flex: 1 }}>
            <DataSources
              onHelpClick={showHelp}
              onAddButtonClick={addDataSource}
              usedDataSources={usedDataSources}
              documentDataSources={documentDataSources}
              libraryDataSources={libraryDataSources}
              onDataSourceAction={onDataSourceAction}
            />
          </Column>
        </Column>
      </InnerPanelContainer>
    </Panel>
  )
})
