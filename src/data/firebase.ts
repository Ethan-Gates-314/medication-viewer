/**
 * Firebase initialization and authentication
 * Data Access Layer - handles Firebase SDK setup
 */

import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth, signInAnonymously, type User } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Initialize Firebase app
const app = initializeApp(firebaseConfig)

// Get Firestore instance with named database 'medications'
export const db = getFirestore(app, 'medications')

// Get Auth instance
export const auth = getAuth(app)

/**
 * Initialize anonymous authentication for read-only access
 * @returns Promise resolving to the authenticated user
 */
export async function initAuth(): Promise<User> {
  const userCredential = await signInAnonymously(auth)
  return userCredential.user
}

/**
 * Check if Firebase is properly configured
 */
export function isFirebaseConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
  )
}

