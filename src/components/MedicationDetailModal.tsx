/**
 * MedicationDetailModal Component
 * Full detail view with tabs for structured data and raw JSON
 */

import { useState, useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { medicationViewerStore } from '../stores/MedicationViewerStore'
import { DataSourceBadge } from './DataSourceBadge'
import { JsonViewer } from './JsonViewer'
import { cleanMedicationName } from '../utils/formatters'
import type { MedicationDocument, Exemplar } from '../types/medication'

type Tab = 'details' | 'json'

interface SectionProps {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}

function Section({ title, icon, children }: SectionProps) {
  return (
    <div className="bg-white rounded-lg border border-surface-200 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-surface-50 border-b border-surface-200">
        {icon}
        <h4 className="font-semibold text-surface-700">{title}</h4>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

interface DetailRowProps {
  label: string
  value: React.ReactNode
  mono?: boolean
}

function DetailRow({ label, value, mono = false }: DetailRowProps) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-surface-100 last:border-0">
      <span className="text-sm text-surface-500">{label}</span>
      <span className={`text-sm text-surface-800 ${mono ? 'font-mono' : ''}`}>
        {value ?? '—'}
      </span>
    </div>
  )
}

function ExemplarCard({ exemplar }: { exemplar: Exemplar }) {
  const reasonColors: Record<string, string> = {
    min: 'bg-success-100 text-success-700',
    median: 'bg-primary-100 text-primary-700',
    max: 'bg-warning-100 text-warning-700',
  }

  const formatPrice = (price: number | undefined | null): string => {
    if (price === undefined || price === null) return '—'
    return `$${price.toFixed(4)}`
  }

  return (
    <div className="bg-surface-50 rounded-lg p-3 border border-surface-200">
      <div className="flex items-start justify-between mb-2">
        <span className="font-mono text-sm text-surface-700">{exemplar.ndc11 ?? '—'}</span>
        <span className={`text-xs px-2 py-0.5 rounded font-medium ${reasonColors[exemplar.reason_selected] ?? 'bg-surface-100 text-surface-600'}`}>
          {exemplar.reason_selected?.toUpperCase() ?? 'N/A'}
        </span>
      </div>
      <p className="text-xs text-surface-600 mb-2 line-clamp-2">{exemplar.ndc_description ?? 'No description'}</p>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-surface-400">Unit Price:</span>{' '}
          <span className="font-semibold">{formatPrice(exemplar.unit_price)}</span>
        </div>
        <div>
          <span className="text-surface-400">NADAC:</span>{' '}
          <span className="font-semibold">{formatPrice(exemplar.nadac_per_unit)}</span>
        </div>
      </div>
    </div>
  )
}

export const MedicationDetailModal = observer(function MedicationDetailModal() {
  const store = medicationViewerStore
  const [activeTab, setActiveTab] = useState<Tab>('details')
  const medication = store.selectedMedication

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && store.isDetailModalOpen) {
        store.closeDetailModal()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [store])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (store.isDetailModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [store.isDetailModalOpen])

  if (!store.isDetailModalOpen || !medication) return null

  const isUnmatched = medication.rxcui.startsWith('UNMATCHED_')
  const isLiquid = medication.conversion_values.is_liquid

  const renderDetailsTab = (med: MedicationDocument) => (
    <div className="space-y-4">
      {/* Pricing Section */}
      <Section
        title="Pricing"
        icon={
          <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      >
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-success-50 rounded-lg">
            <div className="text-xs text-success-600 font-medium mb-1">Minimum</div>
            <div className="text-xl font-bold text-success-700">
              ${med.pricing_stats.min_unit_price.toFixed(2)}
            </div>
          </div>
          <div className="text-center p-3 bg-primary-50 rounded-lg">
            <div className="text-xs text-primary-600 font-medium mb-1">Median</div>
            <div className="text-xl font-bold text-primary-700">
              ${med.pricing_stats.median_unit_price.toFixed(2)}
            </div>
          </div>
          <div className="text-center p-3 bg-warning-50 rounded-lg">
            <div className="text-xs text-warning-600 font-medium mb-1">Maximum</div>
            <div className="text-xl font-bold text-warning-700">
              ${med.pricing_stats.max_unit_price.toFixed(2)}
            </div>
          </div>
        </div>
        <DetailRow label="Pricing Unit" value={med.pricing_stats.pricing_unit} />
        <DetailRow label="Price per ML" value={med.pricing_stats.price_per_ml?.toFixed(4)} mono />
        <DetailRow label="Price per MG" value={med.pricing_stats.price_per_mg?.toFixed(4)} mono />
        <DetailRow label="NDC Count" value={med.pricing_stats.ndc_count} />
      </Section>

      {/* Conversion Values Section */}
      <Section
        title="Conversion Values"
        icon={
          <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        }
      >
        <DetailRow label="Form" value={isLiquid ? '💧 Liquid' : '💊 Solid'} />
        <DetailRow label="Package Size" value={med.conversion_values.package_size} mono />
        <DetailRow label="Package Unit" value={med.conversion_values.package_unit} />
        <DetailRow label="Strength Value" value={med.conversion_values.strength_val} mono />
        <DetailRow label="Strength Unit" value={med.conversion_values.strength_unit} />
        <DetailRow label="SCDC RxCUI" value={med.conversion_values.scdc_rxcui} mono />
        <DetailRow
          label="Data Source"
          value={<DataSourceBadge source={med.conversion_values.data_source} size="md" />}
        />
      </Section>

      {/* NDC Links Section */}
      <Section
        title="NDC Links"
        icon={
          <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        }
      >
        <div className="mb-3">
          <span className="text-sm font-medium text-surface-700">
            {med.ndc_links.ndc11_all.length} Total NDCs
          </span>
          {med.ndc_links.ndc11_preferred.length > 0 && (
            <span className="text-sm text-surface-500 ml-2">
              ({med.ndc_links.ndc11_preferred.length} preferred)
            </span>
          )}
        </div>
        {med.ndc_links.ndc11_all.length > 0 ? (
          <div className="max-h-40 overflow-y-auto bg-surface-50 rounded-lg p-2">
            <div className="flex flex-wrap gap-1">
              {med.ndc_links.ndc11_all.slice(0, 50).map((ndc) => (
                <span
                  key={ndc}
                  className={`
                    font-mono text-xs px-2 py-1 rounded
                    ${
                      med.ndc_links.ndc11_preferred.includes(ndc)
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-white text-surface-600 border border-surface-200'
                    }
                  `}
                >
                  {ndc}
                </span>
              ))}
              {med.ndc_links.ndc11_all.length > 50 && (
                <span className="text-xs text-surface-500 px-2 py-1">
                  +{med.ndc_links.ndc11_all.length - 50} more
                </span>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-surface-500">No NDCs linked</p>
        )}
      </Section>

      {/* Exemplars Section */}
      {med.exemplars.length > 0 && (
        <Section
          title="Exemplars"
          icon={
            <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {med.exemplars.map((ex, i) => (
              <ExemplarCard key={i} exemplar={ex} />
            ))}
          </div>
        </Section>
      )}

      {/* Classification Section */}
      <Section
        title="Classification"
        icon={
          <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        }
      >
        <DetailRow label="Ingredient Name" value={med.classification.ingredient_name} />
        <DetailRow label="Ingredient RxCUI" value={med.classification.ingredient_rxcui} mono />
        <DetailRow
          label="ATC Codes"
          value={
            med.classification.atc_codes.length > 0
              ? med.classification.atc_codes.join(', ')
              : null
          }
          mono
        />
      </Section>

      {/* Dataset Versions Section */}
      <Section
        title="Dataset Versions"
        icon={
          <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        }
      >
        <DetailRow label="NADAC Week" value={med.dataset_versions.nadac_week} />
        <DetailRow label="RxNorm Version" value={med.dataset_versions.rxnorm_version} />
        <DetailRow label="FDA Date" value={med.dataset_versions.fda_date} />
      </Section>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-surface-900/50 backdrop-blur"
        onClick={() => store.closeDetailModal()}
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl mx-4 my-8 bg-surface-50 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-surface-200 px-6 py-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{isLiquid ? '💧' : '💊'}</span>
                <h2 className="text-xl font-bold text-surface-800 truncate">
                  {cleanMedicationName(medication.name)}
                </h2>
                {isUnmatched && (
                  <span className="px-2 py-0.5 bg-warning-100 text-warning-700 text-xs font-medium rounded">
                    Unmatched
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm text-surface-500">
                <span className="font-mono">{medication.rxcui}</span>
                <span className="px-2 py-0.5 bg-surface-100 rounded">{medication.tty}</span>
                <DataSourceBadge source={medication.conversion_values.data_source} size="md" />
              </div>
            </div>
            <button
              onClick={() => store.closeDetailModal()}
              className="p-2 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4">
            <button
              onClick={() => setActiveTab('details')}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${
                  activeTab === 'details'
                    ? 'bg-primary-500 text-white'
                    : 'text-surface-600 hover:bg-surface-100'
                }
              `}
            >
              📋 Details
            </button>
            <button
              onClick={() => setActiveTab('json')}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${
                  activeTab === 'json'
                    ? 'bg-primary-500 text-white'
                    : 'text-surface-600 hover:bg-surface-100'
                }
              `}
            >
              {'{ }'} Raw JSON
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'details' ? (
            renderDetailsTab(medication)
          ) : (
            <JsonViewer data={medication} />
          )}
        </div>
      </div>
    </div>
  )
})

