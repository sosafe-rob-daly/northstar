import { useMemo, useState } from 'react'
import { Plus, Trash2, TriangleAlert } from 'lucide-react'
import { useOkrStore } from '../store/store'
import type { Id, KrDirection, MetricType, Objective, OkrLevel, ObjectiveType } from '../lib/types'
import { CYCLE_GROUPS, longerHorizonCycles } from '../lib/cycles'
import { Button, Field, Modal, inputClass } from './ui'

interface KrDraft {
  id?: Id
  title: string
  metricType: MetricType
  unit: string
  direction: KrDirection
  startValue: string
  targetValue: string
  ownerId: string
  weight: string
}

const emptyKr = (): KrDraft => ({
  title: '',
  metricType: 'number',
  unit: '',
  direction: 'increase',
  startValue: '0',
  targetValue: '',
  ownerId: '',
  weight: '1',
})

export function ObjectiveForm({
  objective,
  defaultCycleId,
  onClose,
}: {
  /** When set, edits an existing objective */
  objective?: Objective
  defaultCycleId: Id
  onClose: () => void
}) {
  const { cycles, teams, people, objectives, keyResults } = useOkrStore()
  const addObjective = useOkrStore((s) => s.addObjective)
  const updateObjective = useOkrStore((s) => s.updateObjective)
  const addKeyResult = useOkrStore((s) => s.addKeyResult)
  const updateKeyResult = useOkrStore((s) => s.updateKeyResult)
  const deleteKeyResult = useOkrStore((s) => s.deleteKeyResult)

  const [title, setTitle] = useState(objective?.title ?? '')
  const [description, setDescription] = useState(objective?.description ?? '')
  const [level, setLevel] = useState<OkrLevel>(objective?.level ?? 'team')
  const [teamId, setTeamId] = useState(objective?.teamId ?? teams[0]?.id ?? '')
  const [ownerId, setOwnerId] = useState(objective?.ownerId ?? people[0]?.id ?? '')
  const [cycleId, setCycleId] = useState(objective?.cycleId ?? defaultCycleId)
  const [parentId, setParentId] = useState(objective?.parentId ?? '')
  const [type, setType] = useState<ObjectiveType>(objective?.type ?? 'committed')
  const [isDraft, setIsDraft] = useState(objective ? objective.lifecycle === 'draft' : false)
  const [tags, setTags] = useState(objective?.tags.join(', ') ?? '')
  const [error, setError] = useState('')

  const [krs, setKrs] = useState<KrDraft[]>(() => {
    if (!objective) return [emptyKr()]
    return keyResults
      .filter((k) => k.objectiveId === objective.id)
      .map((k) => ({
        id: k.id,
        title: k.title,
        metricType: k.metricType,
        unit: k.unit ?? '',
        direction: k.direction,
        startValue: String(k.startValue),
        targetValue: String(k.targetValue),
        ownerId: k.ownerId ?? '',
        weight: String(k.weight),
      }))
  })
  const [removedKrIds, setRemovedKrIds] = useState<Id[]>([])

  // Parent candidates: objectives in the same cycle plus objectives in
  // overlapping longer-horizon cycles (quarter -> year), excluding self
  // and own descendants. Grouped by cycle for the dropdown.
  const parentGroups = useMemo(() => {
    const descendants = new Set<Id>()
    if (objective) {
      const collect = (id: Id) => {
        descendants.add(id)
        objectives.filter((o) => o.parentId === id).forEach((o) => collect(o.id))
      }
      collect(objective.id)
    }
    const selectedCycle = cycles.find((c) => c.id === cycleId)
    const eligibleCycles = selectedCycle
      ? [...longerHorizonCycles(selectedCycle, cycles), selectedCycle]
      : []
    return eligibleCycles
      .map((c) => ({
        cycle: c,
        objectives: objectives.filter((o) => o.cycleId === c.id && !descendants.has(o.id)),
      }))
      .filter((g) => g.objectives.length > 0)
  }, [objectives, cycles, cycleId, objective])

  const setKr = (index: number, patch: Partial<KrDraft>) =>
    setKrs((list) => list.map((kr, i) => (i === index ? { ...kr, ...patch } : kr)))

  const removeKr = (index: number) => {
    const kr = krs[index]
    if (kr.id) setRemovedKrIds((ids) => [...ids, kr.id!])
    setKrs((list) => list.filter((_, i) => i !== index))
  }

  const taskLikeKrs = krs.filter(
    (kr) => kr.title.trim() && kr.metricType !== 'boolean' && kr.targetValue.trim() === '',
  )

  const save = () => {
    if (!title.trim()) return setError('An objective needs a title.')
    if (!ownerId) return setError('Pick an owner — every objective needs a DRI.')
    const validKrs = krs.filter((kr) => kr.title.trim())
    if (!isDraft && validKrs.length === 0)
      return setError('An active objective needs at least one measurable key result (save as draft to skip).')
    for (const kr of validKrs) {
      if (kr.metricType !== 'boolean' && (kr.startValue.trim() === '' || kr.targetValue.trim() === ''))
        return setError(`"${kr.title}" needs start and target values — a key result without a metric is a task.`)
      if (kr.metricType !== 'boolean' && Number(kr.startValue) === Number(kr.targetValue))
        return setError(`"${kr.title}": start and target are identical, so progress can never move.`)
    }

    const base = {
      title: title.trim(),
      description: description.trim() || undefined,
      level,
      cycleId,
      teamId: level === 'company' ? undefined : teamId || undefined,
      ownerId,
      parentId: parentId || undefined,
      type,
      lifecycle: (isDraft ? 'draft' : (objective?.lifecycle === 'closed' ? 'closed' : 'active')) as Objective['lifecycle'],
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
    }

    const toKrPayload = (kr: KrDraft) => ({
      title: kr.title.trim(),
      metricType: kr.metricType,
      unit: kr.unit.trim() || undefined,
      direction: kr.metricType === 'boolean' ? ('increase' as const) : kr.direction,
      startValue: kr.metricType === 'boolean' ? 0 : Number(kr.startValue),
      targetValue: kr.metricType === 'boolean' ? 1 : Number(kr.targetValue),
      ownerId: kr.ownerId || undefined,
      weight: Math.max(0.1, Number(kr.weight) || 1),
    })

    if (!objective) {
      addObjective(
        base,
        validKrs.map((kr) => ({ ...toKrPayload(kr), currentValue: toKrPayload(kr).startValue })),
      )
    } else {
      updateObjective(objective.id, base)
      removedKrIds.forEach(deleteKeyResult)
      for (const kr of validKrs) {
        const payload = toKrPayload(kr)
        if (kr.id) {
          updateKeyResult(kr.id, payload)
        } else {
          addKeyResult({ ...payload, objectiveId: objective.id, currentValue: payload.startValue })
        }
      }
    }
    onClose()
  }

  return (
    <Modal title={objective ? 'Edit objective' : 'New objective'} onClose={onClose} wide>
      <div className="space-y-4">
        <Field label="Objective">
          <input
            className={inputClass}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Qualitative, inspiring, time-bound — no numbers here"
            autoFocus
          />
        </Field>
        <Field label="Description (optional)">
          <textarea
            className={`${inputClass} resize-none`}
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Why this matters now"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label="Level">
            <select className={inputClass} value={level} onChange={(e) => setLevel(e.target.value as OkrLevel)}>
              <option value="company">Company</option>
              <option value="team">Team</option>
              <option value="individual">Individual</option>
            </select>
          </Field>
          {level !== 'company' && (
            <Field label="Team">
              <select className={inputClass} value={teamId} onChange={(e) => setTeamId(e.target.value)}>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </Field>
          )}
          <Field label="Owner">
            <select className={inputClass} value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
              {people.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Cycle">
            <select className={inputClass} value={cycleId} onChange={(e) => setCycleId(e.target.value)}>
              {CYCLE_GROUPS.map((group) => {
                const groupCycles = cycles.filter((c) => c.type === group.type)
                if (groupCycles.length === 0) return null
                return (
                  <optgroup key={group.type} label={group.label}>
                    {groupCycles.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </optgroup>
                )
              })}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="Type" hint={type === 'committed' ? 'Expected to hit 1.0 — a miss needs an explanation' : 'Moonshot — ~0.7 is success'}>
            <select className={inputClass} value={type} onChange={(e) => setType(e.target.value as ObjectiveType)}>
              <option value="committed">Committed</option>
              <option value="aspirational">Aspirational</option>
            </select>
          </Field>
          <Field label="Aligns to (parent objective)">
            <select className={inputClass} value={parentId} onChange={(e) => setParentId(e.target.value)}>
              <option value="">None</option>
              {parentGroups.map((group) => (
                <optgroup key={group.cycle.id} label={group.cycle.name}>
                  {group.objectives.map((o) => (
                    <option key={o.id} value={o.id}>{o.title}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </Field>
          <Field label="Tags (comma-separated)">
            <input className={inputClass} value={tags} onChange={(e) => setTags(e.target.value)} placeholder="growth, q3-bet" />
          </Field>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink">Key results</h3>
            <span className="text-xs text-ink-muted">Verb + metric + from X to Y · 3–5 per objective</span>
          </div>
          <div className="space-y-3">
            {krs.map((kr, i) => (
              <div key={kr.id ?? `new-${i}`} className="rounded-lg border border-grid bg-page/60 p-3">
                <div className="flex items-center gap-2">
                  <input
                    className={inputClass}
                    value={kr.title}
                    onChange={(e) => setKr(i, { title: e.target.value })}
                    placeholder={`Key result ${i + 1} — e.g. "Increase NPS from 41 to 50"`}
                  />
                  <button
                    type="button"
                    onClick={() => removeKr(i)}
                    className="rounded-md p-1.5 text-ink-muted hover:bg-black/5 hover:text-status-critical"
                    aria-label="Remove key result"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-7">
                  <Field label="Metric">
                    <select
                      className={inputClass}
                      value={kr.metricType}
                      onChange={(e) => setKr(i, { metricType: e.target.value as MetricType })}
                    >
                      <option value="number">Number</option>
                      <option value="percent">Percent</option>
                      <option value="currency">Currency</option>
                      <option value="boolean">Done / not done</option>
                    </select>
                  </Field>
                  {kr.metricType !== 'boolean' && (
                    <>
                      <Field label="Direction">
                        <select
                          className={inputClass}
                          value={kr.direction}
                          onChange={(e) => setKr(i, { direction: e.target.value as KrDirection })}
                        >
                          <option value="increase">Increase to</option>
                          <option value="decrease">Decrease to</option>
                          <option value="stay_above">Stay above</option>
                          <option value="stay_below">Stay below</option>
                        </select>
                      </Field>
                      <Field label="Start">
                        <input
                          type="number"
                          className={inputClass}
                          value={kr.startValue}
                          onChange={(e) => setKr(i, { startValue: e.target.value })}
                        />
                      </Field>
                      <Field label="Target">
                        <input
                          type="number"
                          className={inputClass}
                          value={kr.targetValue}
                          onChange={(e) => setKr(i, { targetValue: e.target.value })}
                          placeholder="—"
                        />
                      </Field>
                      <Field label="Unit">
                        <input
                          className={inputClass}
                          value={kr.unit}
                          onChange={(e) => setKr(i, { unit: e.target.value })}
                          placeholder="€, NPS…"
                        />
                      </Field>
                    </>
                  )}
                  <Field label="KR owner">
                    <select className={inputClass} value={kr.ownerId} onChange={(e) => setKr(i, { ownerId: e.target.value })}>
                      <option value="">Objective owner</option>
                      {people.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Weight">
                    <input
                      type="number"
                      min="0.1"
                      step="0.5"
                      className={inputClass}
                      value={kr.weight}
                      onChange={(e) => setKr(i, { weight: e.target.value })}
                    />
                  </Field>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2">
            <Button variant="ghost" onClick={() => setKrs((list) => [...list, emptyKr()])}>
              <Plus size={14} /> Add key result
            </Button>
          </div>
          {krs.filter((k) => k.title.trim()).length > 5 && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-secondary">
              <TriangleAlert size={13} className="text-status-warning" />
              More than 5 key results dilutes focus — consider splitting this objective.
            </p>
          )}
          {taskLikeKrs.length > 0 && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-secondary">
              <TriangleAlert size={13} className="text-status-warning" />
              A key result without a target number is usually a task — attach it to a KR as an initiative instead.
            </p>
          )}
        </div>

        {error && <p className="text-sm font-medium text-status-critical">{error}</p>}

        <div className="flex items-center justify-between border-t border-grid pt-4">
          <label className="flex items-center gap-2 text-sm text-ink-secondary">
            <input
              type="checkbox"
              checked={isDraft}
              onChange={(e) => setIsDraft(e.target.checked)}
              className="accent-[var(--color-accent)]"
            />
            Save as draft (not yet committed for the cycle)
          </label>
          <div className="flex gap-2">
            <Button onClick={onClose}>Cancel</Button>
            <Button variant="primary" onClick={save}>
              {objective ? 'Save changes' : 'Create objective'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
