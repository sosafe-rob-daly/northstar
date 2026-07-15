import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, ChevronRight, Trash2 } from 'lucide-react'
import { useOkrStore } from '../store/store'
import type { Cycle, Objective } from '../lib/types'
import { computeObjective } from '../lib/selectors'
import { Card, Badge } from './ui'
import { StatusChip, LifecycleChip } from './StatusChip'
import { ProgressWithLabel } from './ProgressBar'
import { KrRow } from './KrRow'

const LEVEL_LABEL = { company: 'Company', team: 'Team', individual: 'Individual' } as const

export function ObjectiveCard({ objective, cycle }: { objective: Objective; cycle: Cycle }) {
  const { objectives, keyResults, checkIns, people, teams, settings } = useOkrStore()
  const deleteObjective = useOkrStore((s) => s.deleteObjective)
  const [expanded, setExpanded] = useState(false)

  const krs = keyResults.filter((k) => k.objectiveId === objective.id)
  const computed = computeObjective(objective, objectives, keyResults, checkIns, cycle, settings)
  const owner = people.find((p) => p.id === objective.ownerId)
  const team = teams.find((t) => t.id === objective.teamId)
  const isActive = objective.lifecycle === 'active'

  return (
    <Card>
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="shrink-0 rounded-md p-1 text-ink-muted hover:bg-black/5 hover:text-ink"
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={`/objectives/${objective.id}`}
              className="truncate text-sm font-semibold text-ink hover:text-accent-strong hover:underline"
            >
              {objective.title}
            </Link>
            <Badge tone={objective.level === 'company' ? 'accent' : 'neutral'}>
              {LEVEL_LABEL[objective.level]}
            </Badge>
            {objective.type === 'aspirational' && <Badge tone="violet">Aspirational</Badge>}
            <LifecycleChip lifecycle={objective.lifecycle} finalScore={objective.finalScore} />
          </div>
          <p className="mt-0.5 text-xs text-ink-muted">
            {team ? `${team.name} · ` : ''}
            {owner?.name ?? 'Unowned'} · {krs.length} key result{krs.length === 1 ? '' : 's'}
          </p>
        </div>
        <ProgressWithLabel
          value={computed.progress}
          expected={isActive && cycle.status === 'open' ? computed.expected : undefined}
          className="w-48 shrink-0"
        />
        {isActive && <StatusChip status={computed.status} small />}
        <button
          type="button"
          onClick={() => {
            if (
              window.confirm(
                `Delete "${objective.title}" and all its key results and check-ins?`,
              )
            )
              deleteObjective(objective.id)
          }}
          className="shrink-0 rounded-md p-1 text-ink-muted hover:bg-black/5 hover:text-status-critical"
          aria-label={`Delete ${objective.title}`}
          title="Delete objective"
        >
          <Trash2 size={14} />
        </button>
      </div>
      {expanded && (
        <div className="border-t border-grid px-4 pb-2 pl-12">
          {krs.length === 0 ? (
            <p className="py-3 text-xs text-ink-muted">No key results yet.</p>
          ) : (
            <div className="divide-y divide-grid">
              {krs.map((kr) => (
                <KrRow key={kr.id} kr={kr} cycle={cycle} readonly={objective.lifecycle !== 'active'} />
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
