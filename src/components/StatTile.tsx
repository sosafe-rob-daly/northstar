import type { ReactNode } from 'react'
import { Card } from './ui'

/**
 * Stat tile per the dataviz figure contract: label, semibold proportional
 * value, optional signed delta colored by direction x whether up is good.
 */
export function StatTile({
  label,
  value,
  delta,
  deltaGood,
  sub,
}: {
  label: string
  value: string
  delta?: string
  /** Whether the delta represents a good direction */
  deltaGood?: boolean
  sub?: ReactNode
}) {
  return (
    <Card className="px-4 py-3.5">
      <p className="text-xs font-medium text-ink-secondary">{label}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-ink">{value}</span>
        {delta && (
          <span
            className="text-xs font-semibold"
            style={{
              color: deltaGood
                ? 'var(--color-status-good-text)'
                : 'var(--color-status-critical)',
            }}
          >
            {delta}
          </span>
        )}
      </div>
      {sub && <p className="mt-0.5 text-xs text-ink-muted">{sub}</p>}
    </Card>
  )
}
