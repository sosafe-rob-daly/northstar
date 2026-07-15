import type { CheckIn, Cycle, Id, KeyResult, Objective, Settings, Status } from './types'
import {
  expectedProgress,
  krProgress,
  krStatus,
  objectiveProgress,
  objectiveStatus,
} from './progress'

export interface ObjectiveComputed {
  progress: number
  expected: number
  status: Status
}

/** Progress for every objective, folding aligned children in recursively. */
export function buildProgressMap(
  objectives: Objective[],
  keyResults: KeyResult[],
): Map<Id, number> {
  const memo = new Map<Id, number>()
  const visiting = new Set<Id>()
  const byParent = new Map<Id, Objective[]>()
  for (const o of objectives) {
    if (o.parentId) {
      const list = byParent.get(o.parentId) ?? []
      list.push(o)
      byParent.set(o.parentId, list)
    }
  }

  const compute = (o: Objective): number => {
    const cached = memo.get(o.id)
    if (cached !== undefined) return cached
    if (visiting.has(o.id)) return 0 // cycle guard
    visiting.add(o.id)
    const krs = keyResults.filter((k) => k.objectiveId === o.id)
    const children = (byParent.get(o.id) ?? []).filter((c) => c.lifecycle !== 'draft')
    const value = objectiveProgress(o, krs, children.map(compute))
    visiting.delete(o.id)
    memo.set(o.id, value)
    return value
  }

  for (const o of objectives) compute(o)
  return memo
}

export function computeObjective(
  objective: Objective,
  objectives: Objective[],
  keyResults: KeyResult[],
  checkIns: CheckIn[],
  cycle: Cycle,
  settings: Settings,
  now: Date = new Date(),
): ObjectiveComputed {
  const progress = buildProgressMap(objectives, keyResults).get(objective.id) ?? 0
  const expected = expectedProgress(cycle, now)
  const krs = keyResults.filter((k) => k.objectiveId === objective.id)
  const krStatuses = krs.map((k) =>
    krStatus(k, checkIns.filter((c) => c.keyResultId === k.id), cycle, settings, now),
  )
  return { progress, expected, status: objectiveStatus(progress, expected, krStatuses, settings) }
}

export function checkInsForKr(checkIns: CheckIn[], krId: Id): CheckIn[] {
  return checkIns
    .filter((c) => c.keyResultId === krId)
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))
}

/**
 * Average objective progress across a set of objectives as of a given date,
 * reconstructed from check-in history (for the progress-over-time chart).
 */
export function progressAtDate(
  objectives: Objective[],
  keyResults: KeyResult[],
  checkIns: CheckIn[],
  date: Date,
): number {
  const cutoff = date.toISOString()
  const scoped = objectives.filter(
    (o) => o.lifecycle !== 'draft' && keyResults.some((k) => k.objectiveId === o.id),
  )
  if (scoped.length === 0) return 0
  const perObjective = scoped.map((o) => {
    const krs = keyResults.filter((k) => k.objectiveId === o.id)
    const sum = krs.reduce((acc, kr) => {
      const history = checkIns
        .filter((c) => c.keyResultId === kr.id && c.createdAt <= cutoff)
        .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))
      const value = history.length > 0 ? history[history.length - 1].value : kr.startValue
      return acc + krProgress({ ...kr, currentValue: value })
    }, 0)
    return sum / krs.length
  })
  return perObjective.reduce((a, b) => a + b, 0) / perObjective.length
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}
