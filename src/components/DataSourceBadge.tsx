/**
 * DataSourceBadge Component
 * Colored badge indicating the data source for strength values
 */

import type { StrengthDataSource } from '../types/medication'
import { STRENGTH_DATA_SOURCE } from '../types/medication'

interface DataSourceBadgeProps {
  source: StrengthDataSource
  size?: 'sm' | 'md'
}

export function DataSourceBadge({ source, size = 'sm' }: DataSourceBadgeProps) {
  const config: Record<
    StrengthDataSource,
    { bg: string; text: string; label: string; tooltip: string }
  > = {
    [STRENGTH_DATA_SOURCE.RXNSAT]: {
      bg: 'bg-source-rxnsat/15',
      text: 'text-source-rxnsat',
      label: 'RXNSAT',
      tooltip: 'Best source - RxNorm attributes',
    },
    [STRENGTH_DATA_SOURCE.RXNREL]: {
      bg: 'bg-source-rxnrel/15',
      text: 'text-source-rxnrel',
      label: 'RXNREL',
      tooltip: 'Good source - RxNorm relationships',
    },
    [STRENGTH_DATA_SOURCE.FDA]: {
      bg: 'bg-source-fda/15',
      text: 'text-source-fda',
      label: 'FDA',
      tooltip: 'Good source - FDA NDC data',
    },
    [STRENGTH_DATA_SOURCE.REGEX]: {
      bg: 'bg-warning-100',
      text: 'text-warning-700',
      label: 'REGEX',
      tooltip: 'Fallback - extracted via regex',
    },
    [STRENGTH_DATA_SOURCE.UNKNOWN]: {
      bg: 'bg-surface-100',
      text: 'text-surface-500',
      label: 'UNK',
      tooltip: 'Unknown source',
    },
  }

  const { bg, text, label, tooltip } = config[source] || config[STRENGTH_DATA_SOURCE.UNKNOWN]

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[10px]',
    md: 'px-2 py-1 text-xs',
  }

  return (
    <span
      className={`
        inline-flex items-center font-mono font-medium rounded
        ${bg} ${text} ${sizeClasses[size]}
      `}
      title={tooltip}
    >
      {label}
    </span>
  )
}

