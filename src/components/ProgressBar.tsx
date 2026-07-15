import { formatPercent } from '../lib/format'

/**
 * Thin progress bar with an expected-progress tick (Viva Goals pattern).
 * Fill is always the accent hue — status is carried by chips, never by the bar.
 */
export function ProgressBar({
  value,
  expected,
  className = '',
}: {
  /** 0-1 fraction */
  value: number
  /** 0-1 fraction; renders a tick mark when provided */
  expected?: number
  className?: string
}) {
  const pct = Math.min(1, Math.max(0, value)) * 100
  const expectedPct = expected !== undefined ? Math.min(1, Math.max(0, expected)) * 100 : undefined
  return (
    <div className={`relative h-2 w-full rounded-[4px] bg-accent-wash ${className}`}>
      <div
        className="absolute inset-y-0 left-0 rounded-l-[4px] bg-accent"
        style={{ width: `${pct}%`, borderTopRightRadius: 4, borderBottomRightRadius: 4 }}
      />
      {expectedPct !== undefined && expectedPct > 0 && (
        <div
          className="absolute -inset-y-1 w-0.5 rounded-full bg-ink-muted"
          style={{ left: `calc(${expectedPct}% - 1px)` }}
          title={`Expected by today: ${formatPercent(expected!)}`}
        />
      )}
    </div>
  )
}

export function ProgressWithLabel({
  value,
  expected,
  className = '',
}: {
  value: number
  expected?: number
  className?: string
}) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <ProgressBar value={value} expected={expected} className="flex-1" />
      <span className="w-9 shrink-0 text-right text-xs font-semibold text-ink tabular-nums">
        {formatPercent(value)}
      </span>
    </div>
  )
}
