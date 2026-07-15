import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { useOkrStore } from '../store/store'
import { useSelectedCycle } from '../lib/useSelectedCycle'
import type { OkrLevel, ObjectiveLifecycle } from '../lib/types'
import { ObjectiveCard } from '../components/ObjectiveCard'
import { ObjectiveForm } from '../components/ObjectiveForm'
import { Button, EmptyState, inputBase } from '../components/ui'

const LEVEL_ORDER: Record<OkrLevel, number> = { company: 0, team: 1, individual: 2 }

export function Objectives() {
  const { objectives, teams } = useOkrStore()
  const cycle = useSelectedCycle()
  const [creating, setCreating] = useState(false)
  const [level, setLevel] = useState<'all' | OkrLevel>('all')
  const [teamId, setTeamId] = useState('all')
  const [lifecycle, setLifecycle] = useState<'all' | ObjectiveLifecycle>('all')

  const list = useMemo(() => {
    if (!cycle) return []
    return objectives
      .filter((o) => o.cycleId === cycle.id)
      .filter((o) => level === 'all' || o.level === level)
      .filter((o) => teamId === 'all' || o.teamId === teamId)
      .filter((o) => lifecycle === 'all' || o.lifecycle === lifecycle)
      .sort(
        (a, b) =>
          LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level] || a.title.localeCompare(b.title),
      )
  }, [objectives, cycle, level, teamId, lifecycle])

  if (!cycle) return <EmptyState title="No cycles yet" hint="Create one in Settings." />

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-ink">Objectives</h1>
          <p className="text-xs text-ink-muted">{cycle.name} · {list.length} shown</p>
        </div>
        <Button variant="primary" onClick={() => setCreating(true)}>
          <Plus size={15} /> New objective
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <select className={`${inputBase} w-auto`} value={level} onChange={(e) => setLevel(e.target.value as typeof level)} aria-label="Filter by level">
          <option value="all">All levels</option>
          <option value="company">Company</option>
          <option value="team">Team</option>
          <option value="individual">Individual</option>
        </select>
        <select className={`${inputBase} w-auto`} value={teamId} onChange={(e) => setTeamId(e.target.value)} aria-label="Filter by team">
          <option value="all">All teams</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <select className={`${inputBase} w-auto`} value={lifecycle} onChange={(e) => setLifecycle(e.target.value as typeof lifecycle)} aria-label="Filter by lifecycle">
          <option value="all">Any state</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {list.length === 0 ? (
        <EmptyState
          title="No objectives match"
          hint="Adjust the filters or create the first objective for this cycle."
        />
      ) : (
        <div className="space-y-2.5">
          {list.map((o) => (
            <ObjectiveCard key={o.id} objective={o} cycle={cycle} />
          ))}
        </div>
      )}

      {creating && <ObjectiveForm defaultCycleId={cycle.id} onClose={() => setCreating(false)} />}
    </div>
  )
}
