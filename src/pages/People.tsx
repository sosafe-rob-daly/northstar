import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useOkrStore } from '../store/store'
import { initials } from '../lib/selectors'
import { Button, Card, Field, inputBase, inputClass } from '../components/ui'

const SERIES_VAR = (slot: number) => `var(--color-series-${((slot - 1) % 8) + 1})`

export function People() {
  const store = useOkrStore()
  const { teams, people, objectives, keyResults } = store
  const [newTeam, setNewTeam] = useState('')
  const [personName, setPersonName] = useState('')
  const [personRole, setPersonRole] = useState('')
  const [personTeam, setPersonTeam] = useState('')

  const addTeam = () => {
    if (!newTeam.trim()) return
    const used = new Set(teams.map((t) => t.colorSlot))
    let slot = 1
    while (used.has(slot) && slot < 8) slot++
    store.addTeam({ name: newTeam.trim(), colorSlot: slot })
    setNewTeam('')
  }

  const addPerson = () => {
    if (!personName.trim()) return
    store.addPerson({
      name: personName.trim(),
      role: personRole.trim() || undefined,
      teamId: personTeam || undefined,
    })
    setPersonName('')
    setPersonRole('')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-ink">People & teams</h1>
        <p className="text-xs text-ink-muted">Who owns what — every objective and KR needs a DRI.</p>
      </div>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-ink">Teams</h2>
        <Card className="divide-y divide-grid">
          {teams.map((team) => {
            const memberCount = people.filter((p) => p.teamId === team.id).length
            const objectiveCount = objectives.filter((o) => o.teamId === team.id).length
            return (
              <div key={team.id} className="flex items-center gap-3 px-4 py-2.5">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: SERIES_VAR(team.colorSlot) }}
                  aria-hidden="true"
                />
                <span className="flex-1 text-sm font-medium text-ink">{team.name}</span>
                <span className="text-xs text-ink-muted">
                  {memberCount} member{memberCount === 1 ? '' : 's'} · {objectiveCount} objective
                  {objectiveCount === 1 ? '' : 's'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Delete team "${team.name}"? Its people and objectives stay, unassigned.`))
                      store.deleteTeam(team.id)
                  }}
                  className="rounded-md p-1 text-ink-muted hover:bg-black/5 hover:text-status-critical"
                  aria-label={`Delete ${team.name}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )
          })}
          <div className="flex items-center gap-2 px-4 py-2.5">
            <input
              className={`${inputClass} max-w-xs`}
              value={newTeam}
              onChange={(e) => setNewTeam(e.target.value)}
              placeholder="New team name"
              onKeyDown={(e) => e.key === 'Enter' && addTeam()}
            />
            <Button onClick={addTeam}>
              <Plus size={14} /> Add team
            </Button>
          </div>
        </Card>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-ink">People</h2>
        <Card className="divide-y divide-grid">
          {people.map((person) => {
            const team = teams.find((t) => t.id === person.teamId)
            const owns =
              objectives.filter((o) => o.ownerId === person.id).length +
              keyResults.filter((k) => k.ownerId === person.id).length
            return (
              <div key={person.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-wash text-[11px] font-semibold text-accent-strong">
                  {initials(person.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">{person.name}</p>
                  <p className="text-xs text-ink-muted">
                    {person.role ?? '—'}
                    {team ? ` · ${team.name}` : ''}
                  </p>
                </div>
                <span className="text-xs text-ink-muted">
                  owns {owns} item{owns === 1 ? '' : 's'}
                </span>
                <select
                  className={`${inputBase} w-40`}
                  value={person.teamId ?? ''}
                  onChange={(e) => store.updatePerson(person.id, { teamId: e.target.value || undefined })}
                  aria-label={`Team for ${person.name}`}
                >
                  <option value="">No team</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Remove ${person.name}? Their items become unowned.`))
                      store.deletePerson(person.id)
                  }}
                  className="rounded-md p-1 text-ink-muted hover:bg-black/5 hover:text-status-critical"
                  aria-label={`Remove ${person.name}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )
          })}
          <div className="grid grid-cols-1 gap-2 px-4 py-3 sm:grid-cols-4">
            <Field label="Name">
              <input
                className={inputClass}
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                placeholder="Full name"
              />
            </Field>
            <Field label="Role">
              <input
                className={inputClass}
                value={personRole}
                onChange={(e) => setPersonRole(e.target.value)}
                placeholder="e.g. PM"
              />
            </Field>
            <Field label="Team">
              <select className={inputClass} value={personTeam} onChange={(e) => setPersonTeam(e.target.value)}>
                <option value="">No team</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </Field>
            <div className="flex items-end">
              <Button onClick={addPerson}>
                <Plus size={14} /> Add person
              </Button>
            </div>
          </div>
        </Card>
      </section>
    </div>
  )
}
