import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { CheckCheck, PencilLine } from 'lucide-react'
import { useOkrStore } from '../store/store'
import { useSelectedCycle } from '../lib/useSelectedCycle'
import { krProgress, krStatus, daysSinceCheckIn, latestCheckIn } from '../lib/progress'
import { checkInsForKr } from '../lib/selectors'
import { formatKrValue } from '../lib/format'
import { Card, EmptyState } from '../components/ui'
import { StatusChip } from '../components/StatusChip'
import { ProgressWithLabel } from '../components/ProgressBar'
import { CheckInForm } from '../components/CheckInForm'

/**
 * The weekly ritual surface (Viva Goals' bulk check-in / Tability's focus
 * page): every active KR in the cycle, stalest first, with inline updates.
 */
export function CheckInPage() {
  const { objectives, keyResults, checkIns, people, settings } = useOkrStore()
  const cycle = useSelectedCycle()
  const [openKrId, setOpenKrId] = useState<string | null>(null)

  const groups = useMemo(() => {
    if (!cycle) return []
    return objectives
      .filter((o) => o.cycleId === cycle.id && o.lifecycle === 'active')
      .map((o) => ({
        objective: o,
        krs: keyResults
          .filter((k) => k.objectiveId === o.id)
          .map((kr) => ({
            kr,
            history: checkInsForKr(checkIns, kr.id),
            staleDays: daysSinceCheckIn(checkInsForKr(checkIns, kr.id)),
          }))
          .sort((a, b) => b.staleDays - a.staleDays),
      }))
      .filter((g) => g.krs.length > 0)
      .sort(
        (a, b) =>
          Math.max(...b.krs.map((k) => k.staleDays)) - Math.max(...a.krs.map((k) => k.staleDays)),
      )
  }, [objectives, keyResults, checkIns, cycle])

  if (!cycle) return <EmptyState title="No cycles yet" hint="Create one in Settings." />
  if (cycle.status === 'closed') {
    return (
      <EmptyState
        title={`${cycle.name} is closed`}
        hint="Switch to an open cycle to make check-ins."
      />
    )
  }

  const allKrs = groups.flatMap((g) => g.krs)
  const staleCount = allKrs.filter((k) => k.staleDays > settings.staleDays).length
  const freshCount = allKrs.length - staleCount

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-ink">Weekly check-in</h1>
        <p className="mt-0.5 text-sm text-ink-secondary">
          {staleCount === 0 ? (
            <span className="inline-flex items-center gap-1.5 font-medium text-status-good-text">
              <CheckCheck size={15} /> Everything is fresh — all {allKrs.length} key results updated
              within {settings.staleDays} days.
            </span>
          ) : (
            <>
              <span className="font-semibold text-ink">{staleCount}</span> of {allKrs.length} key
              results need an update ({freshCount} fresh). New value + status + note — that's the
              whole ritual.
            </>
          )}
        </p>
      </div>

      {groups.map(({ objective, krs }) => (
        <Card key={objective.id}>
          <div className="border-b border-grid px-4 py-2.5">
            <Link
              to={`/objectives/${objective.id}`}
              className="text-sm font-semibold text-ink hover:text-accent-strong hover:underline"
            >
              {objective.title}
            </Link>
          </div>
          <div className="divide-y divide-grid px-4">
            {krs.map(({ kr, history, staleDays }) => {
              const status = krStatus(kr, history, cycle, settings)
              const latest = latestCheckIn(history)
              const isStale = staleDays > settings.staleDays
              const authorOfLatest = latest && people.find((p) => p.id === latest.authorId)
              return (
                <div key={kr.id} className="py-2.5">
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-ink">{kr.title}</p>
                      <p className="mt-0.5 text-xs text-ink-muted">
                        {formatKrValue(kr, kr.currentValue)} of {formatKrValue(kr, kr.targetValue)}
                        {latest ? (
                          <>
                            {' '}· last update{' '}
                            {formatDistanceToNow(parseISO(latest.createdAt), { addSuffix: true })}
                            {authorOfLatest ? ` by ${authorOfLatest.name}` : ''}
                          </>
                        ) : (
                          ' · never updated'
                        )}
                      </p>
                    </div>
                    <ProgressWithLabel value={krProgress(kr)} className="w-40 shrink-0" />
                    <StatusChip status={status} small />
                    <button
                      type="button"
                      onClick={() => setOpenKrId((v) => (v === kr.id ? null : kr.id))}
                      className={`inline-flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                        isStale
                          ? 'bg-accent text-white hover:bg-accent-strong'
                          : 'text-accent-strong hover:bg-accent-wash/50'
                      }`}
                    >
                      <PencilLine size={13} />
                      {openKrId === kr.id ? 'Close' : 'Update'}
                    </button>
                  </div>
                  {openKrId === kr.id && (
                    <div className="mt-2">
                      <CheckInForm kr={kr} defaultStatus={status} onDone={() => setOpenKrId(null)} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      ))}
      {groups.length === 0 && (
        <EmptyState title="Nothing to check in" hint="No active objectives with key results in this cycle." />
      )}
    </div>
  )
}
