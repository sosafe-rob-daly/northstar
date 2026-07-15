import { useState } from 'react'
import { PencilLine, Clock } from 'lucide-react'
import { useOkrStore } from '../store/store'
import type { Cycle, KeyResult } from '../lib/types'
import { krProgress, krStatus, expectedProgress, daysSinceCheckIn } from '../lib/progress'
import { checkInsForKr } from '../lib/selectors'
import { formatKrValue } from '../lib/format'
import { StatusChip } from './StatusChip'
import { ProgressWithLabel } from './ProgressBar'
import { CheckInForm } from './CheckInForm'

/** Compact KR row: title, owner, progress vs expected, status, quick check-in. */
export function KrRow({ kr, cycle, readonly = false }: { kr: KeyResult; cycle: Cycle; readonly?: boolean }) {
  const checkIns = useOkrStore((s) => s.checkIns)
  const people = useOkrStore((s) => s.people)
  const settings = useOkrStore((s) => s.settings)
  const [checkingIn, setCheckingIn] = useState(false)

  const history = checkInsForKr(checkIns, kr.id)
  const progress = krProgress(kr)
  const expected = cycle.status === 'open' ? expectedProgress(cycle) : undefined
  const status = krStatus(kr, history, cycle, settings)
  const owner = people.find((p) => p.id === kr.ownerId)
  const staleDays = daysSinceCheckIn(history)
  const isStaleKr = cycle.status === 'open' && !readonly && staleDays > settings.staleDays

  return (
    <div className="py-2">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm text-ink">{kr.title}</p>
            {isStaleKr && (
              <span
                className="inline-flex shrink-0 items-center gap-1 rounded-md bg-black/5 px-1.5 py-0.5 text-[11px] font-medium text-ink-secondary"
                title="No check-in within the staleness window"
              >
                <Clock size={11} />
                {Number.isFinite(staleDays) ? `${staleDays}d ago` : 'never updated'}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-ink-muted">
            {formatKrValue(kr, kr.currentValue)} of {formatKrValue(kr, kr.targetValue)}
            {owner ? ` · ${owner.name}` : ''}
          </p>
        </div>
        <ProgressWithLabel value={progress} expected={expected} className="w-44 shrink-0" />
        <StatusChip status={status} small />
        {!readonly && cycle.status === 'open' && (
          <button
            type="button"
            onClick={() => setCheckingIn((v) => !v)}
            className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-accent-strong hover:bg-accent-wash/50"
          >
            <PencilLine size={13} />
            Check in
          </button>
        )}
      </div>
      {checkingIn && (
        <div className="mt-2">
          <CheckInForm kr={kr} defaultStatus={status} onDone={() => setCheckingIn(false)} />
        </div>
      )}
    </div>
  )
}
