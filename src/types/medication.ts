/**
 * Medication Document Schema
 * Matches the Firestore document structure in the medications database
 */

// Data source enum for strength values
export const STRENGTH_DATA_SOURCE = {
  RXNSAT: 'RXNSAT',
  RXNREL: 'RXNREL',
  FDA: 'FDA',
  REGEX: 'REGEX',
  UNKNOWN: 'UNKNOWN',
} as const

export type StrengthDataSource = typeof STRENGTH_DATA_SOURCE[keyof typeof STRENGTH_DATA_SOURCE]

// Reason selected enum for exemplars
export const REASON_SELECTED = {
  MIN: 'min',
  MEDIAN: 'median',
  MAX: 'max',
} as const

export type ReasonSelected = typeof REASON_SELECTED[keyof typeof REASON_SELECTED]

// Term types for medications
export const TERM_TYPE = {
  SCD: 'SCD',   // Semantic Clinical Drug
  SBD: 'SBD',   // Semantic Branded Drug
  GPCK: 'GPCK', // Generic Pack
  BPCK: 'BPCK', // Branded Pack
} as const

export type TermType = typeof TERM_TYPE[keyof typeof TERM_TYPE]

/**
 * Pricing statistics for a medication
 */
export interface PricingStats {
  min_unit_price: number
  median_unit_price: number
  max_unit_price: number
  pricing_unit: string // EA, ML, GM
  price_per_ml: number | null
  price_per_mg: number | null
  ndc_count: number
}

/**
 * Conversion values for unit calculations
 */
export interface ConversionValues {
  is_liquid: boolean
  package_size: number | null
  package_unit: string | null
  strength_val: number | null
  strength_unit: string | null
  scdc_rxcui: string | null
  data_source: StrengthDataSource
}

/**
 * NDC link information
 */
export interface NdcLinks {
  ndc11_all: string[]
  ndc11_preferred: string[]
}

/**
 * Exemplar evidence entry
 */
export interface Exemplar {
  ndc11: string
  ndc_description: string
  unit_price: number
  pricing_unit: string
  reason_selected: ReasonSelected
  nadac_per_unit: number
  package_size: number | null
  package_description: string | null
}

/**
 * Drug classification information
 */
export interface Classification {
  ingredient_name: string | null
  ingredient_rxcui: string | null
  atc_codes: string[]
}

/**
 * Dataset version tracking
 */
export interface DatasetVersions {
  nadac_week: string | null
  rxnorm_version: string | null
  fda_date: string | null
}

/**
 * Complete medication document as stored in Firestore
 */
export interface MedicationDocument {
  // Primary identifiers
  rxcui: string
  name: string
  tty: TermType | string

  // Pricing information
  pricing_stats: PricingStats

  // Conversion and strength data
  conversion_values: ConversionValues

  // NDC associations
  ndc_links: NdcLinks

  // Evidence records
  exemplars: Exemplar[]

  // Classification
  classification: Classification

  // Data versioning
  dataset_versions: DatasetVersions

  // Metadata
  created_at?: string
  updated_at?: string
}

/**
 * Helper type for filter/sort options
 */
export type SortField = 'name' | 'rxcui' | 'median_price' | 'ndc_count'
export type SortDirection = 'asc' | 'desc'

export interface FilterOptions {
  searchQuery: string
  matchedOnly: boolean
  unmatchedOnly: boolean
  liquidsOnly: boolean
  solidsOnly: boolean
  minNdcCount: number
}

export interface SortOptions {
  field: SortField
  direction: SortDirection
}

