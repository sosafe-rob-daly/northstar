import type {
  CheckIn,
  Cycle,
  Initiative,
  KeyResult,
  KrDirection,
  MetricType,
  Objective,
  ObjectiveType,
  OkrLevel,
  Person,
  Status,
  Team,
} from '../lib/types'
import { DEFAULT_SETTINGS } from '../lib/progress'
import type { OkrData } from '../store/store'

/**
 * Deterministic demo workspace for a fictional B2B SaaS company.
 * Open cycle: Q3 2026 (two weeks in). Closed, graded cycle: Q2 2026.
 */

interface TrailPoint {
  /** Fraction of the start->target span reached at this check-in */
  f?: number
  /** Absolute value override (for guardrail/boolean KRs) */
  v?: number
  status: Status
  note?: string
  blocker?: string
}

interface KrSpec {
  id: string
  title: string
  metricType: MetricType
  unit?: string
  direction: KrDirection
  start: number
  target: number
  owner?: string
  weight?: number
  finalScore?: number
  trail?: TrailPoint[]
  initiatives?: { title: string; done: boolean }[]
}

interface ObjectiveSpec {
  id: string
  title: string
  description?: string
  level: OkrLevel
  cycleId: string
  teamId?: string
  ownerId: string
  parentId?: string
  type: ObjectiveType
  lifecycle: 'draft' | 'active' | 'closed'
  tags?: string[]
  finalScore?: number
  reflection?: string
  /** Check-in dates (ISO) that this objective's KR trails map onto */
  dates: string[]
  krs: KrSpec[]
}

const Q3_DATES = ['2026-07-03', '2026-07-08', '2026-07-14']
const Q2_DATES = ['2026-04-10', '2026-04-24', '2026-05-08', '2026-05-22', '2026-06-05', '2026-06-19']
const Y2026_DATES = ['2026-02-13', '2026-03-13', '2026-04-10', '2026-05-08', '2026-06-12', '2026-07-10']

function krValue(spec: KrSpec, point: TrailPoint): number {
  if (point.v !== undefined) return point.v
  const f = point.f ?? 0
  return Math.round((spec.start + f * (spec.target - spec.start)) * 100) / 100
}

const SPECS: ObjectiveSpec[] = [
  // ---------- 2026 annual (open, long-term) ----------
  {
    id: 'o-ann1',
    title: 'Become the category leader in Europe',
    description:
      'The long-term bet for 2026: turn product momentum into undisputed leadership — revenue scale, customer love, and enterprise trust.',
    level: 'company',
    cycleId: 'cy-2026',
    ownerId: 'p-mara',
    type: 'aspirational',
    lifecycle: 'active',
    tags: ['strategy'],
    dates: Y2026_DATES,
    krs: [
      {
        id: 'kr-ann1-arr',
        title: 'Grow ARR from €8M to €20M',
        metricType: 'currency',
        unit: '€',
        direction: 'increase',
        start: 8_000_000,
        target: 20_000_000,
        owner: 'p-sofia',
        trail: [
          { f: 0.08, status: 'on_track' },
          { f: 0.15, status: 'on_track', note: 'Q1 closed at 105% of plan.' },
          { f: 0.2, status: 'on_track' },
          { f: 0.27, status: 'behind', note: 'Enterprise slippage from Q2 shows up here.' },
          { f: 0.33, status: 'behind' },
          { f: 0.37, status: 'behind', note: 'Need the mid-market machine to accelerate in H2.' },
        ],
      },
      {
        id: 'kr-ann1-nps',
        title: 'Raise NPS from 35 to 55',
        metricType: 'number',
        unit: 'NPS',
        direction: 'increase',
        start: 35,
        target: 55,
        owner: 'p-amelie',
        trail: [
          { f: 0.1, status: 'on_track' },
          { f: 0.15, status: 'on_track' },
          { f: 0.2, status: 'on_track' },
          { f: 0.25, status: 'behind', note: 'Onboarding detractors dragging the average.' },
          { f: 0.28, status: 'behind' },
          { f: 0.3, status: 'behind' },
        ],
      },
      {
        id: 'kr-ann1-certs',
        title: 'Achieve SOC 2 Type II and ISO 27001',
        metricType: 'boolean',
        direction: 'increase',
        start: 0,
        target: 1,
        owner: 'p-tomas',
        trail: [
          { v: 0, status: 'on_track' },
          { v: 0, status: 'on_track' },
          { v: 0, status: 'on_track' },
          { v: 0, status: 'on_track', note: 'SOC 2 done; ISO 27001 stage-2 audit booked for October.' },
          { v: 0, status: 'on_track' },
          { v: 0, status: 'on_track' },
        ],
      },
      {
        id: 'kr-ann1-grr',
        title: 'Keep gross revenue retention above 90%',
        metricType: 'percent',
        direction: 'stay_above',
        start: 88,
        target: 90,
        owner: 'p-amelie',
        trail: [
          { v: 91, status: 'on_track' },
          { v: 92, status: 'on_track' },
          { v: 91.5, status: 'on_track' },
          { v: 92, status: 'on_track' },
          { v: 93, status: 'on_track' },
          { v: 92.8, status: 'on_track' },
        ],
      },
    ],
  },

  // ---------- Q3 2026 (open) ----------
  {
    id: 'o-co1',
    title: 'Win the mid-market: become the obvious choice',
    description:
      'Mid-market is where we can outrun the incumbents. This quarter is about converting our product momentum into revenue and loyalty.',
    level: 'company',
    cycleId: 'cy-q3-2026',
    ownerId: 'p-mara',
    parentId: 'o-ann1',
    type: 'committed',
    lifecycle: 'active',
    tags: ['growth'],
    dates: Q3_DATES,
    krs: [
      {
        id: 'kr-co1-arr',
        title: 'Grow ARR from €12M to €15M',
        metricType: 'currency',
        unit: '€',
        direction: 'increase',
        start: 12_000_000,
        target: 15_000_000,
        owner: 'p-sofia',
        trail: [
          { f: 0.04, status: 'on_track', note: 'Two renewals closed early, pipeline healthy.' },
          { f: 0.09, status: 'on_track', note: 'Mid-market segment tracking ahead of plan.' },
          { f: 0.16, status: 'on_track', note: 'Q3 bookings pacing at 105% of plan.' },
        ],
      },
      {
        id: 'kr-co1-nps',
        title: 'Raise NPS from 41 to 50',
        metricType: 'number',
        unit: 'NPS',
        direction: 'increase',
        start: 41,
        target: 50,
        owner: 'p-amelie',
        trail: [
          { f: 0.0, status: 'on_track', note: 'Baseline confirmed with June survey wave.' },
          { f: 0.05, status: 'behind', note: 'Detractor theme: onboarding confusion. CS digging in.' },
          { f: 0.08, status: 'behind', note: 'Improvement plan agreed with Product; effects lag.' },
        ],
      },
      {
        id: 'kr-co1-churn',
        title: 'Keep monthly logo churn below 1.2%',
        metricType: 'percent',
        direction: 'stay_below',
        start: 1.4,
        target: 1.2,
        owner: 'p-amelie',
        trail: [
          { v: 1.4, status: 'behind', note: 'June churn above threshold; three at-risk accounts flagged.' },
          { v: 1.35, status: 'behind', note: 'Save plays running on two accounts.' },
          {
            v: 1.3,
            status: 'at_risk',
            note: 'One enterprise logo confirmed leaving in August.',
            blocker: 'Renewal decision at Vantico blocked on their procurement freeze.',
          },
        ],
      },
    ],
  },
  {
    id: 'o-co2',
    title: 'Make the product indispensable',
    description:
      'Usage depth is our moat. If weekly usage and time-to-value move, everything else follows.',
    level: 'company',
    cycleId: 'cy-q3-2026',
    ownerId: 'p-mara',
    parentId: 'o-ann1',
    type: 'aspirational',
    lifecycle: 'active',
    tags: ['product'],
    dates: Q3_DATES,
    krs: [
      {
        id: 'kr-co2-wau',
        title: 'Increase WAU/MAU from 32% to 45%',
        metricType: 'percent',
        direction: 'increase',
        start: 32,
        target: 45,
        owner: 'p-jonas',
        trail: [
          { f: 0.05, status: 'on_track' },
          { f: 0.1, status: 'on_track', note: 'Notifications revamp visibly lifting weekly return rate.' },
          { f: 0.15, status: 'on_track' },
        ],
      },
      {
        id: 'kr-co2-ttv',
        title: 'Cut median time-to-value from 14 to 7 days',
        metricType: 'number',
        unit: 'days',
        direction: 'decrease',
        start: 14,
        target: 7,
        owner: 'p-elif',
        trail: [
          { f: 0.07, status: 'on_track' },
          { f: 0.14, status: 'on_track', note: 'Guided setup A/B showing -1.5 days for treated cohort.' },
          { f: 0.2, status: 'on_track' },
        ],
      },
      {
        id: 'kr-co2-ai',
        title: 'Ship 3 lighthouse AI features to GA',
        metricType: 'number',
        unit: 'features',
        direction: 'increase',
        start: 0,
        target: 3,
        owner: 'p-tomas',
        trail: [
          { f: 0, status: 'on_track', note: 'Assistant beta on track for August GA.' },
          { f: 0, status: 'behind', note: 'Eval harness surfaced quality gaps; GA pushed two weeks.' },
          { f: 0, status: 'behind' },
        ],
      },
    ],
  },
  {
    id: 'o-prod1',
    title: 'Nail activation for new workspaces',
    description: 'First-week experience decides retention. Remove every ounce of friction.',
    level: 'team',
    cycleId: 'cy-q3-2026',
    teamId: 't-product',
    ownerId: 'p-jonas',
    parentId: 'o-co2',
    type: 'committed',
    lifecycle: 'active',
    tags: ['activation'],
    dates: Q3_DATES,
    krs: [
      {
        id: 'kr-prod1-onb',
        title: 'Lift onboarding completion from 55% to 75%',
        metricType: 'percent',
        direction: 'increase',
        start: 55,
        target: 75,
        owner: 'p-elif',
        trail: [
          { f: 0.05, status: 'on_track' },
          { f: 0.12, status: 'on_track', note: 'Checklist redesign shipped; early numbers positive.' },
          { f: 0.18, status: 'on_track' },
        ],
        initiatives: [
          { title: 'Redesign the setup checklist', done: true },
          { title: 'Add sample data on workspace creation', done: true },
          { title: 'Trigger nudge email on day-2 drop-off', done: false },
        ],
      },
      {
        id: 'kr-prod1-tickets',
        title: 'Reduce first-week support tickets per 100 signups from 18 to 10',
        metricType: 'number',
        unit: 'tickets',
        direction: 'decrease',
        start: 18,
        target: 10,
        owner: 'p-elif',
        trail: [
          { f: 0.03, status: 'on_track' },
          { f: 0.06, status: 'behind', note: 'Import-related tickets still dominate; fix in review.' },
          { f: 0.1, status: 'behind' },
        ],
      },
      {
        id: 'kr-prod1-setup',
        title: 'Launch guided setup for the top 5 use cases',
        metricType: 'number',
        unit: 'flows',
        direction: 'increase',
        start: 0,
        target: 5,
        owner: 'p-jonas',
        trail: [
          { v: 1, status: 'on_track' },
          { v: 2, status: 'on_track' },
          { v: 2, status: 'on_track', note: 'Third flow in QA, lands next week.' },
        ],
        initiatives: [
          { title: 'CRM sync guided flow', done: true },
          { title: 'Reporting starter pack flow', done: true },
          { title: 'Team-invite flow', done: false },
        ],
      },
    ],
  },
  {
    id: 'o-prod2',
    title: 'Ship the AI assistant beta people talk about',
    level: 'team',
    cycleId: 'cy-q3-2026',
    teamId: 't-product',
    ownerId: 'p-jonas',
    parentId: 'o-co2',
    type: 'aspirational',
    lifecycle: 'active',
    tags: ['ai', 'beta'],
    dates: Q3_DATES,
    krs: [
      {
        id: 'kr-prod2-beta',
        title: 'Activate 200 beta workspaces',
        metricType: 'number',
        unit: 'workspaces',
        direction: 'increase',
        start: 0,
        target: 200,
        owner: 'p-elif',
        trail: [
          { v: 12, status: 'on_track' },
          { v: 22, status: 'behind', note: 'Activation rate from waitlist lower than modeled.' },
          { v: 31, status: 'behind' },
        ],
      },
      {
        id: 'kr-prod2-ret',
        title: 'Reach 40% week-2 retention for assistant users',
        metricType: 'percent',
        direction: 'increase',
        start: 0,
        target: 40,
        owner: 'p-jonas',
        trail: [
          { v: 18, status: 'behind' },
          { v: 21, status: 'at_risk', note: 'Answer quality on long documents is the churn driver.' },
          {
            v: 24,
            status: 'at_risk',
            blocker: 'Waiting on eval dataset sign-off from legal for customer-data fine-tuning.',
          },
        ],
      },
      {
        id: 'kr-prod2-wait',
        title: 'Grow the beta waitlist to 1,000 signups',
        metricType: 'number',
        unit: 'signups',
        direction: 'increase',
        start: 0,
        target: 1000,
        owner: 'p-lucas',
        trail: [
          { v: 180, status: 'on_track' },
          { v: 420, status: 'on_track', note: 'Launch post outperformed; 40% from organic.' },
          { v: 610, status: 'on_track' },
        ],
      },
    ],
  },
  {
    id: 'o-eng1',
    title: 'Make the platform fast and boringly reliable',
    level: 'team',
    cycleId: 'cy-q3-2026',
    teamId: 't-eng',
    ownerId: 'p-tomas',
    parentId: 'o-co2',
    type: 'committed',
    lifecycle: 'active',
    tags: ['platform'],
    dates: Q3_DATES,
    krs: [
      {
        id: 'kr-eng1-p95',
        title: 'Cut p95 API latency from 480ms to 250ms',
        metricType: 'number',
        unit: 'ms',
        direction: 'decrease',
        start: 480,
        target: 250,
        owner: 'p-priya',
        trail: [
          { f: 0.1, status: 'on_track', note: 'Query-plan fixes on the two worst endpoints.' },
          { f: 0.17, status: 'on_track' },
          { f: 0.22, status: 'on_track', note: 'Caching layer for workspace config shipped.' },
        ],
      },
      {
        id: 'kr-eng1-uptime',
        title: 'Keep uptime above 99.95%',
        metricType: 'percent',
        direction: 'stay_above',
        start: 99.9,
        target: 99.95,
        owner: 'p-tomas',
        trail: [
          { v: 99.97, status: 'on_track' },
          { v: 99.96, status: 'on_track' },
          { v: 99.97, status: 'on_track' },
        ],
      },
      {
        id: 'kr-eng1-ci',
        title: 'Reduce CI pipeline time from 22 to 10 minutes',
        metricType: 'number',
        unit: 'min',
        direction: 'decrease',
        start: 22,
        target: 10,
        owner: 'p-priya',
        trail: [
          { f: 0.05, status: 'on_track' },
          { f: 0.08, status: 'behind', note: 'Test sharding blocked behind flaky-test cleanup.' },
          { f: 0.12, status: 'behind' },
        ],
        initiatives: [
          { title: 'Quarantine flaky tests', done: true },
          { title: 'Shard integration suite across 8 runners', done: false },
        ],
      },
    ],
  },
  {
    id: 'o-sales1',
    title: 'Build a repeatable mid-market sales machine',
    level: 'team',
    cycleId: 'cy-q3-2026',
    teamId: 't-sales',
    ownerId: 'p-sofia',
    parentId: 'o-co1',
    type: 'committed',
    lifecycle: 'active',
    tags: ['pipeline'],
    dates: Q3_DATES,
    krs: [
      {
        id: 'kr-sales1-arr',
        title: 'Close €1.8M new mid-market ARR',
        metricType: 'currency',
        unit: '€',
        direction: 'increase',
        start: 0,
        target: 1_800_000,
        owner: 'p-daniel',
        trail: [
          { f: 0.06, status: 'on_track' },
          { f: 0.12, status: 'on_track', note: 'Two logos closed; three in contracting.' },
          { f: 0.19, status: 'on_track' },
        ],
      },
      {
        id: 'kr-sales1-win',
        title: 'Lift win rate from 18% to 25%',
        metricType: 'percent',
        direction: 'increase',
        start: 18,
        target: 25,
        owner: 'p-sofia',
        trail: [
          { f: 0.0, status: 'on_track' },
          { f: 0.07, status: 'behind', note: 'Losses to incumbent on security review depth.' },
          { f: 0.1, status: 'behind' },
        ],
      },
      {
        id: 'kr-sales1-cycle',
        title: 'Shorten average sales cycle from 92 to 60 days',
        metricType: 'number',
        unit: 'days',
        direction: 'decrease',
        start: 92,
        target: 60,
        owner: 'p-daniel',
        trail: [
          { f: 0.02, status: 'behind' },
          { f: 0.03, status: 'at_risk', note: 'Legal review is the long pole on every deal.' },
          {
            f: 0.05,
            status: 'at_risk',
            blocker: 'Standard DPA rewrite stuck with external counsel since June.',
          },
        ],
      },
    ],
  },
  {
    id: 'o-mkt1',
    title: 'Own the category conversation',
    level: 'team',
    cycleId: 'cy-q3-2026',
    teamId: 't-marketing',
    ownerId: 'p-hannah',
    parentId: 'o-co1',
    type: 'aspirational',
    lifecycle: 'active',
    tags: ['brand'],
    dates: Q3_DATES,
    krs: [
      {
        id: 'kr-mkt1-sql',
        title: 'Grow SQLs per month from 120 to 200',
        metricType: 'number',
        unit: 'SQLs',
        direction: 'increase',
        start: 120,
        target: 200,
        owner: 'p-lucas',
        trail: [
          { f: 0.08, status: 'on_track' },
          { f: 0.14, status: 'on_track', note: 'Webinar series converting at 2x benchmark.' },
          { f: 0.2, status: 'on_track' },
        ],
      },
      {
        id: 'kr-mkt1-organic',
        title: 'Grow organic sessions from 85k to 130k per month',
        metricType: 'number',
        unit: 'sessions',
        direction: 'increase',
        start: 85_000,
        target: 130_000,
        owner: 'p-lucas',
        trail: [
          { f: 0.02, status: 'on_track' },
          { f: 0.05, status: 'behind', note: 'Algorithm update hit two pillar pages.' },
          { f: 0.07, status: 'behind' },
        ],
      },
      {
        id: 'kr-mkt1-analyst',
        title: 'Land 2 major analyst report placements',
        metricType: 'number',
        unit: 'reports',
        direction: 'increase',
        start: 0,
        target: 2,
        owner: 'p-hannah',
        trail: [
          { v: 0, status: 'on_track' },
          { v: 1, status: 'on_track', note: 'Included in the mid-year market guide.' },
          { v: 1, status: 'on_track' },
        ],
      },
    ],
  },
  {
    id: 'o-cs1',
    title: 'Turn customers into promoters',
    level: 'team',
    cycleId: 'cy-q3-2026',
    teamId: 't-cs',
    ownerId: 'p-amelie',
    parentId: 'o-co1',
    type: 'committed',
    lifecycle: 'active',
    tags: ['retention'],
    dates: Q3_DATES,
    krs: [
      {
        id: 'kr-cs1-resp',
        title: 'Raise NPS survey response rate from 12% to 30%',
        metricType: 'percent',
        direction: 'increase',
        start: 12,
        target: 30,
        owner: 'p-amelie',
        trail: [
          { f: 0.1, status: 'on_track' },
          { f: 0.2, status: 'on_track', note: 'In-app survey placement doubled responses.' },
          { f: 0.3, status: 'on_track' },
        ],
      },
      {
        id: 'kr-cs1-qbr',
        title: 'Run QBRs with 90% of top-100 accounts (from 40%)',
        metricType: 'percent',
        direction: 'increase',
        start: 40,
        target: 90,
        owner: 'p-amelie',
        trail: [
          { f: 0.04, status: 'on_track' },
          { f: 0.08, status: 'behind', note: 'Two CSMs out; schedule slipping.' },
          { f: 0.12, status: 'behind' },
        ],
      },
      {
        id: 'kr-cs1-exp',
        title: 'Generate €600k expansion revenue',
        metricType: 'currency',
        unit: '€',
        direction: 'increase',
        start: 0,
        target: 600_000,
        owner: 'p-amelie',
        trail: [
          { f: 0.08, status: 'on_track' },
          { f: 0.15, status: 'on_track' },
          { f: 0.22, status: 'on_track', note: 'Seat expansions at three scale-ups closed.' },
        ],
      },
    ],
  },
  {
    id: 'o-elif1',
    title: 'Become the voice of the new user',
    level: 'individual',
    cycleId: 'cy-q3-2026',
    teamId: 't-product',
    ownerId: 'p-elif',
    parentId: 'o-prod1',
    type: 'aspirational',
    lifecycle: 'active',
    tags: [],
    dates: Q3_DATES,
    krs: [
      {
        id: 'kr-elif1-interviews',
        title: 'Run 30 new-user interviews',
        metricType: 'number',
        unit: 'interviews',
        direction: 'increase',
        start: 0,
        target: 30,
        owner: 'p-elif',
        trail: [
          { v: 3, status: 'on_track' },
          { v: 6, status: 'on_track' },
          { v: 9, status: 'on_track', note: 'Recurring theme: users can’t find the import flow.' },
        ],
      },
      {
        id: 'kr-elif1-exp',
        title: 'Ship 6 onboarding experiments',
        metricType: 'number',
        unit: 'experiments',
        direction: 'increase',
        start: 0,
        target: 6,
        owner: 'p-elif',
        trail: [
          { v: 0, status: 'on_track' },
          { v: 1, status: 'behind', note: 'Experiment queue blocked behind analytics migration.' },
          { v: 1, status: 'behind' },
        ],
      },
    ],
  },
  {
    id: 'o-prod3',
    title: 'Explore a self-serve motion for SMB',
    description: 'Draft: scoping whether PLG for the SMB segment deserves a Q4 bet.',
    level: 'team',
    cycleId: 'cy-q3-2026',
    teamId: 't-product',
    ownerId: 'p-jonas',
    type: 'aspirational',
    lifecycle: 'draft',
    tags: ['exploration'],
    dates: [],
    krs: [
      {
        id: 'kr-prod3-pricing',
        title: 'Validate self-serve pricing with 25 prospect conversations',
        metricType: 'number',
        unit: 'conversations',
        direction: 'increase',
        start: 0,
        target: 25,
        owner: 'p-jonas',
      },
      {
        id: 'kr-prod3-funnel',
        title: 'Prototype signup-to-paid funnel and get 10 test purchases',
        metricType: 'number',
        unit: 'purchases',
        direction: 'increase',
        start: 0,
        target: 10,
        owner: 'p-elif',
      },
    ],
  },

  // ---------- Q2 2026 (closed, graded) ----------
  {
    id: 'o-q2co1',
    title: 'Prove we are enterprise-ready',
    level: 'company',
    cycleId: 'cy-q2-2026',
    ownerId: 'p-mara',
    parentId: 'o-ann1',
    type: 'committed',
    lifecycle: 'closed',
    tags: ['enterprise'],
    finalScore: 0.8,
    reflection:
      'SOC 2 landed on time and uptime held, but we closed 6 of 8 enterprise deals — two slipped on security-review depth, which is now a Q3 sales KR. Committed miss on deals: root cause was a missing DPA fast-track, fixed going forward.',
    dates: Q2_DATES,
    krs: [
      {
        id: 'kr-q2co1-soc2',
        title: 'Achieve SOC 2 Type II attestation',
        metricType: 'boolean',
        direction: 'increase',
        start: 0,
        target: 1,
        owner: 'p-tomas',
        finalScore: 1.0,
        trail: [
          { v: 0, status: 'on_track', note: 'Observation window open.' },
          { v: 0, status: 'on_track' },
          { v: 0, status: 'on_track' },
          { v: 0, status: 'behind', note: 'Auditor requested extra evidence on access reviews.' },
          { v: 0, status: 'on_track' },
          { v: 1, status: 'on_track', note: 'Report issued June 12.' },
        ],
      },
      {
        id: 'kr-q2co1-deals',
        title: 'Close 8 enterprise deals',
        metricType: 'number',
        unit: 'deals',
        direction: 'increase',
        start: 0,
        target: 8,
        owner: 'p-sofia',
        finalScore: 0.6,
        trail: [
          { v: 1, status: 'on_track' },
          { v: 2, status: 'on_track' },
          { v: 3, status: 'behind' },
          { v: 4, status: 'behind', note: 'Two deals stuck in security review.' },
          { v: 5, status: 'behind' },
          { v: 6, status: 'behind', note: 'Finished at 6 of 8.' },
        ],
      },
      {
        id: 'kr-q2co1-uptime',
        title: 'Hold uptime above 99.9% every month',
        metricType: 'percent',
        direction: 'stay_above',
        start: 99.85,
        target: 99.9,
        owner: 'p-tomas',
        finalScore: 1.0,
        trail: [
          { v: 99.95, status: 'on_track' },
          { v: 99.93, status: 'on_track' },
          { v: 99.96, status: 'on_track' },
          { v: 99.92, status: 'on_track' },
          { v: 99.95, status: 'on_track' },
          { v: 99.96, status: 'on_track' },
        ],
      },
    ],
  },
  {
    id: 'o-q2prod1',
    title: 'Fix the leaky onboarding funnel',
    level: 'team',
    cycleId: 'cy-q2-2026',
    teamId: 't-product',
    ownerId: 'p-jonas',
    parentId: 'o-q2co1',
    type: 'aspirational',
    lifecycle: 'closed',
    tags: ['activation'],
    finalScore: 0.6,
    reflection:
      'A 0.6 on an aspirational objective is a solid outcome. Signup-to-active moved 28%→39% (target 50%). The instrumented funnel finally gives us truth — carrying activation work into Q3 with sharper KRs.',
    dates: Q2_DATES,
    krs: [
      {
        id: 'kr-q2prod1-active',
        title: 'Lift signup-to-active from 28% to 50%',
        metricType: 'percent',
        direction: 'increase',
        start: 28,
        target: 50,
        owner: 'p-elif',
        finalScore: 0.5,
        trail: [
          { f: 0.1, status: 'on_track' },
          { f: 0.18, status: 'on_track' },
          { f: 0.25, status: 'behind' },
          { f: 0.35, status: 'behind', note: 'Signup flow rebuild shipped late.' },
          { f: 0.45, status: 'behind' },
          { f: 0.5, status: 'behind' },
        ],
      },
      {
        id: 'kr-q2prod1-instr',
        title: 'Instrument all 12 funnel steps with reliable analytics',
        metricType: 'number',
        unit: 'steps',
        direction: 'increase',
        start: 0,
        target: 12,
        owner: 'p-priya',
        finalScore: 0.9,
        trail: [
          { v: 2, status: 'on_track' },
          { v: 4, status: 'on_track' },
          { v: 6, status: 'on_track' },
          { v: 8, status: 'on_track' },
          { v: 10, status: 'on_track' },
          { v: 11, status: 'on_track', note: 'Last step blocked on a vendor API; done in July.' },
        ],
      },
      {
        id: 'kr-q2prod1-drop',
        title: 'Cut day-1 drop-off from 45% to 30%',
        metricType: 'percent',
        direction: 'decrease',
        start: 45,
        target: 30,
        owner: 'p-elif',
        finalScore: 0.4,
        trail: [
          { f: 0.05, status: 'on_track' },
          { f: 0.1, status: 'behind' },
          { f: 0.15, status: 'behind' },
          { f: 0.25, status: 'behind' },
          { f: 0.33, status: 'behind' },
          { f: 0.4, status: 'behind', note: 'Ended at 39% drop-off vs 30% target.' },
        ],
      },
    ],
  },
  {
    id: 'o-q2sales1',
    title: 'Land the first 20 mid-market logos',
    level: 'team',
    cycleId: 'cy-q2-2026',
    teamId: 't-sales',
    ownerId: 'p-sofia',
    parentId: 'o-q2co1',
    type: 'committed',
    lifecycle: 'closed',
    tags: ['pipeline'],
    finalScore: 0.7,
    reflection:
      'Committed objective closed at 0.7 — postmortem: we hired the second AE six weeks late, which cost roughly four deals. Hiring lead time is now built into capacity planning.',
    dates: Q2_DATES,
    krs: [
      {
        id: 'kr-q2sales1-logos',
        title: 'Sign 20 mid-market logos',
        metricType: 'number',
        unit: 'logos',
        direction: 'increase',
        start: 0,
        target: 20,
        owner: 'p-daniel',
        finalScore: 0.7,
        trail: [
          { v: 2, status: 'on_track' },
          { v: 4, status: 'on_track' },
          { v: 7, status: 'behind' },
          { v: 9, status: 'behind', note: 'AE #2 started; ramp will take a month.' },
          { v: 12, status: 'behind' },
          { v: 14, status: 'behind' },
        ],
      },
      {
        id: 'kr-q2sales1-pipe',
        title: 'Build €4M qualified pipeline',
        metricType: 'currency',
        unit: '€',
        direction: 'increase',
        start: 0,
        target: 4_000_000,
        owner: 'p-sofia',
        finalScore: 0.8,
        trail: [
          { f: 0.15, status: 'on_track' },
          { f: 0.3, status: 'on_track' },
          { f: 0.45, status: 'on_track' },
          { f: 0.55, status: 'behind' },
          { f: 0.7, status: 'on_track' },
          { f: 0.8, status: 'on_track' },
        ],
      },
    ],
  },
]

export function buildSeed(): OkrData {
  const cycles: Cycle[] = [
    {
      id: 'cy-q3-2026',
      name: 'Q3 2026',
      type: 'quarter',
      startDate: '2026-07-01',
      endDate: '2026-09-30',
      status: 'open',
    },
    {
      id: 'cy-q2-2026',
      name: 'Q2 2026',
      type: 'quarter',
      startDate: '2026-04-01',
      endDate: '2026-06-30',
      status: 'closed',
    },
    {
      id: 'cy-2026',
      name: '2026',
      type: 'year',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      status: 'open',
    },
  ]

  const teams: Team[] = [
    { id: 't-product', name: 'Product', colorSlot: 1 },
    { id: 't-eng', name: 'Engineering', colorSlot: 2 },
    { id: 't-sales', name: 'Sales', colorSlot: 3 },
    { id: 't-marketing', name: 'Marketing', colorSlot: 4 },
    { id: 't-cs', name: 'Customer Success', colorSlot: 5 },
  ]

  const people: Person[] = [
    { id: 'p-mara', name: 'Mara Voss', role: 'CEO' },
    { id: 'p-jonas', name: 'Jonas Weber', role: 'VP Product', teamId: 't-product' },
    { id: 'p-elif', name: 'Elif Kaya', role: 'Product Manager', teamId: 't-product' },
    { id: 'p-tomas', name: 'Tomás Rivera', role: 'VP Engineering', teamId: 't-eng' },
    { id: 'p-priya', name: 'Priya Nair', role: 'Staff Engineer', teamId: 't-eng' },
    { id: 'p-sofia', name: 'Sofia Lindqvist', role: 'VP Sales', teamId: 't-sales' },
    { id: 'p-daniel', name: 'Daniel Okafor', role: 'Account Executive', teamId: 't-sales' },
    { id: 'p-hannah', name: 'Hannah Fischer', role: 'VP Marketing', teamId: 't-marketing' },
    { id: 'p-lucas', name: 'Lucas Meyer', role: 'Growth Marketer', teamId: 't-marketing' },
    { id: 'p-amelie', name: 'Amelie Dubois', role: 'Head of CS', teamId: 't-cs' },
  ]

  const objectives: Objective[] = []
  const keyResults: KeyResult[] = []
  const checkIns: CheckIn[] = []
  const initiatives: Initiative[] = []

  for (const spec of SPECS) {
    const cycle = cycles.find((c) => c.id === spec.cycleId)!
    const createdAt = `${cycle.startDate}T09:00:00.000Z`
    const lastDate = spec.dates[spec.dates.length - 1]
    objectives.push({
      id: spec.id,
      title: spec.title,
      description: spec.description,
      level: spec.level,
      cycleId: spec.cycleId,
      teamId: spec.teamId,
      ownerId: spec.ownerId,
      parentId: spec.parentId,
      type: spec.type,
      lifecycle: spec.lifecycle,
      tags: spec.tags ?? [],
      finalScore: spec.finalScore,
      reflection: spec.reflection,
      createdAt,
      updatedAt: lastDate ? `${lastDate}T09:00:00.000Z` : createdAt,
    })

    for (const krSpec of spec.krs) {
      const trail = krSpec.trail ?? []
      const lastPoint = trail[trail.length - 1]
      keyResults.push({
        id: krSpec.id,
        objectiveId: spec.id,
        title: krSpec.title,
        metricType: krSpec.metricType,
        unit: krSpec.unit,
        direction: krSpec.direction,
        startValue: krSpec.start,
        targetValue: krSpec.target,
        currentValue: lastPoint ? krValue(krSpec, lastPoint) : krSpec.start,
        ownerId: krSpec.owner,
        weight: krSpec.weight ?? 1,
        finalScore: krSpec.finalScore,
        createdAt,
      })

      trail.forEach((point, i) => {
        checkIns.push({
          id: `ci-${krSpec.id}-${i}`,
          keyResultId: krSpec.id,
          value: krValue(krSpec, point),
          status: point.status,
          note: point.note,
          blocker: point.blocker,
          createdAt: `${spec.dates[i]}T09:00:00.000Z`,
          authorId: krSpec.owner ?? spec.ownerId,
        })
      })

      krSpec.initiatives?.forEach((init, i) => {
        initiatives.push({
          id: `in-${krSpec.id}-${i}`,
          keyResultId: krSpec.id,
          title: init.title,
          done: init.done,
          createdAt,
        })
      })
    }
  }

  return {
    cycles,
    teams,
    people,
    objectives,
    keyResults,
    checkIns,
    initiatives,
    settings: { ...DEFAULT_SETTINGS },
  }
}
