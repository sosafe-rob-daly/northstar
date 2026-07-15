import { differenceInCalendarDays, parseISO } from 'date-fns'
import type {
  CheckIn,
  Cycle,
  KeyResult,
  Objective,
  Settings,
  Status,
} from './types'

export const DEFAULT_SETTINGS: Settings = {
  staleDays: 7,
  behindGapPp: 5,
  atRiskGapPp: 25,
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))

/**
 * KR progress as a 0-1 fraction.
 *  - increase:   (current - start) / (target - start)
 *  - decrease:   (start - current) / (start - target)
 *  - stay_above: current >= target ? 1 : 0  (control/guardrail KR)
 *  - stay_below: current <= target ? 1 : 0
 *  - boolean:    current >= target ? 1 : 0
 */
export function krProgress(kr: KeyResult): number {
  const { startValue: start, targetValue: target, currentValue: current } = kr
  if (kr.metricType === 'boolean') return current >= 1 ? 1 : 0
  switch (kr.direction) {
    case 'stay_above':
      return current >= target ? 1 : 0
    case 'stay_below':
      return current <= target ? 1 : 0
    case 'increase':
      if (target === start) return current >= target ? 1 : 0
      return clamp01((current - start) / (target - start))
    case 'decrease':
      if (target === start) return current <= target ? 1 : 0
      return clamp01((start - current) / (start - target))
  }
}

/**
 * Objective progress: weighted average of its KRs, with aligned child
 * objectives folded in as equal-weight pseudo-KRs (Weekdone model).
 * A closed objective reports its final score instead of live progress.
 */
export function objectiveProgress(
  objective: Objective,
  krs: KeyResult[],
  childProgresses: number[],
): number {
  if (objective.lifecycle === 'closed' && objective.finalScore !== undefined) {
    return clamp01(objective.finalScore)
  }
  const krWeight = krs.reduce((sum, kr) => sum + (kr.weight || 1), 0)
  const totalWeight = krWeight + childProgresses.length
  if (totalWeight === 0) return 0
  const krSum = krs.reduce((sum, kr) => sum + krProgress(kr) * (kr.weight || 1), 0)
  const childSum = childProgresses.reduce((sum, p) => sum + p, 0)
  return (krSum + childSum) / totalWeight
}

/** Fraction of the cycle that has elapsed as of `now`, clamped 0-1. */
export function expectedProgress(cycle: Cycle, now: Date = new Date()): number {
  const start = parseISO(cycle.startDate)
  const end = parseISO(cycle.endDate)
  const total = differenceInCalendarDays(end, start)
  if (total <= 0) return 1
  return clamp01(differenceInCalendarDays(now, start) / total)
}

/**
 * Pace-derived status (Viva Goals bands, thresholds configurable):
 * gap = expected - actual in percentage points.
 * gap <= behindGapPp -> on_track; gap <= atRiskGapPp -> behind; else at_risk.
 */
export function paceStatus(
  actual: number,
  expected: number,
  settings: Settings = DEFAULT_SETTINGS,
): Status {
  const gapPp = (expected - actual) * 100
  if (gapPp <= settings.behindGapPp) return 'on_track'
  if (gapPp <= settings.atRiskGapPp) return 'behind'
  return 'at_risk'
}

/** Latest check-in for a KR, if any. */
export function latestCheckIn(checkIns: CheckIn[]): CheckIn | undefined {
  if (checkIns.length === 0) return undefined
  return checkIns.reduce((a, b) => (a.createdAt > b.createdAt ? a : b))
}

/**
 * Effective KR status: the owner-asserted confidence from the latest
 * check-in wins; before any check-in exists, fall back to pace.
 */
export function krStatus(
  kr: KeyResult,
  checkIns: CheckIn[],
  cycle: Cycle,
  settings: Settings = DEFAULT_SETTINGS,
  now: Date = new Date(),
): Status {
  const latest = latestCheckIn(checkIns)
  if (latest) return latest.status
  return paceStatus(krProgress(kr), expectedProgress(cycle, now), settings)
}

/** Worst-of helper for rolling KR statuses up to an objective chip. */
const STATUS_RANK: Record<Status, number> = { on_track: 0, behind: 1, at_risk: 2 }

export function worstStatus(statuses: Status[]): Status {
  if (statuses.length === 0) return 'on_track'
  return statuses.reduce((a, b) => (STATUS_RANK[b] > STATUS_RANK[a] ? b : a))
}

/**
 * Objective status: pace of overall progress vs time elapsed, escalated
 * to at least "behind" if any KR is at risk (early-warning signal).
 */
export function objectiveStatus(
  progress: number,
  expected: number,
  krStatuses: Status[],
  settings: Settings = DEFAULT_SETTINGS,
): Status {
  const pace = paceStatus(progress, expected, settings)
  if (worstStatus(krStatuses) === 'at_risk' && pace === 'on_track') return 'behind'
  return pace
}

/** Days since the last check-in; Infinity when none exists. */
export function daysSinceCheckIn(checkIns: CheckIn[], now: Date = new Date()): number {
  const latest = latestCheckIn(checkIns)
  if (!latest) return Infinity
  return differenceInCalendarDays(now, parseISO(latest.createdAt))
}

export function isStale(
  checkIns: CheckIn[],
  settings: Settings = DEFAULT_SETTINGS,
  now: Date = new Date(),
): boolean {
  return daysSinceCheckIn(checkIns, now) > settings.staleDays
}

/**
 * Google grading bands for a 0.0-1.0 score:
 * 0.7-1.0 green, 0.4-0.6 amber, 0.0-0.3 red.
 */
export function scoreBand(score: number): 'green' | 'amber' | 'red' {
  if (score >= 0.7) return 'green'
  if (score >= 0.4) return 'amber'
  return 'red'
}
