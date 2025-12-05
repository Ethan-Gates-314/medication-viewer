/**
 * Firestore API operations
 * Data Access Layer - handles all Firestore read operations
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

const MEDICATIONS_COLLECTION = 'Medications'

export interface PaginatedResult {
  medications: MedicationDocument[]
  totalCount: number
  hasMore: boolean
  lastDoc: QueryDocumentSnapshot<DocumentData> | null
}

/**
 * Get total count of medications
 */
export async function getMedicationCount(): Promise<number> {
  const countSnapshot = await getCountFromServer(collection(db, MEDICATIONS_COLLECTION))
  return countSnapshot.data().count
}

/**
 * Fetch a page of medications from Firestore
 * @param pageSize - Number of items per page
 * @param lastDocument - Last document from previous page for cursor-based pagination
 * @returns Paginated result with medications and metadata
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
 * Fetch all medications from Firestore with pagination (for backwards compatibility)
 * @param onProgress - Optional callback to report loading progress
 * @returns Array of all medication documents
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
 * Fetch a single medication by RxCUI
 * @param rxcui - The RxCUI identifier to look up
 * @returns The medication document or null if not found
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
