/**
 * Medication Database Viewer
 * Main application component
 */

import { useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { medicationViewerStore } from './stores/MedicationViewerStore'
import {
  Layout,
  StatsPanel,
  SearchFilters,
  MedicationGrid,
  MedicationDetailModal,
  TestPanel,
  ResolverTestPanel,
} from './components'
import './App.css'

const App = observer(function App() {
  const store = medicationViewerStore

  // Initialize app on mount
  useEffect(() => {
    store.initialize()
  }, [store])

  return (
    <Layout>
      {store.activeTab === 'database' && (
        <>
          <div className="space-y-6">
            {/* Stats Panel */}
            <StatsPanel />

            {/* Search & Filters */}
            <SearchFilters />

            {/* Medication Grid/Table */}
            <MedicationGrid />
          </div>

          {/* Detail Modal */}
          <MedicationDetailModal />
        </>
      )}
      {store.activeTab === 'tests' && <TestPanel />}
      {store.activeTab === 'resolver' && <ResolverTestPanel />}
    </Layout>
  )
})

export default App
