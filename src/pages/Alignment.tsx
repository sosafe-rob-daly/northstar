import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, ChevronRight, Unlink } from 'lucide-react'
import { useOkrStore } from '../store/store'
import { useSelectedCycle } from '../lib/useSelectedCycle'
import type { Cycle, Objective } from '../lib/types'
import { computeObjective } from '../lib/selectors'
import { Badge, Card, EmptyState } from '../components/ui'
import { StatusChip, LifecycleChip } from '../components/StatusChip'
import { ProgressWithLabel } from '../components/ProgressBar'

const LEVEL_LABEL = { company: 'Company', team: 'Team', individual: 'Individual' } as const

/**
 * Directional alignment tree: company objectives at the root, aligned team
 * and individual objectives nested beneath. Orphans surface separately —
 * flagged, never forced into the tree.
 */
export function Alignment() {
  const { objectives } = useOkrStore()
  const cycle = useSelectedCycle()

  if (!cycle) return <EmptyState title="No cycles yet" hint="Create one in Settings." />

  const inCycle = objectives.filter((o) => o.cycleId === cycle.id)
  const ids = new Set(inCycle.map((o) => o.id))
  const roots = inCycle.filter((o) => !o.parentId || !ids.has(o.parentId))
  const companyRoots = roots.filter((o) => o.level === 'company')
  const orphans = roots.filter((o) => o.level !== 'company')

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-ink">Alignment</h1>
        <p className="text-xs text-ink-muted">
          {cycle.name} · directional alignment — a network, not an org chart
        </p>
      </div>

      {companyRoots.length === 0 && orphans.length === 0 && (
        <EmptyState title="Nothing to align" hint="Create objectives for this cycle first." />
      )}

      <div className="space-y-2.5">
        {companyRoots.map((o) => (
          <TreeNode key={o.id} objective={o} all={inCycle} cycle={cycle} depth={0} />
        ))}
      </div>

      {orphans.length > 0 && (
        <section>
          <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-ink">
            <Unlink size={14} className="text-status-warning" />
            Not aligned to anything
          </h2>
          <p className="mb-2 text-xs text-ink-muted">
            These objectives support no parent. That can be fine — but every OKR should at least
            answer whose intent it serves.
          </p>
          <div className="space-y-2.5">
            {orphans.map((o) => (
              <TreeNode key={o.id} objective={o} all={inCycle} cycle={cycle} depth={0} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function TreeNode({
  objective,
  all,
  cycle,
  depth,
}: {
  objective: Objective
  all: Objective[]
  cycle: Cycle
  depth: number
}) {
  const { objectives, keyResults, checkIns, people, teams, settings } = useOkrStore()
  const [expanded, setExpanded] = useState(depth < 2)
  const children = all.filter((o) => o.parentId === objective.id)
  const computed = computeObjective(objective, objectives, keyResults, checkIns, cycle, settings)
  const owner = people.find((p) => p.id === objective.ownerId)
  const team = teams.find((t) => t.id === objective.teamId)
  const krCount = keyResults.filter((k) => k.objectiveId === objective.id).length

  return (
    <div style={{ marginLeft: depth === 0 ? 0 : 28 }} className={depth > 0 ? 'relative' : ''}>
      {depth > 0 && (
        <span className="absolute -left-4 top-0 h-6 w-4 rounded-bl-lg border-b border-l border-baseline" aria-hidden="true" />
      )}
      <Card className="px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          {children.length > 0 ? (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="shrink-0 rounded-md p-0.5 text-ink-muted hover:bg-black/5 hover:text-ink"
              aria-label={expanded ? 'Collapse' : 'Expand'}
            >
              {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
            </button>
          ) : (
            <span className="w-5 shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to={`/objectives/${objective.id}`}
                className="truncate text-sm font-medium text-ink hover:text-accent-strong hover:underline"
              >
                {objective.title}
              </Link>
              <Badge tone={objective.level === 'company' ? 'accent' : 'neutral'}>
                {team?.name ?? LEVEL_LABEL[objective.level]}
              </Badge>
              <LifecycleChip lifecycle={objective.lifecycle} finalScore={objective.finalScore} />
            </div>
            <p className="text-xs text-ink-muted">
              {owner?.name ?? '—'} · {krCount} KR{krCount === 1 ? '' : 's'}
              {children.length > 0 && ` · ${children.length} aligned`}
            </p>
          </div>
          <ProgressWithLabel value={computed.progress} className="w-40 shrink-0" />
          {objective.lifecycle === 'active' && <StatusChip status={computed.status} small />}
        </div>
      </Card>
      {expanded && children.length > 0 && (
        <div className="mt-2 space-y-2 border-l border-transparent">
          {children.map((child) => (
            <TreeNode key={child.id} objective={child} all={all} cycle={cycle} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}
