/**
 * Firestore API operations
 * Data Access Layer - handles all Firestore read operations
 * 
 * This module provides functions to fetch medication data from the Firestore
 * "Medications" collection. Each document represents a unique drug concept
 * identified by an RxCUI (RxNorm Concept Unique Identifier).
 * 
 * ## Collection Structure
 * - Collection Name: "Medications"
 * - Document ID: RxCUI (string)
 * - Ordering: Documents are ordered by `rxcui` field for pagination
 * 
 * ## Response Data Format
 * Each medication document contains:
 * - **Primary identifiers**: rxcui, name, tty (term type)
 * - **Pricing information**: min/median/max unit prices, pricing unit
 * - **Conversion values**: liquid/solid flag, package sizes, strength data
 * - **NDC associations**: 11-digit NDC codes linked to this medication
 * - **Exemplars**: Evidence records showing price data sources
 * - **Classification**: Ingredient info and ATC codes
 * - **Dataset versions**: NADAC week, RxNorm version, FDA date
 * 
 * @see {@link MedicationDocument} for the complete document schema
 * @see https://www.nlm.nih.gov/research/umls/rxnorm/ for RxNorm details
 */

import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
  where,
  getCountFromServer,
  type QueryDocumentSnapshot,
  type DocumentData,
} from 'firebase/firestore'
import { db } from './firebase'
import type { MedicationDocument } from '../types/medication'

/** Firestore collection name for medication documents */
const MEDICATIONS_COLLECTION = 'Medications'

/**
 * Result object returned from paginated medication queries.
 * 
 * @interface PaginatedResult
 * 
 * @property {MedicationDocument[]} medications - Array of medication documents for the current page.
 *   Each document follows the {@link MedicationDocument} schema.
 * 
 * @property {number} totalCount - Total number of medications in the collection.
 *   Used for pagination UI (calculating total pages).
 * 
 * @property {boolean} hasMore - Indicates if more documents exist after this page.
 *   True if the number of returned documents equals the page size.
 * 
 * @property {QueryDocumentSnapshot<DocumentData> | null} lastDoc - Cursor for the next page.
 *   Pass this to the next query's `startAfter()` for cursor-based pagination.
 *   Null if no documents were returned.
 * 
 * @example
 * // Typical response structure
 * {
 *   medications: [
 *     {
 *       rxcui: "1000001",
 *       name: "acetaminophen 325 MG Oral Tablet",
 *       tty: "SCD",
 *       pricing_stats: {
 *         min_unit_price: 0.01,
 *         median_unit_price: 0.03,
 *         max_unit_price: 0.15,
 *         pricing_unit: "EA",
 *         price_per_ml: null,
 *         price_per_mg: 0.0000923,
 *         ndc_count: 45
 *       },
 *       // ... other fields
 *     },
 *     // ... more medications
 *   ],
 *   totalCount: 15234,
 *   hasMore: true,
 *   lastDoc: <Firestore QueryDocumentSnapshot>
 * }
 */
export interface PaginatedResult {
  medications: MedicationDocument[]
  totalCount: number
  hasMore: boolean
  lastDoc: QueryDocumentSnapshot<DocumentData> | null
}

/**
 * Get total count of medications in the database.
 * 
 * Uses Firestore's server-side count aggregation for efficiency.
 * This avoids downloading all documents just to count them.
 * 
 * @returns {Promise<number>} The total number of medication documents.
 * 
 * @throws {FirebaseError} If the user is not authenticated or lacks read permissions.
 * 
 * @example
 * const count = await getMedicationCount()
 * console.log(`Database contains ${count} medications`) // e.g., "Database contains 15234 medications"
 */
export async function getMedicationCount(): Promise<number> {
  const countSnapshot = await getCountFromServer(collection(db, MEDICATIONS_COLLECTION))
  return countSnapshot.data().count
}

/**
 * Fetch a page of medications from Firestore using cursor-based pagination.
 * 
 * Documents are ordered by `rxcui` ascending. Each page returns up to `pageSize`
 * documents along with a cursor (`lastDoc`) to fetch the next page.
 * 
 * ## Pagination Strategy
 * - First page: Call with `lastDocument = null`
 * - Subsequent pages: Pass the `lastDoc` from the previous result
 * - End of data: When `hasMore` is `false` or `lastDoc` is `null`
 * 
 * ## Expected Response Attributes
 * Each medication document in the response contains:
 * 
 * | Attribute           | Type              | Description                                    |
 * |---------------------|-------------------|------------------------------------------------|
 * | `rxcui`             | string            | RxNorm Concept Unique Identifier               |
 * | `name`              | string            | Full medication name (e.g., "acetaminophen 325 MG Oral Tablet") |
 * | `tty`               | string            | Term type: "SCD", "SBD", "GPCK", or "BPCK"     |
 * | `pricing_stats`     | PricingStats      | Min/median/max prices and NDC count            |
 * | `conversion_values` | ConversionValues  | Strength, package size, liquid/solid indicator |
 * | `ndc_links`         | NdcLinks          | Associated 11-digit NDC codes                  |
 * | `exemplars`         | Exemplar[]        | Evidence records with source pricing data      |
 * | `classification`    | Classification    | Ingredient name and ATC codes                  |
 * | `dataset_versions`  | DatasetVersions   | Data source version tracking                   |
 * | `created_at`        | string (optional) | ISO timestamp of document creation             |
 * | `updated_at`        | string (optional) | ISO timestamp of last update                   |
 * 
 * @param {number} [pageSize=100] - Number of medications to fetch per page (1-500).
 * @param {QueryDocumentSnapshot<DocumentData> | null} [lastDocument=null] - 
 *   Cursor from previous page's `lastDoc`. Pass `null` for the first page.
 * 
 * @returns {Promise<PaginatedResult>} Object containing:
 *   - `medications`: Array of {@link MedicationDocument} objects
 *   - `totalCount`: Total medications in database
 *   - `hasMore`: Whether more pages exist
 *   - `lastDoc`: Cursor for next page (or null if no results)
 * 
 * @throws {FirebaseError} If authentication fails or query is invalid.
 * 
 * @example
 * // Fetch first page
 * const page1 = await fetchMedicationsPage(50)
 * console.log(page1.medications.length) // 50
 * console.log(page1.hasMore) // true
 * 
 * // Fetch second page using cursor
 * const page2 = await fetchMedicationsPage(50, page1.lastDoc)
 * 
 * @example
 * // Sample medication object in response
 * {
 *   rxcui: "197318",
 *   name: "atorvastatin 10 MG Oral Tablet",
 *   tty: "SCD",
 *   pricing_stats: {
 *     min_unit_price: 0.02,
 *     median_unit_price: 0.08,
 *     max_unit_price: 4.52,
 *     pricing_unit: "EA",
 *     price_per_ml: null,
 *     price_per_mg: 0.008,
 *     ndc_count: 28
 *   },
 *   conversion_values: {
 *     is_liquid: false,
 *     package_size: 30,
 *     package_unit: "EA",
 *     strength_val: 10,
 *     strength_unit: "MG",
 *     scdc_rxcui: "83367",
 *     data_source: "RXNSAT"
 *   },
 *   ndc_links: {
 *     ndc11_all: ["00071015523", "00378202377", ...],
 *     ndc11_preferred: ["00071015523"]
 *   },
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
 *     }
 *   ],
 *   classification: {
 *     ingredient_name: "atorvastatin",
 *     ingredient_rxcui: "83367",
 *     atc_codes: ["C10AA05"]
 *   },
 *   dataset_versions: {
 *     nadac_week: "2024-01-10",
 *     rxnorm_version: "01022024",
 *     fda_date: "2024-01-08"
 *   }
 * }
 */
export async function fetchMedicationsPage(
  pageSize: number = 100,
  lastDocument: QueryDocumentSnapshot<DocumentData> | null = null
): Promise<PaginatedResult> {
  // Get total count
  let totalCount = 0
  try {
    totalCount = await getMedicationCount()
  } catch {
    // Count not available
  }

  // Build query
  let q
  if (lastDocument) {
    q = query(
      collection(db, MEDICATIONS_COLLECTION),
      orderBy('rxcui'),
      startAfter(lastDocument),
      limit(pageSize)
    )
  } else {
    q = query(
      collection(db, MEDICATIONS_COLLECTION),
      orderBy('rxcui'),
      limit(pageSize)
    )
  }

  const snapshot = await getDocs(q)
  const medications: MedicationDocument[] = []

  snapshot.docs.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
    medications.push(doc.data() as MedicationDocument)
  })

  const lastDoc = snapshot.docs.length > 0 
    ? snapshot.docs[snapshot.docs.length - 1] 
    : null

  return {
    medications,
    totalCount,
    hasMore: snapshot.docs.length === pageSize,
    lastDoc,
  }
}

/**
 * Fetch ALL medications from Firestore by iterating through all pages.
 * 
 * ⚠️ **Warning**: This function fetches the entire collection and may take
 * significant time/bandwidth for large datasets (10,000+ documents).
 * Use `fetchMedicationsPage()` for better performance in most cases.
 * 
 * ## How it works
 * 1. Retrieves total document count for progress reporting
 * 2. Iteratively fetches pages of 100 documents each
 * 3. Concatenates all results into a single array
 * 4. Calls progress callback after each page (if provided)
 * 
 * ## Response Array Structure
 * Returns an array where each element is a {@link MedicationDocument}:
 * 
 * ```typescript
 * [
 *   {
 *     rxcui: "1000001",
 *     name: "acetaminophen 325 MG Oral Tablet",
 *     tty: "SCD",
 *     pricing_stats: { ... },
 *     conversion_values: { ... },
 *     ndc_links: { ndc11_all: [...], ndc11_preferred: [...] },
 *     exemplars: [ ... ],
 *     classification: { ... },
 *     dataset_versions: { ... }
 *   },
 *   // ... thousands more
 * ]
 * ```
 * 
 * @param {Function} [onProgress] - Optional callback invoked after each page:
 *   - `count`: Number of documents loaded so far
 *   - `total`: Total documents in collection (or null if unavailable)
 * 
 * @returns {Promise<MedicationDocument[]>} Complete array of all medication documents.
 * 
 * @throws {FirebaseError} If authentication fails during any page fetch.
 * 
 * @example
 * // Load all with progress tracking
 * const allMeds = await fetchAllMedications((loaded, total) => {
 *   console.log(`Loaded ${loaded} of ${total ?? '?'} medications`)
 * })
 * console.log(`Total loaded: ${allMeds.length}`)
 * 
 * @example
 * // Load all without progress (simpler but no feedback)
 * const allMeds = await fetchAllMedications()
 */
export async function fetchAllMedications(
  onProgress?: (count: number, total: number | null) => void
): Promise<MedicationDocument[]> {
  const medications: MedicationDocument[] = []
  let lastDoc: QueryDocumentSnapshot<DocumentData> | null = null
  let hasMore = true
  const pageSize = 100

  // Try to get total count for progress reporting
  let totalCount: number | null = null
  try {
    totalCount = await getMedicationCount()
  } catch {
    // Count not available, proceed without it
  }

  while (hasMore) {
    const result = await fetchMedicationsPage(pageSize, lastDoc)
    medications.push(...result.medications)
    lastDoc = result.lastDoc
    hasMore = result.hasMore
    onProgress?.(medications.length, totalCount)
  }

  return medications
}

/**
 * Fetch a single medication by its RxCUI (RxNorm Concept Unique Identifier).
 * 
 * RxCUI is the primary identifier for medications in the RxNorm vocabulary.
 * Each RxCUI uniquely identifies a drug concept including its ingredients,
 * strength, and dose form.
 * 
 * ## RxCUI Format
 * - Numeric string (e.g., "197318" for atorvastatin 10 MG Oral Tablet)
 * - For unmatched medications: "UNMATCHED_<hash>" prefix
 * 
 * ## Response Attributes
 * When found, returns a complete {@link MedicationDocument} with all fields:
 * 
 * | Field               | Always Present | Description                          |
 * |---------------------|----------------|--------------------------------------|
 * | `rxcui`             | ✓              | The RxCUI that was queried           |
 * | `name`              | ✓              | Full clinical drug name              |
 * | `tty`               | ✓              | Term type (SCD/SBD/GPCK/BPCK)        |
 * | `pricing_stats`     | ✓              | Aggregated pricing from NADAC        |
 * | `conversion_values` | ✓              | Strength/package conversion data     |
 * | `ndc_links`         | ✓              | Associated NDC-11 codes              |
 * | `exemplars`         | ✓              | Evidence records (may be empty [])   |
 * | `classification`    | ✓              | Drug classification (may have nulls) |
 * | `dataset_versions`  | ✓              | Source data version info             |
 * | `created_at`        | ✗              | Optional creation timestamp          |
 * | `updated_at`        | ✗              | Optional last update timestamp       |
 * 
 * @param {string} rxcui - The RxCUI to look up. Must be an exact match.
 * 
 * @returns {Promise<MedicationDocument | null>} 
 *   - The medication document if found
 *   - `null` if no medication exists with this RxCUI
 * 
 * @throws {FirebaseError} If authentication fails or query is malformed.
 * 
 * @example
 * // Lookup a known medication
 * const med = await fetchMedicationByRxcui("197318")
 * if (med) {
 *   console.log(med.name) // "atorvastatin 10 MG Oral Tablet"
 *   console.log(med.pricing_stats.median_unit_price) // 0.08
 *   console.log(med.ndc_links.ndc11_all.length) // 28
 * }
 * 
 * @example
 * // Handle not-found case
 * const med = await fetchMedicationByRxcui("INVALID")
 * if (!med) {
 *   console.log("Medication not found")
 * }
 * 
 * @example
 * // Unmatched medication lookup
 * const unmatched = await fetchMedicationByRxcui("UNMATCHED_abc123")
 * // These are medications that couldn't be matched to RxNorm
 */
export async function fetchMedicationByRxcui(
  rxcui: string
): Promise<MedicationDocument | null> {
  const q = query(
    collection(db, MEDICATIONS_COLLECTION),
    where('rxcui', '==', rxcui),
    limit(1)
  )

  const snapshot = await getDocs(q)
  
  if (snapshot.empty) {
    return null
  }

  return snapshot.docs[0].data() as MedicationDocument
}
