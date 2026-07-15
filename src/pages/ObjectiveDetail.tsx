import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { format, formatDistanceToNow, parseISO } from 'date-fns'
import {
  ArrowLeft,
  CircleCheck,
  Flag,
  OctagonAlert,
  PencilLine,
  Plus,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import { useOkrStore } from '../store/store'
import type { KeyResult, ObjectiveLifecycle } from '../lib/types'
import {
  krProgress,
  krStatus,
  expectedProgress,
  daysSinceCheckIn,
  scoreBand,
} from '../lib/progress'
import { checkInsForKr, computeObjective, initials } from '../lib/selectors'
import { formatKrValue, formatPercent, formatScore } from '../lib/format'
import { Badge, Button, Card, EmptyState, inputClass } from '../components/ui'
import { StatusChip, LifecycleChip, statusLabel } from '../components/StatusChip'
import { ProgressBar, ProgressWithLabel } from '../components/ProgressBar'
import { Sparkline } from '../components/Sparkline'
import { CheckInForm } from '../components/CheckInForm'
import { ObjectiveForm } from '../components/ObjectiveForm'
import { CloseObjectiveModal } from '../components/CloseObjectiveModal'
import { KrEditModal } from '../components/KrEditModal'

const LEVEL_LABEL = { company: 'Company', team: 'Team', individual: 'Individual' } as const
const BAND_COLOR = {
  green: 'var(--color-status-good-text)',
  amber: '#8a5a00',
  red: 'var(--color-status-critical)',
} as const

export function ObjectiveDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const store = useOkrStore()
  const { objectives, keyResults, checkIns, cycles, people, teams, settings } = store
  const [editing, setEditing] = useState(false)
  const [closing, setClosing] = useState(false)

  const objective = objectives.find((o) => o.id === id)
  const cycle = cycles.find((c) => c.id === objective?.cycleId)

  const computed = useMemo(
    () =>
      objective && cycle
        ? computeObjective(objective, objectives, keyResults, checkIns, cycle, settings)
        : undefined,
    [objective, cycle, objectives, keyResults, checkIns, settings],
  )

  if (!objective || !cycle || !computed) {
    return <EmptyState title="Objective not found" hint="It may have been deleted." />
  }

  const krs = keyResults.filter((k) => k.objectiveId === objective.id)
  const children = objectives.filter((o) => o.parentId === objective.id)
  const parent = objectives.find((o) => o.id === objective.parentId)
  const owner = people.find((p) => p.id === objective.ownerId)
  const team = teams.find((t) => t.id === objective.teamId)
  const isActive = objective.lifecycle === 'active'

  const remove = () => {
    if (window.confirm(`Delete "${objective.title}" and all its key results and check-ins?`)) {
      store.deleteObjective(objective.id)
      navigate('/objectives')
    }
  }

  return (
    <div className="space-y-5">
      <Link
        to="/objectives"
        className="inline-flex items-center gap-1 text-xs font-medium text-ink-muted hover:text-ink"
      >
        <ArrowLeft size={13} /> All objectives
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold text-ink">{objective.title}</h1>
            <Badge tone={objective.level === 'company' ? 'accent' : 'neutral'}>
              {LEVEL_LABEL[objective.level]}
            </Badge>
            <Badge tone={objective.type === 'aspirational' ? 'violet' : 'neutral'}>
              {objective.type === 'aspirational' ? 'Aspirational' : 'Committed'}
            </Badge>
            <LifecycleChip lifecycle={objective.lifecycle} finalScore={objective.finalScore} />
          </div>
          {objective.description && (
            <p className="mt-1.5 max-w-2xl text-sm text-ink-secondary">{objective.description}</p>
          )}
          <p className="mt-1.5 text-xs text-ink-muted">
            {cycle.name}
            {team ? ` · ${team.name}` : ''} · Owned by {owner?.name ?? '—'}
            {parent && (
              <>
                {' · aligns to '}
                <Link to={`/objectives/${parent.id}`} className="text-accent-strong hover:underline">
                  {parent.title}
                </Link>
              </>
            )}
            {objective.tags.length > 0 && ` · ${objective.tags.map((t) => `#${t}`).join(' ')}`}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button onClick={() => setEditing(true)}>
            <PencilLine size={14} /> Edit
          </Button>
          {isActive && (
            <Button variant="primary" onClick={() => setClosing(true)}>
              <Flag size={14} /> Close & grade
            </Button>
          )}
          {objective.lifecycle === 'closed' && (
            <Button onClick={() => store.reopenObjective(objective.id)}>
              <RotateCcw size={14} /> Reopen
            </Button>
          )}
          <Button variant="danger" onClick={remove}>
            <Trash2 size={14} />
          </Button>
        </div>
      </div>

      {objective.lifecycle === 'closed' ? (
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <span
              className="text-3xl font-semibold"
              style={{ color: BAND_COLOR[scoreBand(objective.finalScore ?? 0)] }}
            >
              {formatScore(objective.finalScore ?? 0)}
            </span>
            <div>
              <p className="text-sm font-medium text-ink">Final grade</p>
              <p className="text-xs text-ink-muted">
                0.7–1.0 green · 0.4–0.6 amber · 0.0–0.3 red (Google bands)
              </p>
            </div>
          </div>
          {objective.reflection && (
            <p className="mt-3 border-t border-grid pt-3 text-sm text-ink-secondary">
              {objective.reflection}
            </p>
          )}
        </Card>
      ) : (
        <Card className="p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-ink">
              Overall progress {formatPercent(computed.progress)}
            </span>
            <span className="flex items-center gap-2 text-xs text-ink-muted">
              {cycle.status === 'open' && <>Expected by today: {formatPercent(computed.expected)}</>}
              {isActive && <StatusChip status={computed.status} small />}
            </span>
          </div>
          <ProgressBar
            value={computed.progress}
            expected={cycle.status === 'open' && isActive ? computed.expected : undefined}
            className="mt-2"
          />
        </Card>
      )}

      <section>
        <h2 className="mb-2 text-sm font-semibold text-ink">Key results</h2>
        <div className="space-y-3">
          {krs.length === 0 && <EmptyState title="No key results" hint="Edit the objective to add measurable outcomes." />}
          {krs.map((kr) => (
            <KrDetailCard key={kr.id} kr={kr} lifecycle={objective.lifecycle} cycleId={cycle.id} />
          ))}
        </div>
      </section>

      {children.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-ink">Aligned objectives</h2>
          <Card className="divide-y divide-grid">
            {children.map((child) => {
              const childCycle = cycles.find((c) => c.id === child.cycleId) ?? cycle
              const childComputed = computeObjective(child, objectives, keyResults, checkIns, childCycle, settings)
              const childTeam = teams.find((t) => t.id === child.teamId)
              return (
                <div key={child.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/objectives/${child.id}`}
                      className="truncate text-sm font-medium text-ink hover:text-accent-strong hover:underline"
                    >
                      {child.title}
                    </Link>
                    <p className="text-xs text-ink-muted">
                      {childTeam?.name ?? LEVEL_LABEL[child.level]}
                      {child.cycleId !== cycle.id ? ` · ${childCycle.name}` : ''}
                    </p>
                  </div>
                  <ProgressWithLabel value={childComputed.progress} className="w-40 shrink-0" />
                  {child.lifecycle === 'active' && <StatusChip status={childComputed.status} small />}
                </div>
              )
            })}
          </Card>
        </section>
      )}

      {editing && (
        <ObjectiveForm objective={objective} defaultCycleId={cycle.id} onClose={() => setEditing(false)} />
      )}
      {closing && <CloseObjectiveModal objective={objective} onClose={() => setClosing(false)} />}
    </div>
  )
}

function KrDetailCard({
  kr,
  lifecycle,
  cycleId,
}: {
  kr: KeyResult
  lifecycle: ObjectiveLifecycle
  cycleId: string
}) {
  const store = useOkrStore()
  const { checkIns, people, initiatives, cycles, settings } = store
  const [checkingIn, setCheckingIn] = useState(false)
  const [editing, setEditing] = useState(false)
  const [newInitiative, setNewInitiative] = useState('')
  const [showHistory, setShowHistory] = useState(false)

  const isActive = lifecycle === 'active'
  const canEdit = lifecycle !== 'closed'

  const cycle = cycles.find((c) => c.id === cycleId)!
  const history = checkInsForKr(checkIns, kr.id)
  const progress = krProgress(kr)
  const status = krStatus(kr, history, cycle, settings)
  const owner = people.find((p) => p.id === kr.ownerId)
  const krInitiatives = initiatives.filter((i) => i.keyResultId === kr.id)
  const staleDays = daysSinceCheckIn(history)
  const latestBlocker = [...history].reverse().find((c) => c.blocker)?.blocker
  const sparkPoints = [
    krProgress({ ...kr, currentValue: kr.startValue }),
    ...history.map((c) => krProgress({ ...kr, currentValue: c.value })),
  ]

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-ink">{kr.title}</p>
          <p className="mt-0.5 text-xs text-ink-muted">
            {formatKrValue(kr, kr.currentValue)} of {formatKrValue(kr, kr.targetValue)}
            {kr.direction === 'stay_above' && ' (guardrail: stay above)'}
            {kr.direction === 'stay_below' && ' (guardrail: stay below)'}
            {owner ? ` · ${owner.name}` : ''}
            {kr.weight !== 1 ? ` · weight ${kr.weight}` : ''}
            {history.length > 0 &&
              ` · updated ${formatDistanceToNow(parseISO(history[history.length - 1].createdAt), { addSuffix: true })}`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {sparkPoints.length >= 2 && <Sparkline points={sparkPoints} />}
          {kr.finalScore !== undefined ? (
            <span
              className="text-sm font-semibold"
              style={{ color: BAND_COLOR[scoreBand(kr.finalScore)] }}
            >
              {formatScore(kr.finalScore)}
            </span>
          ) : isActive ? (
            <StatusChip status={status} small />
          ) : null}
        </div>
      </div>

      <div className="mt-2.5 flex items-center gap-2.5">
        <ProgressBar
          value={progress}
          expected={isActive && cycle.status === 'open' ? expectedProgress(cycle) : undefined}
          className="flex-1"
        />
        <span className="text-xs font-semibold text-ink tabular-nums">{formatPercent(progress)}</span>
      </div>

      {latestBlocker && (
        <p className="mt-2.5 flex items-start gap-1.5 rounded-lg bg-status-critical/5 px-2.5 py-1.5 text-xs text-ink-secondary">
          <OctagonAlert size={13} className="mt-0.5 shrink-0 text-status-critical" />
          <span>
            <span className="font-semibold text-status-critical">Blocker: </span>
            {latestBlocker}
          </span>
        </p>
      )}

      {(krInitiatives.length > 0 || canEdit) && (
        <div className="mt-3 border-t border-grid pt-2.5">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
            Initiatives
          </p>
          <div className="space-y-1">
            {krInitiatives.map((init) => (
              <div key={init.id} className="group flex items-center gap-2">
                <label className="flex flex-1 cursor-pointer items-center gap-2 text-sm text-ink-secondary">
                  <input
                    type="checkbox"
                    checked={init.done}
                    onChange={() => store.toggleInitiative(init.id)}
                    disabled={!canEdit}
                    className="accent-[var(--color-accent)]"
                  />
                  <span className={init.done ? 'text-ink-muted line-through' : ''}>{init.title}</span>
                </label>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => store.deleteInitiative(init.id)}
                    className="invisible rounded p-0.5 text-ink-muted hover:text-status-critical group-hover:visible"
                    aria-label="Delete initiative"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
            {canEdit && (
              <form
                className="flex items-center gap-2"
                onSubmit={(e) => {
                  e.preventDefault()
                  if (newInitiative.trim()) {
                    store.addInitiative({ keyResultId: kr.id, title: newInitiative.trim() })
                    setNewInitiative('')
                  }
                }}
              >
                <Plus size={13} className="text-ink-muted" />
                <input
                  className={`${inputClass} border-transparent bg-transparent px-1 py-1 text-xs focus:border-baseline`}
                  value={newInitiative}
                  onChange={(e) => setNewInitiative(e.target.value)}
                  placeholder="Add an initiative (the tasks that move this KR)"
                />
              </form>
            )}
          </div>
        </div>
      )}

      <div className="mt-3 flex items-center gap-3 border-t border-grid pt-2.5">
        {isActive && cycle.status === 'open' && (
          <Button variant="primary" onClick={() => setCheckingIn((v) => !v)} className="!px-2.5 !py-1 !text-xs">
            <PencilLine size={13} /> Check in
          </Button>
        )}
        {canEdit && (
          <>
            <Button onClick={() => setEditing(true)} className="!px-2.5 !py-1 !text-xs">
              Edit
            </Button>
            <button
              type="button"
              onClick={() => {
                const extras = [
                  history.length > 0 && `${history.length} check-in${history.length === 1 ? '' : 's'}`,
                  krInitiatives.length > 0 &&
                    `${krInitiatives.length} initiative${krInitiatives.length === 1 ? '' : 's'}`,
                ].filter(Boolean)
                const suffix = extras.length > 0 ? ` This also removes its ${extras.join(' and ')}.` : ''
                if (window.confirm(`Delete key result "${kr.title}"?${suffix}`))
                  store.deleteKeyResult(kr.id)
              }}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-ink-muted hover:bg-black/5 hover:text-status-critical"
              aria-label={`Delete ${kr.title}`}
            >
              <Trash2 size={13} /> Delete
            </button>
          </>
        )}
        {history.length > 0 && (
          <button
            type="button"
            onClick={() => setShowHistory((v) => !v)}
            className="text-xs font-medium text-ink-muted hover:text-ink"
          >
            {showHistory ? 'Hide' : 'Show'} history ({history.length})
          </button>
        )}
        {isActive && Number.isFinite(staleDays) && staleDays > settings.staleDays && (
          <span className="text-xs text-ink-muted">Last check-in {staleDays} days ago</span>
        )}
      </div>

      {checkingIn && (
        <div className="mt-2.5">
          <CheckInForm kr={kr} defaultStatus={status} onDone={() => setCheckingIn(false)} />
        </div>
      )}

      {editing && <KrEditModal kr={kr} onClose={() => setEditing(false)} />}

      {showHistory && (
        <div className="mt-3 space-y-2.5">
          {[...history].reverse().map((c) => {
            const author = people.find((p) => p.id === c.authorId)
            return (
              <div key={c.id} className="flex gap-2.5">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-wash text-[10px] font-semibold text-accent-strong">
                  {author ? initials(author.name) : '—'}
                </span>
                <div className="min-w-0 flex-1 rounded-lg bg-page/70 px-3 py-2">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                    <span className="font-semibold text-ink">{formatKrValue(kr, c.value)}</span>
                    <span className="text-ink-muted">·</span>
                    <span className="text-ink-secondary">{statusLabel(c.status)}</span>
                    <span className="text-ink-muted">
                      · {format(parseISO(c.createdAt), 'MMM d, yyyy')}
                      {author ? ` · ${author.name}` : ''}
                    </span>
                    <button
                      type="button"
                      onClick={() => store.deleteCheckIn(c.id)}
                      className="ml-auto rounded p-0.5 text-ink-muted hover:text-status-critical"
                      aria-label="Delete check-in"
                      title="Delete check-in (reverts the value)"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  {c.note && <p className="mt-1 text-xs text-ink-secondary">{c.note}</p>}
                  {c.blocker && (
                    <p className="mt-1 text-xs text-status-critical">Blocker: {c.blocker}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
      {kr.metricType === 'boolean' && progress === 1 && (
        <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-status-good-text">
          <CircleCheck size={13} /> Achieved
        </p>
      )}
    </Card>
  )
}
