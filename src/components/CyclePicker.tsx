import { format, parseISO } from 'date-fns'
import { useOkrStore } from '../store/store'
import { useSelectedCycle } from '../lib/useSelectedCycle'
import { CYCLE_GROUPS } from '../lib/cycles'
import { expectedProgress } from '../lib/progress'
import { formatPercent } from '../lib/format'

export function CyclePicker() {
  const cycles = useOkrStore((s) => s.cycles)
  const setSelectedCycle = useOkrStore((s) => s.setSelectedCycle)
  const cycle = useSelectedCycle()
  if (!cycle) return <div />

  const sorted = [...cycles].sort((a, b) => (a.startDate < b.startDate ? 1 : -1))
  const groups = CYCLE_GROUPS.map((g) => ({
    ...g,
    cycles: sorted.filter((c) => c.type === g.type),
  })).filter((g) => g.cycles.length > 0)
  const elapsed = expectedProgress(cycle)

  return (
    <div className="flex items-center gap-3">
      <select
        value={cycle.id}
        onChange={(e) => setSelectedCycle(e.target.value)}
        className="rounded-lg border border-baseline bg-surface px-2.5 py-1.5 text-sm font-medium text-ink focus:border-accent focus:outline-none"
        aria-label="Cycle"
      >
        {groups.map((group) => (
          <optgroup key={group.type} label={group.label}>
            {group.cycles.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.status === 'closed' ? ' (closed)' : ''}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <span className="text-xs text-ink-muted">
        {format(parseISO(cycle.startDate), 'MMM d')} – {format(parseISO(cycle.endDate), 'MMM d, yyyy')}
        {cycle.status === 'open' && <> · {formatPercent(elapsed)} elapsed</>}
      </span>
    </div>
  )
}
