/**
 * MedicationGrid Component
 * Card or table view container for medications with pagination
 */

import { observer } from 'mobx-react-lite'
import { medicationViewerStore } from '../stores/MedicationViewerStore'
import { MedicationCard } from './MedicationCard'
import { DataSourceBadge } from './DataSourceBadge'
import { cleanMedicationName } from '../utils/formatters'

function PaginationControls() {
  const store = medicationViewerStore

  return (
    <div className="flex items-center justify-between mt-6 pt-4 border-t border-surface-200">
      <div className="text-sm text-surface-500">
        Page <span className="font-semibold text-surface-700">{store.currentPage}</span> of{' '}
        <span className="font-semibold text-surface-700">{store.totalPages}</span>
        <span className="ml-2 text-surface-400">
          ({store.totalCount.toLocaleString()} total medications)
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* First Page */}
        <button
          onClick={() => store.firstPage()}
          disabled={!store.canGoPrev || store.isLoading}
          className="p-2 rounded-lg text-surface-500 hover:bg-surface-100 hover:text-surface-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="First page"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>

        {/* Previous Page */}
        <button
          onClick={() => store.prevPage()}
          disabled={!store.canGoPrev || store.isLoading}
          className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-surface-600 hover:bg-surface-100 hover:text-surface-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Previous
        </button>

        {/* Page Number Indicator */}
        <div className="flex items-center gap-1 px-3">
          {store.currentPage > 2 && (
            <>
              <button
                onClick={() => store.loadPage(1)}
                className="w-8 h-8 rounded-lg text-sm text-surface-500 hover:bg-surface-100"
              >
                1
              </button>
              {store.currentPage > 3 && <span className="text-surface-400">...</span>}
            </>
          )}
          
          {store.currentPage > 1 && (
            <button
              onClick={() => store.prevPage()}
              className="w-8 h-8 rounded-lg text-sm text-surface-500 hover:bg-surface-100"
            >
              {store.currentPage - 1}
            </button>
          )}
          
          <span className="w-8 h-8 rounded-lg text-sm font-semibold bg-primary-500 text-white flex items-center justify-center">
            {store.currentPage}
          </span>
          
          {store.currentPage < store.totalPages && (
            <button
              onClick={() => store.nextPage()}
              className="w-8 h-8 rounded-lg text-sm text-surface-500 hover:bg-surface-100"
            >
              {store.currentPage + 1}
            </button>
          )}
          
          {store.currentPage < store.totalPages - 1 && (
            <>
              {store.currentPage < store.totalPages - 2 && <span className="text-surface-400">...</span>}
              <button
                onClick={() => store.loadPage(store.totalPages)}
                className="w-8 h-8 rounded-lg text-sm text-surface-500 hover:bg-surface-100"
              >
                {store.totalPages}
              </button>
            </>
          )}
        </div>

        {/* Next Page */}
        <button
          onClick={() => store.nextPage()}
          disabled={!store.canGoNext || store.isLoading}
          className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-surface-600 hover:bg-surface-100 hover:text-surface-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export const MedicationGrid = observer(function MedicationGrid() {
  const store = medicationViewerStore
  const medications = store.sortedMedications

  // Empty state
  if (medications.length === 0 && !store.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-surface-100 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-surface-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-surface-700 mb-1">No medications found</h3>
        <p className="text-surface-500 max-w-sm">
          {store.totalCount === 0
            ? 'No medications have been loaded yet. Click refresh to load data.'
            : 'Try adjusting your search or filter criteria.'}
        </p>
        {store.searchQuery || store.matchedOnly || store.unmatchedOnly || store.liquidsOnly || store.solidsOnly || store.minNdcCount > 0 ? (
          <button
            onClick={() => store.resetFilters()}
            className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Clear filters
          </button>
        ) : null}
      </div>
    )
  }

  // Loading state
  if (store.isLoading && medications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-primary-500 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-surface-700 mb-1">Loading medications...</h3>
        <p className="text-surface-500">Fetching page {store.currentPage}</p>
      </div>
    )
  }

  // Card View
  if (store.viewMode === 'cards') {
    return (
      <div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {medications.map((med, index) => (
            <MedicationCard key={med.rxcui} medication={med} index={index} />
          ))}
        </div>
        {store.totalPages > 1 && <PaginationControls />}
      </div>
    )
  }

  // Table View
  return (
    <div>
      <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-50 border-b border-surface-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-surface-600 uppercase tracking-wide">
                  Name
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-surface-600 uppercase tracking-wide">
                  RxCUI
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-surface-600 uppercase tracking-wide">
                  Type
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-surface-600 uppercase tracking-wide">
                  Safety
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-surface-600 uppercase tracking-wide">
                  Median Price
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-surface-600 uppercase tracking-wide">
                  Form
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-surface-600 uppercase tracking-wide">
                  NDCs
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-surface-600 uppercase tracking-wide">
                  Source
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {medications.map((med) => {
                const isUnmatched = med.rxcui.startsWith('UNMATCHED_')
                const safety = med.safety
                const hasBlackBoxWarning = safety?.has_black_box_warning ?? false
                const isControlled = safety?.is_controlled_substance ?? false
                const isPim = safety?.is_pim ?? false
                return (
                  <tr
                    key={med.rxcui}
                    onClick={() => store.openDetailModal(med)}
                    className={`
                      cursor-pointer hover:bg-surface-50 transition-colors
                      ${isUnmatched ? 'bg-warning-50/50' : ''}
                      ${hasBlackBoxWarning ? 'bg-danger-50/30' : ''}
                    `}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-surface-800 max-w-md">
                        {cleanMedicationName(med.name)}
                      </div>
                      {med.classification.ingredient_name && (
                        <div className="text-xs text-surface-400 truncate max-w-xs">
                          {med.classification.ingredient_name}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm text-surface-600">{med.rxcui}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 rounded bg-surface-100 text-surface-600">
                        {med.tty}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        {hasBlackBoxWarning && (
                          <span 
                            className="flex items-center justify-center w-6 h-6 bg-danger-100 text-danger-600 rounded"
                            title="FDA Black Box Warning"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </span>
                        )}
                        {isControlled && (
                          <span 
                            className="flex items-center justify-center w-6 h-6 bg-warning-100 text-warning-600 rounded"
                            title={`Controlled Substance ${safety?.controlled_substance_schedule ?? ''}`}
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                          </span>
                        )}
                        {isPim && (
                          <span 
                            className="flex items-center justify-center w-6 h-6 bg-purple-100 text-purple-600 rounded"
                            title="Potentially Inappropriate Medication (Beers Criteria)"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </span>
                        )}
                        {!hasBlackBoxWarning && !isControlled && !isPim && (
                          <span className="text-xs text-surface-400">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold text-primary-600">
                        ${med.pricing_stats.median_unit_price.toFixed(2)}
                      </span>
                      <span className="text-xs text-surface-400 ml-1">
                        /{med.pricing_stats.pricing_unit}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span title={med.conversion_values.is_liquid ? 'Liquid' : 'Solid'}>
                        {med.conversion_values.is_liquid ? '💧' : '💊'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm text-surface-600">
                        {med.ndc_links.ndc11_all.length}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <DataSourceBadge source={med.conversion_values.data_source} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      {store.totalPages > 1 && <PaginationControls />}
    </div>
  )
})
