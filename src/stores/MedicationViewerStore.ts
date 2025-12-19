/**
 * MedicationViewerStore - MobX Store
 * Business Logic Layer - manages all medication data and UI state
 */

import { makeAutoObservable, runInAction } from 'mobx'
import { fetchMedicationsPage, fetchAllMedications, getMedicationCount, type PaginatedResult } from '../data/firestoreApi'
import { initAuth, isFirebaseConfigured } from '../data/firebase'
import { cleanMedicationName } from '../utils/formatters'
import type {
  MedicationDocument,
  FilterOptions,
  SortOptions,
  SortField,
  SortDirection,
} from '../types/medication'
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore'

const PAGE_SIZE = 100

class MedicationViewerStore {
  // Data state
  medications: MedicationDocument[] = []
  isLoading = false
  error: string | null = null
  totalCount = 0
  isAuthenticated = false
  
  // Load all state
  isLoadingAll = false
  loadingProgress = 0
  allMedicationsLoaded = false

  // Pagination state
  currentPage = 1
  pageSize = PAGE_SIZE
  lastDocuments: Map<number, QueryDocumentSnapshot<DocumentData>> = new Map()
  hasMore = true

  // Filter state
  searchQuery = ''
  matchedOnly = false
  unmatchedOnly = false
  liquidsOnly = false
  solidsOnly = false
  minNdcCount = 0

  // Sort state
  sortField: SortField = 'name'
  sortDirection: SortDirection = 'asc'

  // View state
  viewMode: 'cards' | 'table' = 'cards'
  selectedMedication: MedicationDocument | null = null
  isDetailModalOpen = false
  
  // Tab state
  activeTab: 'database' | 'tests' | 'resolver' = 'database'

  constructor() {
    makeAutoObservable(this)
  }

  // ============ COMPUTED VALUES ============

  /**
   * Current filter configuration
   */
  get filterOptions(): FilterOptions {
    return {
      searchQuery: this.searchQuery,
      matchedOnly: this.matchedOnly,
      unmatchedOnly: this.unmatchedOnly,
      liquidsOnly: this.liquidsOnly,
      solidsOnly: this.solidsOnly,
      minNdcCount: this.minNdcCount,
    }
  }

  /**
   * Current sort configuration
   */
  get sortOptions(): SortOptions {
    return {
      field: this.sortField,
      direction: this.sortDirection,
    }
  }

  /**
   * Filtered medications based on current filter state
   */
  get filteredMedications(): MedicationDocument[] {
    let result = this.medications

    // Search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase()
      result = result.filter(
        (m) =>
          cleanMedicationName(m.name).toLowerCase().includes(query) ||
          m.rxcui.toLowerCase().includes(query) ||
          m.classification.ingredient_name?.toLowerCase().includes(query)
      )
    }

    // Matched/Unmatched filter
    if (this.matchedOnly) {
      result = result.filter((m) => !m.rxcui.startsWith('UNMATCHED_'))
    }
    if (this.unmatchedOnly) {
      result = result.filter((m) => m.rxcui.startsWith('UNMATCHED_'))
    }

    // Liquid/Solid filter
    if (this.liquidsOnly) {
      result = result.filter((m) => m.conversion_values.is_liquid)
    }
    if (this.solidsOnly) {
      result = result.filter((m) => !m.conversion_values.is_liquid)
    }

    // Min NDC count filter
    if (this.minNdcCount > 0) {
      result = result.filter(
        (m) => m.ndc_links.ndc11_all.length >= this.minNdcCount
      )
    }

    return result
  }

  /**
   * Sorted medications based on current sort state
   */
  get sortedMedications(): MedicationDocument[] {
    const sorted = [...this.filteredMedications]
    const dir = this.sortDirection === 'asc' ? 1 : -1

    sorted.sort((a, b) => {
      switch (this.sortField) {
        case 'name':
          return cleanMedicationName(a.name).localeCompare(cleanMedicationName(b.name)) * dir
        case 'rxcui':
          return a.rxcui.localeCompare(b.rxcui) * dir
        case 'median_price':
          return (
            (a.pricing_stats.median_unit_price -
              b.pricing_stats.median_unit_price) *
            dir
          )
        case 'ndc_count':
          return (
            (a.ndc_links.ndc11_all.length - b.ndc_links.ndc11_all.length) * dir
          )
        default:
          return 0
      }
    })

    return sorted
  }

  /**
   * Summary statistics for the current page
   */
  get stats() {
    const list = this.medications
    const matched = list.filter((m) => !m.rxcui.startsWith('UNMATCHED_'))
    const liquids = list.filter((m) => m.conversion_values.is_liquid)

    const totalNdcs = list.reduce(
      (sum, m) => sum + m.ndc_links.ndc11_all.length,
      0
    )

    const pricesWithValue = list.filter(
      (m) => m.pricing_stats.median_unit_price > 0
    )
    const avgPrice =
      pricesWithValue.length > 0
        ? pricesWithValue.reduce(
            (sum, m) => sum + m.pricing_stats.median_unit_price,
            0
          ) / pricesWithValue.length
        : 0

    return {
      total: this.totalCount,
      pageCount: list.length,
      matched: matched.length,
      unmatched: list.length - matched.length,
      liquids: liquids.length,
      solids: list.length - liquids.length,
      totalNdcs,
      avgMedianPrice: avgPrice,
    }
  }

  /**
   * Total number of pages
   */
  get totalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize)
  }

  /**
   * Can navigate to previous page
   */
  get canGoPrev(): boolean {
    return this.currentPage > 1
  }

  /**
   * Can navigate to next page
   */
  get canGoNext(): boolean {
    return this.hasMore || this.currentPage < this.totalPages
  }

  // ============ ACTIONS ============

  /**
   * Initialize authentication and load medications
   */
  async initialize(): Promise<void> {
    if (!isFirebaseConfigured()) {
      runInAction(() => {
        this.error = 'Firebase is not configured. Please check your .env file.'
      })
      return
    }

    try {
      await initAuth()
      runInAction(() => {
        this.isAuthenticated = true
      })
      await this.loadPage(1)
    } catch (err) {
      runInAction(() => {
        this.error =
          err instanceof Error ? err.message : 'Failed to authenticate'
        this.isAuthenticated = false
      })
    }
  }

  /**
   * Load a specific page of medications
   */
  async loadPage(page: number): Promise<void> {
    if (this.isLoading) return
    if (page < 1) return

    runInAction(() => {
      this.isLoading = true
      this.error = null
    })

    try {
      // Get total count first
      const count = await getMedicationCount()
      
      // Get the cursor for the previous page (if navigating forward)
      let lastDoc: QueryDocumentSnapshot<DocumentData> | null = null
      
      if (page > 1) {
        // For pages > 1, we need to fetch from the beginning up to that page
        // or use a cached cursor
        if (this.lastDocuments.has(page - 1)) {
          lastDoc = this.lastDocuments.get(page - 1)!
        } else {
          // Need to paginate from the start to reach this page
          // This is not ideal but necessary for cursor-based pagination
          let currentDoc: QueryDocumentSnapshot<DocumentData> | null = null
          for (let i = 1; i < page; i++) {
            if (this.lastDocuments.has(i)) {
              currentDoc = this.lastDocuments.get(i)!
            } else {
              const result = await fetchMedicationsPage(this.pageSize, currentDoc)
              if (result.lastDoc) {
                this.lastDocuments.set(i, result.lastDoc)
                currentDoc = result.lastDoc
              }
            }
          }
          lastDoc = currentDoc
        }
      }

      const result: PaginatedResult = await fetchMedicationsPage(this.pageSize, lastDoc)

      runInAction(() => {
        this.medications = result.medications
        this.totalCount = count
        this.hasMore = result.hasMore
        this.currentPage = page
        if (result.lastDoc) {
          this.lastDocuments.set(page, result.lastDoc)
        }
        this.isLoading = false
      })
    } catch (err) {
      runInAction(() => {
        this.error =
          err instanceof Error ? err.message : 'Failed to load medications'
        this.isLoading = false
      })
    }
  }

  /**
   * Go to next page
   */
  async nextPage(): Promise<void> {
    if (this.canGoNext) {
      await this.loadPage(this.currentPage + 1)
    }
  }

  /**
   * Go to previous page
   */
  async prevPage(): Promise<void> {
    if (this.canGoPrev) {
      await this.loadPage(this.currentPage - 1)
    }
  }

  /**
   * Go to first page
   */
  async firstPage(): Promise<void> {
    await this.loadPage(1)
  }

  /**
   * Refresh current page
   */
  async refresh(): Promise<void> {
    this.lastDocuments.clear()
    this.allMedicationsLoaded = false
    await this.loadPage(1)
  }

  /**
   * Load all medications at once
   */
  async loadAllMedications(): Promise<void> {
    if (this.isLoadingAll || this.isLoading) return

    runInAction(() => {
      this.isLoadingAll = true
      this.loadingProgress = 0
      this.error = null
    })

    try {
      const allMeds = await fetchAllMedications((loaded, total) => {
        runInAction(() => {
          this.loadingProgress = loaded
          if (total !== null) {
            this.totalCount = total
          }
        })
      })

      runInAction(() => {
        this.medications = allMeds
        this.totalCount = allMeds.length
        this.allMedicationsLoaded = true
        this.isLoadingAll = false
        this.currentPage = 1
        this.hasMore = false
      })
    } catch (err) {
      runInAction(() => {
        this.error =
          err instanceof Error ? err.message : 'Failed to load all medications'
        this.isLoadingAll = false
      })
    }
  }

  /**
   * Set search query
   */
  setSearchQuery(query: string): void {
    this.searchQuery = query
  }

  /**
   * Toggle matched-only filter
   */
  toggleMatchedOnly(): void {
    this.matchedOnly = !this.matchedOnly
    if (this.matchedOnly) this.unmatchedOnly = false
  }

  /**
   * Toggle unmatched-only filter
   */
  toggleUnmatchedOnly(): void {
    this.unmatchedOnly = !this.unmatchedOnly
    if (this.unmatchedOnly) this.matchedOnly = false
  }

  /**
   * Toggle liquids-only filter
   */
  toggleLiquidsOnly(): void {
    this.liquidsOnly = !this.liquidsOnly
    if (this.liquidsOnly) this.solidsOnly = false
  }

  /**
   * Toggle solids-only filter
   */
  toggleSolidsOnly(): void {
    this.solidsOnly = !this.solidsOnly
    if (this.solidsOnly) this.liquidsOnly = false
  }

  /**
   * Set minimum NDC count filter
   */
  setMinNdcCount(count: number): void {
    this.minNdcCount = Math.max(0, count)
  }

  /**
   * Set sort field
   */
  setSortField(field: SortField): void {
    if (this.sortField === field) {
      // Toggle direction if same field
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc'
    } else {
      this.sortField = field
      this.sortDirection = 'asc'
    }
  }

  /**
   * Set view mode
   */
  setViewMode(mode: 'cards' | 'table'): void {
    this.viewMode = mode
  }

  /**
   * Open detail modal for a medication
   */
  openDetailModal(medication: MedicationDocument): void {
    this.selectedMedication = medication
    this.isDetailModalOpen = true
  }

  /**
   * Close detail modal
   */
  closeDetailModal(): void {
    this.isDetailModalOpen = false
    this.selectedMedication = null
  }

  /**
   * Reset all filters
   */
  resetFilters(): void {
    this.searchQuery = ''
    this.matchedOnly = false
    this.unmatchedOnly = false
    this.liquidsOnly = false
    this.solidsOnly = false
    this.minNdcCount = 0
  }

  /**
   * Clear error
   */
  clearError(): void {
    this.error = null
  }

  /**
   * Set active tab
   */
  setActiveTab(tab: 'database' | 'tests' | 'resolver'): void {
    this.activeTab = tab
  }
}

// Singleton instance
export const medicationViewerStore = new MedicationViewerStore()
