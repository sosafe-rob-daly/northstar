import { differenceInCalendarDays, parseISO } from 'date-fns'
import type { Cycle, CycleType } from './types'

export const CYCLE_TYPE_LABEL: Record<CycleType, string> = {
  quarter: 'Quarter',
  year: 'Year',
  custom: 'Custom',
}

/** Dropdown group order: tactical quarters first, then the strategic horizons. */
export const CYCLE_GROUPS: { type: CycleType; label: string }[] = [
  { type: 'quarter', label: 'Quarters' },
  { type: 'year', label: 'Years' },
  { type: 'custom', label: 'Other' },
]

export function durationDays(cycle: Cycle): number {
  return differenceInCalendarDays(parseISO(cycle.endDate), parseISO(cycle.startDate))
}

/** Infer a horizon for cycles created before types existed (migration). */
export function inferCycleType(cycle: { startDate: string; endDate: string }): CycleType {
  const days = differenceInCalendarDays(parseISO(cycle.endDate), parseISO(cycle.startDate))
  if (days > 200) return 'year'
  if (days >= 70 && days <= 120) return 'quarter'
  return 'custom'
}

export function cyclesOverlap(a: Cycle, b: Cycle): boolean {
  return a.startDate <= b.endDate && b.startDate <= a.endDate
}

/**
 * Cycles a given cycle's objectives may align up to: overlapping cycles with
 * a longer horizon (e.g. a quarter aligns into the year it belongs to).
 */
export function longerHorizonCycles(cycle: Cycle, cycles: Cycle[]): Cycle[] {
  return cycles.filter(
    (c) => c.id !== cycle.id && cyclesOverlap(c, cycle) && durationDays(c) > durationDays(cycle),
  )
}
