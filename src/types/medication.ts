/**
 * Medication Document Schema
 * Matches the Firestore document structure in the medications database.
 * 
 * This module defines the complete TypeScript interfaces for medication data
 * returned from the Firestore API. The schema is based on data aggregated from:
 * - **RxNorm**: Drug naming and identification (rxcui, name, tty)
 * - **NADAC**: National Average Drug Acquisition Cost (pricing)
 * - **FDA NDC Directory**: Package sizes and NDC codes
 * 
 * @module types/medication
 * @see https://www.nlm.nih.gov/research/umls/rxnorm/overview.html
 * @see https://data.medicaid.gov/nadac
 */

// ============================================================
// ENUMS AND CONSTANTS
// ============================================================

/**
 * Data source indicating where strength/conversion values were extracted from.
 * 
 * | Value     | Description                                    | Reliability |
 * |-----------|------------------------------------------------|-------------|
 * | `RXNSAT`  | RxNorm Semantic Attributes table               | High        |
 * | `RXNREL`  | RxNorm Relationships table (derived)           | Medium-High |
 * | `FDA`     | FDA NDC Directory structured product labeling  | High        |
 * | `REGEX`   | Parsed from drug name using regex patterns     | Medium      |
 * | `UNKNOWN` | Could not determine data source                | Low         |
 */
export const STRENGTH_DATA_SOURCE = {
  RXNSAT: 'RXNSAT',
  RXNREL: 'RXNREL',
  FDA: 'FDA',
  REGEX: 'REGEX',
  UNKNOWN: 'UNKNOWN',
} as const

export type StrengthDataSource = typeof STRENGTH_DATA_SOURCE[keyof typeof STRENGTH_DATA_SOURCE]

/**
 * Reason why an exemplar NDC was selected for the medication.
 * 
 * Exemplars are representative NDCs chosen to illustrate price distribution:
 * - `min`: NDC with the lowest unit price
 * - `median`: NDC closest to the median unit price
 * - `max`: NDC with the highest unit price
 */
export const REASON_SELECTED = {
  MIN: 'min',
  MEDIAN: 'median',
  MAX: 'max',
} as const

export type ReasonSelected = typeof REASON_SELECTED[keyof typeof REASON_SELECTED]

/**
 * RxNorm Term Types (TTY) for drug concepts.
 * 
 * | Code   | Name                    | Description                              |
 * |--------|-------------------------|------------------------------------------|
 * | `SCD`  | Semantic Clinical Drug  | Generic drug with ingredient + strength  |
 * | `SBD`  | Semantic Branded Drug   | Branded drug (e.g., Lipitor 10 MG Tablet)|
 * | `GPCK` | Generic Pack            | Multi-item generic package               |
 * | `BPCK` | Branded Pack            | Multi-item branded package               |
 * 
 * @example
 * "SCD" = "atorvastatin 10 MG Oral Tablet" (generic)
 * "SBD" = "Lipitor 10 MG Oral Tablet" (branded)
 */
export const TERM_TYPE = {
  SCD: 'SCD',   // Semantic Clinical Drug
  SBD: 'SBD',   // Semantic Branded Drug
  GPCK: 'GPCK', // Generic Pack
  BPCK: 'BPCK', // Branded Pack
} as const

export type TermType = typeof TERM_TYPE[keyof typeof TERM_TYPE]

// ============================================================
// NESTED DOCUMENT INTERFACES
// ============================================================

/**
 * Aggregated pricing statistics for a medication.
 * 
 * Prices are calculated from NADAC (National Average Drug Acquisition Cost) data
 * across all NDCs mapped to this medication. All prices are in USD.
 * 
 * @interface PricingStats
 * 
 * @property {number} min_unit_price - Lowest per-unit price across all NDCs (USD).
 *   Example: 0.02 means $0.02 per unit.
 * 
 * @property {number} median_unit_price - Median per-unit price across all NDCs (USD).
 *   This is the most representative price for cost comparisons.
 * 
 * @property {number} max_unit_price - Highest per-unit price across all NDCs (USD).
 *   Often reflects branded or specialty packaged products.
 * 
 * @property {string} pricing_unit - Unit of measure for prices.
 *   | Value | Meaning          | Typical Use                    |
 *   |-------|------------------|--------------------------------|
 *   | "EA"  | Each (count)     | Tablets, capsules, suppositories |
 *   | "ML"  | Milliliter       | Liquids, solutions, suspensions  |
 *   | "GM"  | Gram             | Creams, ointments, powders       |
 * 
 * @property {number | null} price_per_ml - Price normalized to milliliters (USD/mL).
 *   Null for non-liquid medications or when conversion not possible.
 * 
 * @property {number | null} price_per_mg - Price normalized to milligrams (USD/mg).
 *   Null when strength-based conversion is not possible.
 * 
 * @property {number} ndc_count - Number of distinct NDC-11 codes with pricing data.
 *   Higher counts generally indicate more reliable median prices.
 * 
 * @example
 * {
 *   min_unit_price: 0.02,
 *   median_unit_price: 0.08,
 *   max_unit_price: 4.52,
 *   pricing_unit: "EA",
 *   price_per_ml: null,
 *   price_per_mg: 0.008,
 *   ndc_count: 28
 * }
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
 * Conversion values for unit calculations and dose normalization.
 * 
 * These values enable converting between different units (e.g., price per tablet
 * to price per mg of active ingredient) and identifying medication form.
 * 
 * @interface ConversionValues
 * 
 * @property {boolean} is_liquid - True if medication is a liquid formulation.
 *   Liquid forms: solutions, suspensions, syrups, elixirs, injectables.
 *   Solid forms: tablets, capsules, suppositories.
 * 
 * @property {number | null} package_size - Quantity per package.
 *   Example: 30 (for a bottle of 30 tablets), 100 (for 100 mL bottle).
 *   Null if package size could not be determined.
 * 
 * @property {string | null} package_unit - Unit for package_size.
 *   Common values: "EA" (each), "ML" (milliliters), "GM" (grams).
 *   Null if unit could not be determined.
 * 
 * @property {number | null} strength_val - Numeric strength value.
 *   Example: 10 (for 10 MG), 500 (for 500 MG), 2.5 (for 2.5 MG).
 *   Null if strength could not be parsed.
 * 
 * @property {string | null} strength_unit - Unit for strength.
 *   | Value    | Meaning                          |
 *   |----------|----------------------------------|
 *   | "MG"     | Milligrams                       |
 *   | "MG/ML"  | Milligrams per milliliter        |
 *   | "MCG"    | Micrograms                       |
 *   | "UNIT"   | International Units              |
 *   | "%"      | Percentage (topicals)            |
 *   Null if unit could not be determined.
 * 
 * @property {string | null} scdc_rxcui - RxCUI of the Semantic Clinical Drug Component.
 *   This is the ingredient-strength combination without dose form.
 *   Example: "83367" for "atorvastatin 10 MG".
 *   Useful for comparing drugs with same ingredient/strength.
 * 
 * @property {StrengthDataSource} data_source - Where conversion data was obtained from.
 *   See {@link STRENGTH_DATA_SOURCE} for possible values.
 * 
 * @example
 * // Solid medication example (tablet)
 * {
 *   is_liquid: false,
 *   package_size: 30,
 *   package_unit: "EA",
 *   strength_val: 10,
 *   strength_unit: "MG",
 *   scdc_rxcui: "83367",
 *   data_source: "RXNSAT"
 * }
 * 
 * @example
 * // Liquid medication example (solution)
 * {
 *   is_liquid: true,
 *   package_size: 473,
 *   package_unit: "ML",
 *   strength_val: 125,
 *   strength_unit: "MG/5ML",
 *   scdc_rxcui: "198440",
 *   data_source: "FDA"
 * }
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
 * NDC (National Drug Code) associations for a medication.
 * 
 * NDC-11 is the 11-digit normalized format (5-4-2) used to uniquely identify
 * drug products in the US market.
 * 
 * @interface NdcLinks
 * 
 * @property {string[]} ndc11_all - All NDC-11 codes mapped to this medication.
 *   Includes all packages, manufacturers, and repackagers.
 *   Array may be empty for unmatched medications.
 *   
 *   Example: ["00071015523", "00378202377", "00591372130", ...]
 * 
 * @property {string[]} ndc11_preferred - Subset of preferred/recommended NDCs.
 *   Typically original manufacturer codes (not repackagers).
 *   Useful when a single representative NDC is needed.
 *   May be empty if no preferred NDC could be determined.
 *   
 *   Example: ["00071015523"]
 * 
 * @example
 * {
 *   ndc11_all: [
 *     "00071015523",  // Original manufacturer
 *     "00378202377",  // Generic manufacturer
 *     "00591372130",  // Another generic
 *     "55111017190",  // Repackager
 *     // ... potentially dozens more
 *   ],
 *   ndc11_preferred: ["00071015523"]
 * }
 */
export interface NdcLinks {
  ndc11_all: string[]
  ndc11_preferred: string[]
}

/**
 * Exemplar evidence entry showing a representative NDC with its pricing.
 * 
 * Exemplars are selected NDCs that demonstrate the price range for a medication.
 * Each medication typically has 3 exemplars: min, median, and max priced.
 * 
 * @interface Exemplar
 * 
 * @property {string} ndc11 - The 11-digit NDC code for this exemplar.
 *   Format: 11 digits, no dashes (e.g., "00378202377").
 * 
 * @property {string} ndc_description - FDA product description for this NDC.
 *   Usually includes drug name, strength, form in uppercase.
 *   Example: "ATORVASTATIN CALCIUM 10MG TAB"
 * 
 * @property {number} unit_price - Price per unit for this NDC (USD).
 *   The per-tablet, per-mL, or per-gram price.
 * 
 * @property {string} pricing_unit - Unit of measure for the price.
 *   "EA" (each), "ML" (milliliter), or "GM" (gram).
 * 
 * @property {ReasonSelected} reason_selected - Why this NDC was chosen as exemplar.
 *   - "min": Lowest price in the distribution
 *   - "median": Closest to median price
 *   - "max": Highest price in the distribution
 * 
 * @property {number} nadac_per_unit - NADAC (National Average Drug Acquisition Cost) per unit.
 *   This is the official CMS pricing used for Medicaid reimbursement.
 *   Usually matches unit_price but may differ for some calculations.
 * 
 * @property {number | null} package_size - Number of units in this package.
 *   Example: 90 for a 90-count bottle. Null if unknown.
 * 
 * @property {string | null} package_description - FDA package description.
 *   Human-readable package format from SPL data.
 *   Example: "90 TABLET in 1 BOTTLE", "1 SYRINGE in 1 CARTON"
 * 
 * @example
 * // Min-price exemplar for atorvastatin 10 MG
 * {
 *   ndc11: "00378202377",
 *   ndc_description: "ATORVASTATIN CALCIUM 10MG TAB",
 *   unit_price: 0.02,
 *   pricing_unit: "EA",
 *   reason_selected: "min",
 *   nadac_per_unit: 0.02,
 *   package_size: 90,
 *   package_description: "90 TABLET in 1 BOTTLE"
 * }
 * 
 * @example
 * // Max-price exemplar (branded)
 * {
 *   ndc11: "00071015523",
 *   ndc_description: "LIPITOR 10MG TABLET",
 *   unit_price: 4.52,
 *   pricing_unit: "EA",
 *   reason_selected: "max",
 *   nadac_per_unit: 4.52,
 *   package_size: 30,
 *   package_description: "30 TABLET in 1 BOTTLE"
 * }
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
 * Drug classification and ingredient information.
 * 
 * Provides the active ingredient details and therapeutic classification codes.
 * 
 * @interface Classification
 * 
 * @property {string | null} ingredient_name - Name of the primary active ingredient.
 *   Normalized ingredient name from RxNorm (lowercase, no salts).
 *   Example: "atorvastatin", "metformin", "lisinopril"
 *   Null for complex drugs or when ingredient cannot be determined.
 * 
 * @property {string | null} rxnorm_ingredient_rxcui - RxCUI of the active ingredient.
 *   This is the TTY=IN (Ingredient) concept in RxNorm.
 *   Useful for finding all drugs with the same ingredient.
 *   Example: "83367" for atorvastatin
 * 
 * @property {string[]} atc_codes - ATC (Anatomical Therapeutic Chemical) classification codes.
 *   WHO standard for classifying drugs by therapeutic use.
 *   
 *   Format: 7 characters (e.g., "C10AA05")
 *   - 1st level (C): Anatomical main group (Cardiovascular)
 *   - 2nd level (10): Therapeutic subgroup (Lipid modifying)
 *   - 3rd level (A): Pharmacological subgroup (Lipid modifying plain)
 *   - 4th level (A): Chemical subgroup (HMG CoA reductase inhibitors)
 *   - 5th level (05): Chemical substance (atorvastatin)
 *   
 *   May contain multiple codes for combination drugs.
 *   Empty array if no ATC mapping exists.
 * 
 * @example
 * // Single-ingredient drug
 * {
 *   ingredient_name: "atorvastatin",
 *   rxnorm_ingredient_rxcui: "83367",
 *   atc_codes: ["C10AA05"]
 * }
 * 
 * @example
 * // Combination drug (may have multiple ATC codes)
 * {
 *   ingredient_name: "amlodipine / atorvastatin",
 *   rxnorm_ingredient_rxcui: null,  // Combination has no single ingredient
 *   atc_codes: ["C10BX03"]
 * }
 */
export interface Classification {
  ingredient_name: string | null
  rxnorm_ingredient_rxcui: string | null
  atc_codes: string[]
}

/**
 * Drug safety and regulatory information.
 * 
 * Contains critical safety flags including black box warnings, PIM status,
 * and controlled substance classification.
 * 
 * @interface Safety
 * 
 * @property {boolean} has_black_box_warning - FDA black box warning indicator.
 *   True if the drug label contains a boxed warning (most serious FDA warning).
 * 
 * @property {boolean} is_controlled_substance - DEA controlled substance status.
 *   True if the drug is a DEA-scheduled controlled substance.
 * 
 * @property {string | null} controlled_substance_schedule - DEA schedule classification.
 *   | Value  | Description                                      |
 *   |--------|--------------------------------------------------|
 *   | "CII"  | High abuse potential, severe dependence risk     |
 *   | "CIII" | Moderate abuse potential                         |
 *   | "CIV"  | Lower abuse potential                            |
 *   | "CV"   | Lowest abuse potential                           |
 *   Null if not a controlled substance.
 * 
 * @property {boolean} is_pim - Potentially Inappropriate Medication for elderly.
 *   True if listed on AGS Beers Criteria or similar PIM list.
 * 
 * @property {string | null} pim_source_version - Version of PIM criteria used.
 *   Example: "beers-2023-v1"
 * 
 * @property {string[]} pim_trigger_ingredients - RxCUIs that triggered PIM status.
 *   Array of ingredient RxCUIs that are on the PIM list.
 * 
 * @property {boolean | null} has_contraindications_section - Label has contraindications.
 * @property {boolean | null} has_warnings_section - Label has warnings section.
 * 
 * @example
 * {
 *   has_black_box_warning: false,
 *   is_controlled_substance: true,
 *   controlled_substance_schedule: "CIV",
 *   is_pim: true,
 *   pim_source_version: "beers-2023-v1",
 *   pim_trigger_ingredients: ["8134"],
 *   has_contraindications_section: null,
 *   has_warnings_section: null
 * }
 */
export interface Safety {
  has_black_box_warning: boolean
  is_controlled_substance: boolean
  controlled_substance_schedule: string | null
  is_pim: boolean
  pim_source_version: string | null
  pim_trigger_ingredients: string[]
  has_contraindications_section: boolean | null
  has_warnings_section: boolean | null
}

/**
 * Dataset version tracking for data provenance.
 * 
 * Tracks which versions of source datasets were used to build this medication record.
 * Important for reproducibility and understanding data freshness.
 * 
 * @interface DatasetVersions
 * 
 * @property {string | null} nadac_week - NADAC weekly file date used for pricing.
 *   Format: "YYYY-MM-DD" (Wednesday of the NADAC release week)
 *   NADAC is updated weekly by CMS.
 *   Example: "2024-01-10"
 *   Null if no NADAC data was used.
 * 
 * @property {string | null} rxnorm_version - RxNorm monthly release version.
 *   Format: "MMDDYYYY" (month-day-year of release)
 *   RxNorm is updated monthly by NLM.
 *   Example: "01022024" (January 2, 2024 release)
 *   Null if RxNorm version could not be determined.
 * 
 * @property {string | null} fda_date - FDA NDC Directory download date.
 *   Format: "YYYY-MM-DD"
 *   The FDA updates NDC data periodically (not on fixed schedule).
 *   Example: "2024-01-08"
 *   Null if no FDA data was used.
 * 
 * @example
 * {
 *   nadac_week: "2024-01-10",
 *   rxnorm_version: "01022024",
 *   fda_date: "2024-01-08"
 * }
 */
export interface DatasetVersions {
  nadac_week: string | null
  rxnorm_version: string | null
  fda_date: string | null
}

// ============================================================
// MAIN DOCUMENT INTERFACE
// ============================================================

/**
 * Complete medication document as stored in Firestore.
 * 
 * This is the top-level interface representing a single medication record.
 * Each document is identified by its RxCUI and contains aggregated data from
 * multiple sources (RxNorm, NADAC, FDA).
 * 
 * ## Document Structure Overview
 * 
 * ```
 * MedicationDocument
 * ├── Primary Identifiers (rxcui, name, tty)
 * ├── pricing_stats: PricingStats
 * │   └── min/median/max prices, NDC count
 * ├── conversion_values: ConversionValues
 * │   └── Strength, package size, liquid/solid
 * ├── ndc_links: NdcLinks
 * │   └── Arrays of NDC-11 codes
 * ├── exemplars: Exemplar[]
 * │   └── Representative NDCs with pricing evidence
 * ├── classification: Classification
 * │   └── Ingredient info, ATC codes
 * ├── dataset_versions: DatasetVersions
 * │   └── Source data version tracking
 * └── Metadata (created_at, updated_at)
 * ```
 * 
 * ## Field Summary Table
 * 
 * | Field             | Type              | Required | Description                           |
 * |-------------------|-------------------|----------|---------------------------------------|
 * | rxcui             | string            | ✓        | RxNorm Concept Unique Identifier      |
 * | name              | string            | ✓        | Full medication name                  |
 * | tty               | TermType          | ✓        | Term type (SCD/SBD/GPCK/BPCK)         |
 * | pricing_stats     | PricingStats      | ✓        | Aggregated pricing statistics         |
 * | conversion_values | ConversionValues  | ✓        | Strength and unit conversion data     |
 * | ndc_links         | NdcLinks          | ✓        | Associated NDC codes                  |
 * | exemplars         | Exemplar[]        | ✓        | Evidence records (may be empty)       |
 * | classification    | Classification    | ✓        | Drug classification data              |
 * | dataset_versions  | DatasetVersions   | ✓        | Data source version tracking          |
 * | created_at        | string            | ✗        | ISO timestamp of creation             |
 * | updated_at        | string            | ✗        | ISO timestamp of last update          |
 * 
 * @interface MedicationDocument
 * 
 * @example
 * // Complete medication document example
 * {
 *   // Primary identifiers
 *   rxcui: "197318",
 *   name: "atorvastatin 10 MG Oral Tablet",
 *   tty: "SCD",
 * 
 *   // Pricing (aggregated from NADAC)
 *   pricing_stats: {
 *     min_unit_price: 0.02,
 *     median_unit_price: 0.08,
 *     max_unit_price: 4.52,
 *     pricing_unit: "EA",
 *     price_per_ml: null,
 *     price_per_mg: 0.008,
 *     ndc_count: 28
 *   },
 * 
 *   // Conversion data
 *   conversion_values: {
 *     is_liquid: false,
 *     package_size: 30,
 *     package_unit: "EA",
 *     strength_val: 10,
 *     strength_unit: "MG",
 *     scdc_rxcui: "83367",
 *     data_source: "RXNSAT"
 *   },
 * 
 *   // NDC associations
 *   ndc_links: {
 *     ndc11_all: ["00071015523", "00378202377", "00591372130"],
 *     ndc11_preferred: ["00071015523"]
 *   },
 * 
 *   // Exemplar evidence (min, median, max priced NDCs)
 *   exemplars: [
 *     {
 *       ndc11: "00378202377",
 *       ndc_description: "ATORVASTATIN CALCIUM 10MG TAB",
 *       unit_price: 0.02,
 *       pricing_unit: "EA",
 *       reason_selected: "min",
 *       nadac_per_unit: 0.02,
 *       package_size: 90,
 *       package_description: "90 TABLET in 1 BOTTLE"
 *     },
 *     {
 *       ndc11: "00591372130",
 *       ndc_description: "ATORVASTATIN 10MG TABLETS",
 *       unit_price: 0.08,
 *       pricing_unit: "EA",
 *       reason_selected: "median",
 *       nadac_per_unit: 0.08,
 *       package_size: 30,
 *       package_description: "30 TABLET in 1 BOTTLE"
 *     },
 *     {
 *       ndc11: "00071015523",
 *       ndc_description: "LIPITOR 10MG TABLET",
 *       unit_price: 4.52,
 *       pricing_unit: "EA",
 *       reason_selected: "max",
 *       nadac_per_unit: 4.52,
 *       package_size: 30,
 *       package_description: "30 TABLET in 1 BOTTLE"
 *     }
 *   ],
 * 
 *   // Classification
 *   classification: {
 *     ingredient_name: "atorvastatin",
 *     ingredient_rxcui: "83367",
 *     atc_codes: ["C10AA05"]
 *   },
 * 
 *   // Data versions
 *   dataset_versions: {
 *     nadac_week: "2024-01-10",
 *     rxnorm_version: "01022024",
 *     fda_date: "2024-01-08"
 *   },
 * 
 *   // Metadata (optional)
 *   created_at: "2024-01-15T10:30:00.000Z",
 *   updated_at: "2024-01-15T10:30:00.000Z"
 * }
 */
export interface MedicationDocument {
  // ─────────────────────────────────────────────────────────
  // PRIMARY IDENTIFIERS
  // ─────────────────────────────────────────────────────────
  
  /** 
   * RxNorm Concept Unique Identifier.
   * Primary key for the medication record.
   * Format: Numeric string (e.g., "197318") or "UNMATCHED_<hash>" for unmatched drugs.
   */
  rxcui: string
  
  /** 
   * Full medication name including ingredient, strength, and dose form.
   * Example: "atorvastatin 10 MG Oral Tablet"
   */
  name: string
  
  /** 
   * RxNorm Term Type indicating the drug concept level.
   * See {@link TERM_TYPE} for possible values.
   */
  tty: TermType | string

  // ─────────────────────────────────────────────────────────
  // PRICING INFORMATION
  // ─────────────────────────────────────────────────────────
  
  /** 
   * Aggregated pricing statistics from NADAC data.
   * See {@link PricingStats} for detailed field descriptions.
   */
  pricing_stats: PricingStats

  // ─────────────────────────────────────────────────────────
  // CONVERSION AND STRENGTH DATA
  // ─────────────────────────────────────────────────────────
  
  /** 
   * Values for unit conversions and form identification.
   * See {@link ConversionValues} for detailed field descriptions.
   */
  conversion_values: ConversionValues

  // ─────────────────────────────────────────────────────────
  // NDC ASSOCIATIONS
  // ─────────────────────────────────────────────────────────
  
  /** 
   * NDC-11 codes linked to this medication.
   * See {@link NdcLinks} for detailed field descriptions.
   */
  ndc_links: NdcLinks

  // ─────────────────────────────────────────────────────────
  // EVIDENCE RECORDS
  // ─────────────────────────────────────────────────────────
  
  /** 
   * Exemplar NDCs demonstrating the price distribution.
   * Typically contains min, median, and max priced entries.
   * May be empty array if no exemplars could be generated.
   * See {@link Exemplar} for detailed field descriptions.
   */
  exemplars: Exemplar[]

  // ─────────────────────────────────────────────────────────
  // CLASSIFICATION
  // ─────────────────────────────────────────────────────────
  
  /** 
   * Drug classification and ingredient information.
   * See {@link Classification} for detailed field descriptions.
   */
  classification: Classification

  // ─────────────────────────────────────────────────────────
  // SAFETY INFORMATION
  // ─────────────────────────────────────────────────────────
  
  /** 
   * Drug safety and regulatory information.
   * Includes black box warnings, controlled substance status, and PIM flags.
   * See {@link Safety} for detailed field descriptions.
   */
  safety?: Safety

  // ─────────────────────────────────────────────────────────
  // DATA VERSIONING
  // ─────────────────────────────────────────────────────────
  
  /** 
   * Source dataset versions used to build this record.
   * See {@link DatasetVersions} for detailed field descriptions.
   */
  dataset_versions: DatasetVersions

  // ─────────────────────────────────────────────────────────
  // METADATA (Optional)
  // ─────────────────────────────────────────────────────────
  
  /** 
   * ISO 8601 timestamp when the document was first created.
   * Example: "2024-01-15T10:30:00.000Z"
   */
  created_at?: string
  
  /** 
   * ISO 8601 timestamp when the document was last updated.
   * Example: "2024-01-15T10:30:00.000Z"
   */
  updated_at?: string
}

// ============================================================
// FILTER AND SORT HELPER TYPES
// ============================================================

/**
 * Available fields for sorting medication lists.
 * 
 * | Value          | Sorts By                          |
 * |----------------|-----------------------------------|
 * | "name"         | Medication name (alphabetical)    |
 * | "rxcui"        | RxCUI (numeric order as string)   |
 * | "median_price" | Median unit price (numeric)       |
 * | "ndc_count"    | Number of linked NDCs (numeric)   |
 */
export type SortField = 'name' | 'rxcui' | 'median_price' | 'ndc_count'

/**
 * Sort direction for medication list ordering.
 * - "asc": Ascending (A→Z, low→high)
 * - "desc": Descending (Z→A, high→low)
 */
export type SortDirection = 'asc' | 'desc'

/**
 * Filter configuration for medication queries.
 * 
 * Multiple filters are combined with AND logic.
 * 
 * @interface FilterOptions
 * 
 * @property {string} searchQuery - Text to search in name, rxcui, or ingredient.
 *   Case-insensitive partial match.
 * 
 * @property {boolean} matchedOnly - If true, only show medications with valid RxCUI
 *   (excludes "UNMATCHED_*" entries).
 * 
 * @property {boolean} unmatchedOnly - If true, only show medications that couldn't
 *   be matched to RxNorm (rxcui starts with "UNMATCHED_").
 * 
 * @property {boolean} liquidsOnly - If true, only show liquid formulations
 *   (is_liquid === true).
 * 
 * @property {boolean} solidsOnly - If true, only show solid formulations
 *   (is_liquid === false).
 * 
 * @property {number} minNdcCount - Minimum number of linked NDCs required.
 *   Set to 0 to disable this filter.
 */
export interface FilterOptions {
  searchQuery: string
  matchedOnly: boolean
  unmatchedOnly: boolean
  liquidsOnly: boolean
  solidsOnly: boolean
  minNdcCount: number
}

/**
 * Sort configuration for medication queries.
 * 
 * @interface SortOptions
 * 
 * @property {SortField} field - The field to sort by.
 * @property {SortDirection} direction - Ascending or descending order.
 * 
 * @example
 * { field: "median_price", direction: "desc" } // Highest prices first
 */
export interface SortOptions {
  field: SortField
  direction: SortDirection
}

