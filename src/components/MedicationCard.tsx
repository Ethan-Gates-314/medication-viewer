/**
 * MedicationCard Component
 * Individual medication summary card for the grid view
 */

import { observer } from 'mobx-react-lite'
import type { MedicationDocument } from '../types/medication'
import { DataSourceBadge } from './DataSourceBadge'
import { medicationViewerStore } from '../stores/MedicationViewerStore'
import { cleanMedicationName } from '../utils/formatters'

interface MedicationCardProps {
  medication: MedicationDocument
  index?: number
}

export const MedicationCard = observer(function MedicationCard({
  medication,
  index = 0,
}: MedicationCardProps) {
  const store = medicationViewerStore
  const isUnmatched = medication.rxcui.startsWith('UNMATCHED_')
  const isLiquid = medication.conversion_values.is_liquid

  // Format price
  const formatPrice = (price: number) => {
    if (price === 0) return '—'
    return `$${price.toFixed(2)}`
  }

  // Format strength
  const formatStrength = () => {
    const { strength_val, strength_unit } = medication.conversion_values
    if (!strength_val || !strength_unit) return null
    return `${strength_val} ${strength_unit}`
  }

  // Stagger class for animation
  const staggerClass = `stagger-${(index % 6) + 1}`

  return (
    <div
      onClick={() => store.openDetailModal(medication)}
      className={`
        medication-card fade-in ${staggerClass}
        bg-white rounded-xl border border-surface-200 p-4
        cursor-pointer hover:border-primary-300
        ${isUnmatched ? 'border-l-4 border-l-warning-400' : ''}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-surface-800 leading-tight">
            {cleanMedicationName(medication.name)}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-mono text-surface-500">{medication.rxcui}</span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-surface-100 text-surface-600">
              {medication.tty}
            </span>
          </div>
        </div>
        <span className="text-lg" title={isLiquid ? 'Liquid' : 'Solid'}>
          {isLiquid ? '💧' : '💊'}
        </span>
      </div>

      {/* Pricing */}
      <div className="grid grid-cols-3 gap-2 mb-3 p-2 bg-surface-50 rounded-lg">
        <div className="text-center">
          <div className="text-[10px] uppercase text-surface-400 font-medium">Min</div>
          <div className="text-sm font-semibold text-surface-700">
            {formatPrice(medication.pricing_stats.min_unit_price)}
          </div>
        </div>
        <div className="text-center border-x border-surface-200">
          <div className="text-[10px] uppercase text-surface-400 font-medium">Median</div>
          <div className="text-sm font-semibold text-primary-600">
            {formatPrice(medication.pricing_stats.median_unit_price)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-[10px] uppercase text-surface-400 font-medium">Max</div>
          <div className="text-sm font-semibold text-surface-700">
            {formatPrice(medication.pricing_stats.max_unit_price)}
          </div>
        </div>
      </div>

      {/* Details Row */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {/* NDC Count */}
          <span className="flex items-center gap-1 text-surface-500">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
            {medication.ndc_links.ndc11_all.length} NDCs
          </span>

          {/* Pricing Unit */}
          <span className="text-surface-400">
            per {medication.pricing_stats.pricing_unit}
          </span>
        </div>

        {/* Data Source Badge */}
        <DataSourceBadge source={medication.conversion_values.data_source} />
      </div>

      {/* Strength (if available) */}
      {formatStrength() && (
        <div className="mt-2 pt-2 border-t border-surface-100">
          <span className="text-xs text-surface-500">
            Strength: <span className="font-medium text-surface-700">{formatStrength()}</span>
          </span>
        </div>
      )}

      {/* Ingredient (if available) */}
      {medication.classification.ingredient_name && (
        <div className="mt-1">
          <span className="text-xs text-surface-400 truncate block">
            {medication.classification.ingredient_name}
          </span>
        </div>
      )}
    </div>
  )
})

