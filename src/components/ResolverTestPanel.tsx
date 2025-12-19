/**
 * ResolverTestPanel Component
 * Test harness for the RxNorm Resolver API
 */

import { useState, useCallback } from 'react'
import { observer } from 'mobx-react-lite'

// ============ TYPES ============

type RouteHint = 'ORAL' | 'IV' | 'IM' | 'SUBQ' | 'TOPICAL' | 'RECTAL' | 'NASAL' | 'INHALATION' | ''
type FormHint = 'tablet' | 'capsule' | 'solution' | 'cream' | 'injection' | 'patch' | 'suppository' | ''

interface SingleResolveRequest {
  text: string
  route_hint?: RouteHint
  form_hint?: FormHint
  debug?: boolean
  allow_ingredient_only?: boolean
}

interface BatchResolveItem {
  id: string
  text: string
  route_hint?: RouteHint
  form_hint?: FormHint
}

interface BatchResolveRequest {
  items: BatchResolveItem[]
  debug?: boolean
}

interface TopCandidate {
  rxcui: string
  name: string
  tty: string
  score: number
}

interface SingleResolveResponse {
  resolved: boolean
  rxcui?: string
  confidence?: number
  matched_synonym?: string
  match_type?: string
  reason?: string
  top_candidates?: TopCandidate[]
}

interface BatchResolveResult extends SingleResolveResponse {
  id: string
}

interface BatchResolveResponse {
  results: BatchResolveResult[]
}

type TestStatus = 'pending' | 'running' | 'passed' | 'failed' | 'error'

interface ResolverTestCase {
  id: string
  text: string
  route_hint?: RouteHint
  form_hint?: FormHint
  expectedResolved: boolean
  expectedRxcui?: string
  minConfidence?: number
  description: string
}

interface TestResult {
  status: TestStatus
  response?: SingleResolveResponse
  error?: string
  duration?: number
}

// ============ CONSTANTS ============

const API_BASE_URL = 'http://localhost:8080/medications'

const ROUTE_HINTS: RouteHint[] = ['', 'ORAL', 'IV', 'IM', 'SUBQ', 'TOPICAL', 'RECTAL', 'NASAL', 'INHALATION']
const FORM_HINTS: FormHint[] = ['', 'tablet', 'capsule', 'solution', 'cream', 'injection', 'patch', 'suppository']

// Default test cases from the API documentation
const DEFAULT_TESTS: ResolverTestCase[] = [
  {
    id: 'default-1',
    text: 'prednisone 20 mg oral tablet',
    expectedResolved: true,
    expectedRxcui: '312615',
    minConfidence: 0.70,
    description: 'Common corticosteroid - should resolve with high confidence',
  },
  {
    id: 'default-2',
    text: 'metformin 500 mg',
    route_hint: 'ORAL',
    expectedResolved: true,
    expectedRxcui: '861007',
    minConfidence: 0.70,
    description: 'Diabetes medication with route hint',
  },
  {
    id: 'default-3',
    text: 'lisinopril 10 mg tablet',
    expectedResolved: true,
    expectedRxcui: '314076',
    minConfidence: 0.70,
    description: 'ACE inhibitor - common blood pressure medication',
  },
  {
    id: 'default-4',
    text: 'aspirin 325 mg',
    expectedResolved: true,
    minConfidence: 0.70,
    description: 'Common OTC analgesic',
  },
  {
    id: 'default-5',
    text: 'amoxicillin 500 mg capsule',
    form_hint: 'capsule',
    expectedResolved: true,
    minConfidence: 0.70,
    description: 'Common antibiotic with form hint',
  },
  {
    id: 'default-6',
    text: 'omeprazole 20 mg',
    route_hint: 'ORAL',
    form_hint: 'capsule',
    expectedResolved: true,
    minConfidence: 0.70,
    description: 'PPI with both route and form hints',
  },
  {
    id: 'default-7',
    text: 'unknown xyz 999 mg',
    expectedResolved: false,
    description: 'Invalid medication - should not resolve',
  },
  {
    id: 'default-8',
    text: 'gibberish medication name',
    expectedResolved: false,
    description: 'Nonsense text - should return no_candidates',
  },
  // Brand name medication tests
  {
    id: 'brand-1',
    text: 'LORazepam 1 mg tablet (ATIVAN)',
    expectedResolved: true,
    minConfidence: 0.70,
    description: 'Benzodiazepine with brand name ATIVAN - tall man lettering',
  },
  {
    id: 'brand-2',
    text: 'LIPITOR 20 mg tablet',
    expectedResolved: true,
    minConfidence: 0.70,
    description: 'Atorvastatin brand name - common statin',
  },
  {
    id: 'brand-2b',
    text: 'atorvastatin 10 mg oral tablet',
    expectedResolved: true,
    expectedRxcui: '617312',
    minConfidence: 0.70,
    description: 'Generic atorvastatin - resolves to atorvastatin calcium 10 MG Oral Tablet',
  },
  {
    id: 'brand-3',
    text: 'Zoloft 50 mg tablet',
    expectedResolved: true,
    minConfidence: 0.70,
    description: 'Sertraline brand name - SSRI antidepressant',
  },
  {
    id: 'brand-4',
    text: 'NORVASC 5 mg tablet',
    expectedResolved: true,
    minConfidence: 0.70,
    description: 'Amlodipine brand name - calcium channel blocker',
  },
  {
    id: 'brand-5',
    text: 'Synthroid 100 mcg tablet',
    expectedResolved: true,
    minConfidence: 0.70,
    description: 'Levothyroxine brand name - thyroid medication',
  },
  // Tablet form type tests
  {
    id: 'tablet-1',
    text: 'ibuprofen 200 mg tablet',
    expectedResolved: true,
    minConfidence: 0.70,
    description: 'Common NSAID tablet - should resolve to tablet form',
  },
  {
    id: 'tablet-2',
    text: 'acetaminophen 500 mg tablet',
    expectedResolved: true,
    minConfidence: 0.70,
    description: 'Common analgesic tablet - should resolve to tablet form',
  },
  {
    id: 'tablet-3',
    text: 'gabapentin 300 mg tablet',
    expectedResolved: true,
    minConfidence: 0.70,
    description: 'Anticonvulsant - should prefer tablet over capsule',
  },
  // Liquid/solution form type tests
  {
    id: 'liquid-1',
    text: 'amoxicillin 50 mg/mL suspension',
    expectedResolved: true,
    minConfidence: 0.70,
    description: 'Antibiotic oral suspension - should resolve to liquid form',
  },
  {
    id: 'liquid-2',
    text: 'diphenhydramine 2.5 mg/mL liquid',
    expectedResolved: true,
    minConfidence: 0.70,
    description: 'Antihistamine liquid - should resolve to solution form',
  },
  {
    id: 'liquid-3',
    text: 'acetaminophen 32 mg/mL oral solution',
    expectedResolved: true,
    minConfidence: 0.70,
    description: 'Pediatric analgesic solution - should resolve to liquid form',
  },
]

// ============ API FUNCTIONS ============

async function resolveSingleMedication(request: SingleResolveRequest): Promise<SingleResolveResponse> {
  const response = await fetch(`${API_BASE_URL}/resolve-medication`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  return response.json()
}

async function resolveBatchMedications(request: BatchResolveRequest): Promise<BatchResolveResponse> {
  const response = await fetch(`${API_BASE_URL}/resolve-medications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  return response.json()
}

// ============ HELPER COMPONENTS ============

interface StatusBadgeProps {
  status: TestStatus
}

function StatusBadge({ status }: StatusBadgeProps) {
  const styles = {
    pending: 'bg-surface-100 text-surface-600',
    running: 'bg-primary-100 text-primary-700',
    passed: 'bg-success-100 text-success-700',
    failed: 'bg-danger-100 text-danger-700',
    error: 'bg-warning-100 text-warning-700',
  }

  const icons = {
    pending: (
      <div className="w-2 h-2 rounded-full bg-current opacity-50" />
    ),
    running: (
      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    ),
    passed: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    failed: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    error: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
      {icons[status]}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

interface ConfidenceMeterProps {
  confidence: number
}

function ConfidenceMeter({ confidence }: ConfidenceMeterProps) {
  const percentage = Math.round(confidence * 100)
  const color = confidence >= 0.7 ? 'bg-success-500' : confidence >= 0.5 ? 'bg-warning-500' : 'bg-danger-500'

  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-2 bg-surface-200 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${percentage}%` }} />
      </div>
      <span className="text-xs font-mono text-surface-600">{percentage}%</span>
    </div>
  )
}

// ============ MAIN COMPONENT ============

export const ResolverTestPanel = observer(function ResolverTestPanel() {
  // Test state
  const [testResults, setTestResults] = useState<Map<string, TestResult>>(new Map())
  const [customTests, setCustomTests] = useState<ResolverTestCase[]>([])
  const [isRunningAll, setIsRunningAll] = useState(false)

  // Single test input state
  const [singleText, setSingleText] = useState('lisinopril 10 mg tablet')
  const [singleRouteHint, setSingleRouteHint] = useState<RouteHint>('ORAL')
  const [singleFormHint, setSingleFormHint] = useState<FormHint>('tablet')
  const [singleDebug, setSingleDebug] = useState(true)
  const [singleAllowIngredient, setSingleAllowIngredient] = useState(false)
  const [singleResult, setSingleResult] = useState<SingleResolveResponse | null>(null)
  const [singleError, setSingleError] = useState<string | null>(null)
  const [singleLoading, setSingleLoading] = useState(false)
  const [singleDuration, setSingleDuration] = useState<number | null>(null)

  // Batch test input state
  const [batchItems, setBatchItems] = useState<BatchResolveItem[]>([
    { id: 'batch-1', text: 'prednisone 20 mg oral tablet' },
    { id: 'batch-2', text: 'metformin 500 mg', route_hint: 'ORAL' },
    { id: 'batch-3', text: 'lisinopril 10 mg tablet' },
  ])
  const [batchDebug, setBatchDebug] = useState(true)
  const [batchResult, setBatchResult] = useState<BatchResolveResponse | null>(null)
  const [batchError, setBatchError] = useState<string | null>(null)
  const [batchLoading, setBatchLoading] = useState(false)
  const [batchDuration, setBatchDuration] = useState<number | null>(null)

  // Custom test form state
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [customText, setCustomText] = useState('')
  const [customRouteHint, setCustomRouteHint] = useState<RouteHint>('')
  const [customFormHint, setCustomFormHint] = useState<FormHint>('')
  const [customExpectedResolved, setCustomExpectedResolved] = useState(true)
  const [customExpectedRxcui, setCustomExpectedRxcui] = useState('')
  const [customMinConfidence, setCustomMinConfidence] = useState('0.70')
  const [customDescription, setCustomDescription] = useState('')

  // Active tab for playground
  const [playgroundTab, setPlaygroundTab] = useState<'single' | 'batch'>('single')

  // Run a single test case
  const runTest = useCallback(async (test: ResolverTestCase) => {
    setTestResults((prev) => new Map(prev).set(test.id, { status: 'running' }))

    const startTime = performance.now()
    try {
      const response = await resolveSingleMedication({
        text: test.text,
        route_hint: test.route_hint || undefined,
        form_hint: test.form_hint || undefined,
        debug: true,
      })

      const duration = performance.now() - startTime

      // Validate the result
      let passed = true
      if (test.expectedResolved !== response.resolved) {
        passed = false
      }
      if (test.expectedRxcui && response.rxcui !== test.expectedRxcui) {
        passed = false
      }
      if (test.minConfidence && response.confidence && response.confidence < test.minConfidence) {
        passed = false
      }

      setTestResults((prev) =>
        new Map(prev).set(test.id, {
          status: passed ? 'passed' : 'failed',
          response,
          duration,
        })
      )

      console.log(`✅ Test "${test.text}":`, response)
    } catch (err) {
      const duration = performance.now() - startTime
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'

      setTestResults((prev) =>
        new Map(prev).set(test.id, {
          status: 'error',
          error: errorMsg,
          duration,
        })
      )

      console.error(`❌ Test "${test.text}" failed:`, errorMsg)
    }
  }, [])

  // Run all tests
  const runAllTests = useCallback(async () => {
    setIsRunningAll(true)
    const allTests = [...DEFAULT_TESTS, ...customTests]

    for (const test of allTests) {
      await runTest(test)
    }

    setIsRunningAll(false)
  }, [customTests, runTest])

  // Run single medication resolution
  const runSingleResolve = async () => {
    setSingleLoading(true)
    setSingleError(null)
    setSingleResult(null)
    setSingleDuration(null)

    const startTime = performance.now()
    try {
      const response = await resolveSingleMedication({
        text: singleText,
        route_hint: singleRouteHint || undefined,
        form_hint: singleFormHint || undefined,
        debug: singleDebug,
        allow_ingredient_only: singleAllowIngredient,
      })
      setSingleResult(response)
      setSingleDuration(performance.now() - startTime)
      console.log('Single resolve result:', response)
    } catch (err) {
      setSingleError(err instanceof Error ? err.message : 'Unknown error')
      setSingleDuration(performance.now() - startTime)
    } finally {
      setSingleLoading(false)
    }
  }

  // Run batch medication resolution
  const runBatchResolve = async () => {
    setBatchLoading(true)
    setBatchError(null)
    setBatchResult(null)
    setBatchDuration(null)

    const startTime = performance.now()
    try {
      const response = await resolveBatchMedications({
        items: batchItems,
        debug: batchDebug,
      })
      setBatchResult(response)
      setBatchDuration(performance.now() - startTime)
      console.log('Batch resolve result:', response)
    } catch (err) {
      setBatchError(err instanceof Error ? err.message : 'Unknown error')
      setBatchDuration(performance.now() - startTime)
    } finally {
      setBatchLoading(false)
    }
  }

  // Add custom test
  const addCustomTest = () => {
    if (!customText.trim()) return

    const newTest: ResolverTestCase = {
      id: `custom-${Date.now()}`,
      text: customText.trim(),
      route_hint: customRouteHint || undefined,
      form_hint: customFormHint || undefined,
      expectedResolved: customExpectedResolved,
      expectedRxcui: customExpectedRxcui.trim() || undefined,
      minConfidence: parseFloat(customMinConfidence) || undefined,
      description: customDescription.trim() || 'Custom test case',
    }

    setCustomTests((prev) => [...prev, newTest])

    // Reset form
    setCustomText('')
    setCustomRouteHint('')
    setCustomFormHint('')
    setCustomExpectedResolved(true)
    setCustomExpectedRxcui('')
    setCustomMinConfidence('0.70')
    setCustomDescription('')
    setShowCustomForm(false)
  }

  // Remove custom test
  const removeCustomTest = (testId: string) => {
    setCustomTests((prev) => prev.filter((t) => t.id !== testId))
    setTestResults((prev) => {
      const next = new Map(prev)
      next.delete(testId)
      return next
    })
  }

  // Add batch item
  const addBatchItem = () => {
    setBatchItems((prev) => [
      ...prev,
      { id: `batch-${Date.now()}`, text: '' },
    ])
  }

  // Remove batch item
  const removeBatchItem = (id: string) => {
    setBatchItems((prev) => prev.filter((item) => item.id !== id))
  }

  // Update batch item
  const updateBatchItem = (id: string, updates: Partial<BatchResolveItem>) => {
    setBatchItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    )
  }

  // Calculate stats
  const allTests = [...DEFAULT_TESTS, ...customTests]
  const passedCount = allTests.filter((t) => testResults.get(t.id)?.status === 'passed').length
  const failedCount = allTests.filter((t) => testResults.get(t.id)?.status === 'failed').length
  const errorCount = allTests.filter((t) => testResults.get(t.id)?.status === 'error').length
  const runCount = passedCount + failedCount + errorCount

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-surface-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-surface-800 flex items-center gap-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              RxNorm Resolver API Tester
            </h2>
            <p className="text-surface-500 mt-1">
              Test medication text resolution against the RxNorm Resolver API
            </p>
            <p className="text-xs text-surface-400 mt-1 font-mono">
              Base URL: {API_BASE_URL}
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-surface-800">{allTests.length}</div>
              <div className="text-xs text-surface-500">Total Tests</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success-600">{passedCount}</div>
              <div className="text-xs text-surface-500">Passed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-danger-600">{failedCount}</div>
              <div className="text-xs text-surface-500">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-warning-600">{errorCount}</div>
              <div className="text-xs text-surface-500">Errors</div>
            </div>
            <button
              onClick={runAllTests}
              disabled={isRunningAll}
              className="ml-4 px-6 py-3 bg-primary-500 text-white rounded-xl text-sm font-semibold hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center gap-2"
            >
              {isRunningAll ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Running...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Run All Tests
                </>
              )}
            </button>
          </div>
        </div>

        {/* Progress bar */}
        {runCount > 0 && (
          <div className="mt-4">
            <div className="h-2 bg-surface-100 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-success-500 transition-all"
                style={{ width: `${(passedCount / allTests.length) * 100}%` }}
              />
              <div
                className="h-full bg-danger-500 transition-all"
                style={{ width: `${(failedCount / allTests.length) * 100}%` }}
              />
              <div
                className="h-full bg-warning-500 transition-all"
                style={{ width: `${(errorCount / allTests.length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* API Playground */}
      <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 bg-surface-50 border-b border-surface-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg text-primary-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-surface-800">API Playground</h3>
              <p className="text-sm text-surface-500">Test the API endpoints directly</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPlaygroundTab('single')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                playgroundTab === 'single'
                  ? 'bg-primary-500 text-white'
                  : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
              }`}
            >
              Single
            </button>
            <button
              onClick={() => setPlaygroundTab('batch')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                playgroundTab === 'batch'
                  ? 'bg-primary-500 text-white'
                  : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
              }`}
            >
              Batch
            </button>
          </div>
        </div>

        <div className="p-5">
          {playgroundTab === 'single' ? (
            <div className="space-y-4">
              {/* Single Request Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-2">
                  <label className="block text-xs font-medium text-surface-600 mb-1">
                    Medication Text *
                  </label>
                  <input
                    type="text"
                    value={singleText}
                    onChange={(e) => setSingleText(e.target.value)}
                    placeholder="e.g., lisinopril 10 mg tablet"
                    className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-surface-600 mb-1">
                    Route Hint
                  </label>
                  <select
                    value={singleRouteHint}
                    onChange={(e) => setSingleRouteHint(e.target.value as RouteHint)}
                    className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {ROUTE_HINTS.map((hint) => (
                      <option key={hint || 'none'} value={hint}>
                        {hint || '(none)'}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-surface-600 mb-1">
                    Form Hint
                  </label>
                  <select
                    value={singleFormHint}
                    onChange={(e) => setSingleFormHint(e.target.value as FormHint)}
                    className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {FORM_HINTS.map((hint) => (
                      <option key={hint || 'none'} value={hint}>
                        {hint || '(none)'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={singleDebug}
                    onChange={(e) => setSingleDebug(e.target.checked)}
                    className="w-4 h-4 rounded border-surface-300 text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-sm text-surface-600">Debug mode (show top candidates)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={singleAllowIngredient}
                    onChange={(e) => setSingleAllowIngredient(e.target.checked)}
                    className="w-4 h-4 rounded border-surface-300 text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-sm text-surface-600">Allow ingredient-only fallback</span>
                </label>
                <button
                  onClick={runSingleResolve}
                  disabled={singleLoading || !singleText.trim()}
                  className="ml-auto px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {singleLoading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Resolving...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Resolve
                    </>
                  )}
                </button>
              </div>

              {/* Single Result */}
              {(singleResult || singleError) && (
                <div className="mt-4 p-4 bg-surface-50 rounded-lg border border-surface-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-surface-800">Result</h4>
                    {singleDuration && (
                      <span className="text-xs text-surface-500">{singleDuration.toFixed(0)}ms</span>
                    )}
                  </div>

                  {singleError ? (
                    <div className="text-danger-600 text-sm">{singleError}</div>
                  ) : singleResult && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            singleResult.resolved
                              ? 'bg-success-100 text-success-700'
                              : 'bg-danger-100 text-danger-700'
                          }`}
                        >
                          {singleResult.resolved ? 'Resolved' : 'Not Resolved'}
                        </span>
                        {singleResult.confidence !== undefined && (
                          <ConfidenceMeter confidence={singleResult.confidence} />
                        )}
                      </div>

                      {singleResult.resolved && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <span className="text-surface-500">RxCUI:</span>
                            <span className="ml-2 font-mono text-surface-800">{singleResult.rxcui}</span>
                          </div>
                          <div>
                            <span className="text-surface-500">Match Type:</span>
                            <span className="ml-2 font-mono text-surface-800">{singleResult.match_type}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-surface-500">Matched:</span>
                            <span className="ml-2 text-surface-800">{singleResult.matched_synonym}</span>
                          </div>
                        </div>
                      )}

                      {!singleResult.resolved && singleResult.reason && (
                        <div className="text-sm">
                          <span className="text-surface-500">Reason:</span>
                          <span className="ml-2 text-surface-800">{singleResult.reason}</span>
                        </div>
                      )}

                      {singleResult.top_candidates && singleResult.top_candidates.length > 0 && (
                        <div className="mt-3">
                          <h5 className="text-sm font-medium text-surface-600 mb-2">Top Candidates</h5>
                          <div className="space-y-2">
                            {singleResult.top_candidates.map((candidate, i) => (
                              <div
                                key={i}
                                className="flex items-center justify-between p-2 bg-white rounded border border-surface-100 text-sm"
                              >
                                <div className="flex items-center gap-3">
                                  <span className="text-surface-400 font-mono">#{i + 1}</span>
                                  <span className="font-mono text-primary-600">{candidate.rxcui}</span>
                                  <span className="px-1.5 py-0.5 bg-surface-100 rounded text-xs text-surface-600">
                                    {candidate.tty}
                                  </span>
                                  <span className="text-surface-700 truncate max-w-xs">{candidate.name}</span>
                                </div>
                                <span className="font-mono text-surface-600">
                                  {(candidate.score * 100).toFixed(1)}%
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Raw JSON */}
                      <details className="mt-3">
                        <summary className="text-xs text-surface-500 cursor-pointer hover:text-surface-700">
                          View Raw JSON
                        </summary>
                        <pre className="mt-2 p-3 bg-surface-800 text-surface-100 rounded-lg text-xs overflow-x-auto">
                          {JSON.stringify(singleResult, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Batch Request Form */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-surface-600">Batch Items</label>
                  <button
                    onClick={addBatchItem}
                    className="px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Item
                  </button>
                </div>

                {batchItems.map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <span className="text-xs text-surface-400 w-6">{idx + 1}.</span>
                    <input
                      type="text"
                      value={item.text}
                      onChange={(e) => updateBatchItem(item.id, { text: e.target.value })}
                      placeholder="Medication text..."
                      className="flex-1 px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <select
                      value={item.route_hint || ''}
                      onChange={(e) =>
                        updateBatchItem(item.id, { route_hint: (e.target.value as RouteHint) || undefined })
                      }
                      className="w-28 px-2 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {ROUTE_HINTS.map((hint) => (
                        <option key={hint || 'none'} value={hint}>
                          {hint || 'Route...'}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => removeBatchItem(item.id)}
                      className="p-2 text-surface-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={batchDebug}
                    onChange={(e) => setBatchDebug(e.target.checked)}
                    className="w-4 h-4 rounded border-surface-300 text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-sm text-surface-600">Debug mode</span>
                </label>
                <button
                  onClick={runBatchResolve}
                  disabled={batchLoading || batchItems.length === 0 || batchItems.every((i) => !i.text.trim())}
                  className="ml-auto px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {batchLoading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Resolving...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Resolve Batch
                    </>
                  )}
                </button>
              </div>

              {/* Batch Result */}
              {(batchResult || batchError) && (
                <div className="mt-4 p-4 bg-surface-50 rounded-lg border border-surface-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-surface-800">Results</h4>
                    {batchDuration && (
                      <span className="text-xs text-surface-500">{batchDuration.toFixed(0)}ms</span>
                    )}
                  </div>

                  {batchError ? (
                    <div className="text-danger-600 text-sm">{batchError}</div>
                  ) : batchResult && (
                    <div className="space-y-3">
                      {batchResult.results.map((result) => (
                        <div
                          key={result.id}
                          className={`p-3 rounded-lg border ${
                            result.resolved
                              ? 'bg-success-50 border-success-200'
                              : 'bg-danger-50 border-danger-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-xs text-surface-500">{result.id}</span>
                              <span
                                className={`px-2 py-0.5 rounded text-xs font-medium ${
                                  result.resolved
                                    ? 'bg-success-200 text-success-800'
                                    : 'bg-danger-200 text-danger-800'
                                }`}
                              >
                                {result.resolved ? 'Resolved' : 'Not Resolved'}
                              </span>
                              {result.rxcui && (
                                <span className="font-mono text-sm text-surface-700">
                                  RxCUI: {result.rxcui}
                                </span>
                              )}
                              {result.match_type && (
                                <span className="px-1.5 py-0.5 bg-surface-100 rounded text-xs text-surface-600">
                                  {result.match_type}
                                </span>
                              )}
                            </div>
                            {result.confidence !== undefined && (
                              <ConfidenceMeter confidence={result.confidence} />
                            )}
                          </div>
                          {result.matched_synonym && (
                            <p className="mt-1 text-sm text-surface-600">{result.matched_synonym}</p>
                          )}
                          {!result.resolved && result.reason && (
                            <p className="mt-1 text-sm text-surface-500">Reason: {result.reason}</p>
                          )}
                        </div>
                      ))}

                      {/* Raw JSON */}
                      <details className="mt-3">
                        <summary className="text-xs text-surface-500 cursor-pointer hover:text-surface-700">
                          View Raw JSON
                        </summary>
                        <pre className="mt-2 p-3 bg-surface-800 text-surface-100 rounded-lg text-xs overflow-x-auto">
                          {JSON.stringify(batchResult, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Default Tests */}
      <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 bg-surface-50 border-b border-surface-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg text-primary-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-surface-800">Default Test Cases</h3>
              <p className="text-sm text-surface-500">Standard tests from API documentation</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-success-600 font-medium">
              {DEFAULT_TESTS.filter((t) => testResults.get(t.id)?.status === 'passed').length} passed
            </span>
            <span className="text-surface-300">|</span>
            <span className="text-danger-600 font-medium">
              {DEFAULT_TESTS.filter((t) => testResults.get(t.id)?.status === 'failed').length} failed
            </span>
          </div>
        </div>

        <div className="divide-y divide-surface-100">
          {DEFAULT_TESTS.map((test) => {
            const result = testResults.get(test.id)
            return (
              <TestRow
                key={test.id}
                test={test}
                result={result}
                onRun={() => runTest(test)}
              />
            )
          })}
        </div>
      </div>

      {/* Custom Tests */}
      <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 bg-surface-50 border-b border-surface-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg text-primary-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-surface-800">Custom Test Cases</h3>
              <p className="text-sm text-surface-500">Add your own test cases</p>
            </div>
          </div>
          <button
            onClick={() => setShowCustomForm(!showCustomForm)}
            className="px-4 py-2 bg-surface-100 text-surface-700 rounded-lg text-sm font-medium hover:bg-surface-200 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Test
          </button>
        </div>

        {/* Add Custom Test Form */}
        {showCustomForm && (
          <div className="p-5 bg-primary-50 border-b border-primary-100">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <label className="block text-xs font-medium text-surface-600 mb-1">
                  Medication Text *
                </label>
                <input
                  type="text"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="e.g., atorvastatin 10 mg tablet"
                  className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-600 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  placeholder="Test description..."
                  className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-600 mb-1">
                  Route Hint
                </label>
                <select
                  value={customRouteHint}
                  onChange={(e) => setCustomRouteHint(e.target.value as RouteHint)}
                  className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {ROUTE_HINTS.map((hint) => (
                    <option key={hint || 'none'} value={hint}>
                      {hint || '(none)'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-600 mb-1">
                  Form Hint
                </label>
                <select
                  value={customFormHint}
                  onChange={(e) => setCustomFormHint(e.target.value as FormHint)}
                  className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {FORM_HINTS.map((hint) => (
                    <option key={hint || 'none'} value={hint}>
                      {hint || '(none)'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-600 mb-1">
                  Expected RxCUI (optional)
                </label>
                <input
                  type="text"
                  value={customExpectedRxcui}
                  onChange={(e) => setCustomExpectedRxcui(e.target.value)}
                  placeholder="e.g., 314076"
                  className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-600 mb-1">
                  Min Confidence
                </label>
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.05"
                  value={customMinConfidence}
                  onChange={(e) => setCustomMinConfidence(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer pb-2">
                  <input
                    type="checkbox"
                    checked={customExpectedResolved}
                    onChange={(e) => setCustomExpectedResolved(e.target.checked)}
                    className="w-4 h-4 rounded border-surface-300 text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-sm text-surface-600">Expected to resolve</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  setShowCustomForm(false)
                  setCustomText('')
                  setCustomDescription('')
                  setCustomRouteHint('')
                  setCustomFormHint('')
                  setCustomExpectedRxcui('')
                  setCustomMinConfidence('0.70')
                  setCustomExpectedResolved(true)
                }}
                className="px-4 py-2 text-sm text-surface-600 hover:text-surface-800"
              >
                Cancel
              </button>
              <button
                onClick={addCustomTest}
                disabled={!customText.trim()}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add Test
              </button>
            </div>
          </div>
        )}

        {/* Custom Tests List */}
        {customTests.length === 0 ? (
          <div className="p-8 text-center text-surface-500">
            <svg
              className="w-12 h-12 mx-auto mb-3 text-surface-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <p className="text-sm">No custom tests yet</p>
            <p className="text-xs text-surface-400 mt-1">Click "Add Test" to create a custom test case</p>
          </div>
        ) : (
          <div className="divide-y divide-surface-100">
            {customTests.map((test) => {
              const result = testResults.get(test.id)
              return (
                <TestRow
                  key={test.id}
                  test={test}
                  result={result}
                  onRun={() => runTest(test)}
                  onRemove={() => removeCustomTest(test.id)}
                  isCustom
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
})

// ============ TEST ROW COMPONENT ============

interface TestRowProps {
  test: ResolverTestCase
  result?: TestResult
  onRun: () => Promise<void>
  onRemove?: () => void
  isCustom?: boolean
}

function TestRow({ test, result, onRun, onRemove, isCustom }: TestRowProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="px-5 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <StatusBadge status={result?.status || 'pending'} />
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-surface-800">{test.text}</span>
              {test.route_hint && (
                <span className="text-xs px-1.5 py-0.5 bg-primary-100 text-primary-700 rounded">
                  {test.route_hint}
                </span>
              )}
              {test.form_hint && (
                <span className="text-xs px-1.5 py-0.5 bg-primary-100 text-primary-700 rounded">
                  {test.form_hint}
                </span>
              )}
              {test.expectedRxcui && (
                <span className="text-xs font-mono px-1.5 py-0.5 bg-surface-100 text-surface-600 rounded">
                  → {test.expectedRxcui}
                </span>
              )}
            </div>
            <p className="text-sm text-surface-500">{test.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {result?.duration && (
            <span className="text-xs text-surface-400">{result.duration.toFixed(0)}ms</span>
          )}
          {result && result.status !== 'pending' && result.status !== 'running' && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 text-surface-400 hover:text-surface-600 hover:bg-surface-100 rounded transition-colors"
            >
              <svg
                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
          <button
            onClick={onRun}
            disabled={result?.status === 'running'}
            className="px-3 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {result?.status === 'running' ? 'Running...' : 'Run'}
          </button>
          {isCustom && onRemove && (
            <button
              onClick={onRemove}
              className="p-1.5 text-surface-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
              title="Remove test"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && result && (
        <div className="mt-3 ml-24 p-3 bg-surface-50 rounded-lg">
          {result.error ? (
            <div className="text-sm text-danger-600">{result.error}</div>
          ) : result.response ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <span className="text-surface-500">Resolved:</span>
                  <span className={`ml-2 font-medium ${result.response.resolved ? 'text-success-600' : 'text-danger-600'}`}>
                    {result.response.resolved ? 'Yes' : 'No'}
                  </span>
                </div>
                {result.response.rxcui && (
                  <div>
                    <span className="text-surface-500">RxCUI:</span>
                    <span className="ml-2 font-mono text-surface-800">{result.response.rxcui}</span>
                  </div>
                )}
                {result.response.confidence !== undefined && (
                  <div>
                    <span className="text-surface-500">Confidence:</span>
                    <span className="ml-2 font-mono text-surface-800">
                      {(result.response.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                )}
                {result.response.match_type && (
                  <div>
                    <span className="text-surface-500">Match Type:</span>
                    <span className="ml-2 font-mono text-surface-800">{result.response.match_type}</span>
                  </div>
                )}
              </div>

              {result.response.matched_synonym && (
                <div className="text-sm">
                  <span className="text-surface-500">Matched:</span>
                  <span className="ml-2 text-surface-800">{result.response.matched_synonym}</span>
                </div>
              )}

              {!result.response.resolved && result.response.reason && (
                <div className="text-sm">
                  <span className="text-surface-500">Reason:</span>
                  <span className="ml-2 text-surface-800">{result.response.reason}</span>
                </div>
              )}

              {result.response.top_candidates && result.response.top_candidates.length > 0 && (
                <div className="mt-2">
                  <h5 className="text-xs font-medium text-surface-600 mb-1">Top Candidates</h5>
                  <div className="space-y-1">
                    {result.response.top_candidates.map((candidate, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-xs p-1.5 bg-white rounded border border-surface-100"
                      >
                        <span className="text-surface-400">#{i + 1}</span>
                        <span className="font-mono text-primary-600">{candidate.rxcui}</span>
                        <span className="px-1 bg-surface-100 rounded text-surface-600">{candidate.tty}</span>
                        <span className="text-surface-700 truncate flex-1">{candidate.name}</span>
                        <span className="font-mono text-surface-500">{(candidate.score * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Validation Summary */}
              <div className="mt-2 pt-2 border-t border-surface-200">
                <h5 className="text-xs font-medium text-surface-600 mb-1">Test Validation</h5>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className={test.expectedResolved === result.response.resolved ? 'text-success-600' : 'text-danger-600'}>
                      {test.expectedResolved === result.response.resolved ? '✓' : '✗'}
                    </span>
                    <span className="text-surface-600">
                      Expected resolved: {test.expectedResolved ? 'true' : 'false'}
                    </span>
                  </div>
                  {test.expectedRxcui && (
                    <div className="flex items-center gap-2">
                      <span className={result.response.rxcui === test.expectedRxcui ? 'text-success-600' : 'text-danger-600'}>
                        {result.response.rxcui === test.expectedRxcui ? '✓' : '✗'}
                      </span>
                      <span className="text-surface-600">Expected RxCUI: {test.expectedRxcui}</span>
                    </div>
                  )}
                  {test.minConfidence && (
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          result.response.confidence && result.response.confidence >= test.minConfidence
                            ? 'text-success-600'
                            : 'text-danger-600'
                        }
                      >
                        {result.response.confidence && result.response.confidence >= test.minConfidence ? '✓' : '✗'}
                      </span>
                      <span className="text-surface-600">
                        Min confidence: {(test.minConfidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-surface-500">No response data</div>
          )}
        </div>
      )}
    </div>
  )
}


