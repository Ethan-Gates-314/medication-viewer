/**
 * SearchFilters Component
 * Search input and filter toggles for the medication list
 */

import { observer } from 'mobx-react-lite'
import { medicationViewerStore } from '../stores/MedicationViewerStore'
import type { SortField } from '../types/medication'

interface FilterToggleProps {
  label: string
  checked: boolean
  onChange: () => void
  icon?: string
}

function FilterToggle({ label, checked, onChange, icon }: FilterToggleProps) {
  return (
    <button
      onClick={onChange}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
        ${
          checked
            ? 'bg-primary-500 text-white shadow-sm'
            : 'bg-white text-surface-600 border border-surface-200 hover:border-primary-300 hover:text-primary-600'
        }
      `}
    >
      {icon && <span>{icon}</span>}
      <span>{label}</span>
      {checked && (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )}
    </button>
  )
}

export const SearchFilters = observer(function SearchFilters() {
  const store = medicationViewerStore

  const sortOptions: { value: SortField; label: string }[] = [
    { value: 'name', label: 'Name' },
    { value: 'rxcui', label: 'RxCUI' },
    { value: 'median_price', label: 'Price' },
    { value: 'ndc_count', label: 'NDC Count' },
  ]

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="w-5 h-5 text-surface-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search by name, RxCUI, or ingredient..."
          value={store.searchQuery}
          onChange={(e) => store.setSearchQuery(e.target.value)}
          className="
            w-full pl-10 pr-4 py-3 rounded-xl border border-surface-200
            bg-white text-surface-800 placeholder-surface-400
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
            transition-shadow
          "
        />
        {store.searchQuery && (
          <button
            onClick={() => store.setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-surface-400 hover:text-surface-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Filters & Sort Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Filter Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-surface-500 font-medium">Filters:</span>
          
          <FilterToggle
            label="Matched"
            checked={store.matchedOnly}
            onChange={() => store.toggleMatchedOnly()}
            icon="✓"
          />
          
          <FilterToggle
            label="Unmatched"
            checked={store.unmatchedOnly}
            onChange={() => store.toggleUnmatchedOnly()}
            icon="?"
          />
          
          <div className="w-px h-6 bg-surface-200 mx-1" />
          
          <FilterToggle
            label="Liquids"
            checked={store.liquidsOnly}
            onChange={() => store.toggleLiquidsOnly()}
            icon="💧"
          />
          
          <FilterToggle
            label="Solids"
            checked={store.solidsOnly}
            onChange={() => store.toggleSolidsOnly()}
            icon="💊"
          />
          
          <div className="w-px h-6 bg-surface-200 mx-1" />
          
          {/* Min NDC Count */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-surface-500">Min NDCs:</label>
            <input
              type="number"
              min="0"
              value={store.minNdcCount}
              onChange={(e) => store.setMinNdcCount(parseInt(e.target.value) || 0)}
              className="
                w-16 px-2 py-1 rounded-lg border border-surface-200 text-sm
                bg-white text-surface-800
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
              "
            />
          </div>

          {/* Reset Filters */}
          {(store.searchQuery ||
            store.matchedOnly ||
            store.unmatchedOnly ||
            store.liquidsOnly ||
            store.solidsOnly ||
            store.minNdcCount > 0) && (
            <button
              onClick={() => store.resetFilters()}
              className="text-sm text-primary-500 hover:text-primary-700 font-medium ml-2"
            >
              Reset all
            </button>
          )}
        </div>

        {/* Sort & View Controls */}
        <div className="flex items-center gap-4">
          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-surface-500 font-medium">Sort:</label>
            <select
              value={store.sortField}
              onChange={(e) => store.setSortField(e.target.value as SortField)}
              className="
                px-3 py-1.5 rounded-lg border border-surface-200 text-sm
                bg-white text-surface-700
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                cursor-pointer
              "
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => store.setSortField(store.sortField)}
              className="p-1.5 rounded-lg text-surface-500 hover:bg-surface-100 hover:text-surface-700 transition-colors"
              title={`Sort ${store.sortDirection === 'asc' ? 'descending' : 'ascending'}`}
            >
              {store.sortDirection === 'asc' ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-surface-100 rounded-lg p-1">
            <button
              onClick={() => store.setViewMode('cards')}
              className={`
                p-1.5 rounded-md transition-colors
                ${store.viewMode === 'cards' ? 'bg-white shadow-sm text-primary-600' : 'text-surface-500 hover:text-surface-700'}
              `}
              title="Card view"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
            </button>
            <button
              onClick={() => store.setViewMode('table')}
              className={`
                p-1.5 rounded-md transition-colors
                ${store.viewMode === 'table' ? 'bg-white shadow-sm text-primary-600' : 'text-surface-500 hover:text-surface-700'}
              `}
              title="Table view"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 10h16M4 14h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-surface-500">
        Showing{' '}
        <span className="font-medium text-surface-700">
          {store.sortedMedications.length.toLocaleString()}
        </span>{' '}
        medications on this page
        {store.totalCount > 0 && (
          <span>
            {' '}(page {store.currentPage} of {store.totalPages}, {store.totalCount.toLocaleString()} total)
          </span>
        )}
      </div>
    </div>
  )
})

