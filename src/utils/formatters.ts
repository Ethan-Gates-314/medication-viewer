/**
 * Formatting utilities
 */

/**
 * Clean medication name by removing any leading format codes like "{1 " etc.
 * These are sometimes present in RxNorm data.
 */
export function cleanMedicationName(name: string): string {
  if (!name) return ''
  
  // Remove patterns like "{1 ", "{2 ", etc. at the start
  let cleaned = name.replace(/^\{\d+\s+/, '')
  
  // Remove trailing "}" if the opening was removed
  if (name.startsWith('{') && cleaned !== name) {
    cleaned = cleaned.replace(/\}$/, '')
  }
  
  return cleaned.trim()
}

/**
 * Format a price value with proper handling of null/undefined
 */
export function formatPrice(price: number | null | undefined, decimals = 2): string {
  if (price === null || price === undefined || isNaN(price)) return '—'
  return `$${price.toFixed(decimals)}`
}

/**
 * Format a number with locale string
 */
export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined || isNaN(num)) return '—'
  return num.toLocaleString()
}

