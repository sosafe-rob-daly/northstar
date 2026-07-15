export type Id = string

export type CycleStatus = 'open' | 'closed'

/** Time horizon of a cycle: quarterly tactical, annual strategic, or custom */
export type CycleType = 'quarter' | 'year' | 'custom'

export interface Cycle {
  id: Id
  name: string
  type: CycleType
  startDate: string // ISO yyyy-MM-dd
  endDate: string
  status: CycleStatus
}

export interface Team {
  id: Id
  name: string
  /** Index into the fixed categorical series palette (1-8) */
  colorSlot: number
}

export interface Person {
  id: Id
  name: string
  teamId?: Id
  role?: string
}

export type OkrLevel = 'company' | 'team' | 'individual'
export type ObjectiveType = 'committed' | 'aspirational'
export type ObjectiveLifecycle = 'draft' | 'active' | 'closed'

/**
 * Health status, Viva Goals style. Used both for owner-asserted
 * confidence at check-in and for auto-derivation from pace.
 */
export type Status = 'on_track' | 'behind' | 'at_risk'

export interface Objective {
  id: Id
  title: string
  description?: string
  level: OkrLevel
  cycleId: Id
  teamId?: Id
  ownerId: Id
  /** Aligned parent objective (directional alignment, not strict cascade) */
  parentId?: Id
  type: ObjectiveType
  lifecycle: ObjectiveLifecycle
  tags: string[]
  /** Final 0.0-1.0 grade, set when the objective is closed */
  finalScore?: number
  reflection?: string
  createdAt: string // ISO datetime
  updatedAt: string
}

export type MetricType = 'number' | 'percent' | 'currency' | 'boolean'
export type KrDirection = 'increase' | 'decrease' | 'stay_above' | 'stay_below'

export interface KeyResult {
  id: Id
  objectiveId: Id
  title: string
  metricType: MetricType
  /** Free-text unit shown after the value, e.g. "NPS", "deals" */
  unit?: string
  direction: KrDirection
  startValue: number
  targetValue: number
  currentValue: number
  ownerId?: Id
  /** Relative weight in the objective rollup, default 1 */
  weight: number
  /** Final 0.0-1.0 grade, set when the parent objective is closed */
  finalScore?: number
  createdAt: string
}

export interface CheckIn {
  id: Id
  keyResultId: Id
  value: number
  status: Status
  note?: string
  /** Specific, actionable blocker flagged during the check-in */
  blocker?: string
  createdAt: string // ISO datetime
  authorId?: Id
}

/** Tasks/projects that live under a KR so KRs stay outcomes, not to-dos */
export interface Initiative {
  id: Id
  keyResultId: Id
  title: string
  done: boolean
  createdAt: string
}

export interface Settings {
  /** Days without a check-in before a KR counts as stale */
  staleDays: number
  /** Gap (expected - actual, percentage points) tolerated before "behind" */
  behindGapPp: number
  /** Gap beyond which status becomes "at risk" */
  atRiskGapPp: number
}
