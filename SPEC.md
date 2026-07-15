# Northstar — OKR Tool Specification

A local-first, full-featured OKR (Objectives & Key Results) tool: entry, measurement,
check-ins, alignment, grading, and reporting. Built as a TypeScript/React single-page
app with localStorage persistence, seeded with a realistic demo workspace.

The design synthesizes research on OKR methodology (Doerr / Google re:Work / What
Matters) and the feature sets of Perdoo, Quantive (Gtmhub), Lattice, Microsoft Viva
Goals, Weekdone, Profit.co, Mooncamp, WorkBoard, and Tability. Sources and detailed
findings are in `docs/RESEARCH.md`.

---

## 1. Domain model

### Cycle
Time period OKRs live in, with a horizon type — the nested dual cadence from the
methodology research (annual strategic + quarterly tactical, plus custom ranges).
`id, name, type: quarter | year | custom, startDate, endDate, status: open | closed`

The cycle picker groups by horizon. Objectives in a shorter cycle may align to a
parent objective in any overlapping longer-horizon cycle (quarter → year), and
the alignment view shows the long-term layer above the selected cycle.

### Team & Person
Flat org model: teams with a fixed palette color slot; people with a role and
optional team. Company-level OKRs have no team.

### Objective
Qualitative, inspirational, time-bound. Never carries a number itself.

- `level`: company | team | individual (individual OKRs optional, per methodology)
- `type`: **committed** (expected score 1.0; a miss requires an explanation) vs
  **aspirational** (moonshot; ~0.7 is success)
- `lifecycle`: **draft → active → closed** (the lifecycle every researched tool uses)
- `parentId`: directional alignment to a parent objective — a network, not a strict
  cascade (strict metric-decomposition cascading is an industry anti-pattern)
- `finalScore` (0.0–1.0) + `reflection`, set by the close-and-grade flow

### Key Result
Quantitative success criterion. Canonical pattern: *verb + metric + from X to Y*.

- `metricType`: number | percent | currency | boolean
- `direction`: **increase** | **decrease** | **stay_above** | **stay_below**
  (the guardrail/control types, per Perdoo "stay at or above/below" and Viva
  "quality KRs")
- `startValue, targetValue, currentValue`, free-text `unit`
- `weight` (relative, default 1) for weighted objective rollup
- `finalScore` set at grading time
- 3–5 KRs per objective recommended; the form warns beyond 5 ("too many OKRs"
  anti-pattern) and requires metric + start + target ("KRs as tasks" litmus test)

### Check-in
The atomic weekly update, identical across all researched tools:
**new value + status + note**, plus an optional explicit **blocker**.
`value, status, note?, blocker?, createdAt, authorId`
Full history is kept for value-over-time and status-over-time charts.
A check-in updates the KR's `currentValue`.

### Initiative
Lightweight tasks attached to a KR — so outputs have a home and KRs stay outcomes
(Perdoo makes initiatives first-class; this is the pitfall countermeasure for
"KRs as tasks").

### Settings
`staleDays` (check-in staleness threshold, default 7), `behindGapPp` (default 5),
`atRiskGapPp` (default 25) — the status thresholds are configurable, as in Viva Goals.

---

## 2. Computation rules (the measurement engine)

### KR progress (0–1, clamped)
- increase: `(current − start) / (target − start)`
- decrease: `(start − current) / (start − target)`
- stay_above: `current ≥ target ? 1 : 0` (binary at any point in time — control KRs
  have no "partially met")
- stay_below: `current ≤ target ? 1 : 0`
- boolean: `current ≥ 1 ? 1 : 0`
- Guard: `target == start` degrades to met/not-met.

### Objective progress
Weighted average of its KRs, with aligned child objectives folded in as
equal-weight pseudo-KRs (the Weekdone/PeopleForce rollup model), recursively:

`(Σ krProgress·weight + Σ childProgress) / (Σ weight + childCount)`

A closed objective reports its `finalScore` instead of live progress.

### Expected progress ("where should we be by now?")
`elapsedDays / totalCycleDays`, clamped 0–1. Drawn as a reference line on every
trend chart (Perdoo's expected-progress grey line; Quantive's "ideal progress").

### Status (traffic light)
One three-value scale everywhere: **on_track / behind / at_risk**
(Viva Goals' exact model).

- **Auto (pace) status** from the gap `expected − actual` in percentage points:
  `gap ≤ 5` → on track, `5 < gap ≤ 25` → behind, `gap > 25` → at risk
  (Viva Goals bands; thresholds configurable in Settings).
- **Owner-asserted status** is chosen at each check-in. *Progress is objective,
  confidence is subjective* — the owner's latest assertion wins for a KR;
  before any check-in exists, pace status is used.
- **Objective status** = pace status of rolled-up progress, escalated one notch
  (on_track → behind) if any KR is at risk (early-warning, cf. Perdoo's
  "weakest status" rule).

### Scoring & grading (end of cycle)
Continuous progress is the default measure (Perdoo school); optional Google-style
grading at close (What Matters school):

- Close flow prefills each KR's score with its live progress (0.0–1.0), allows
  subjective adjustment, computes the objective score as the average, and captures
  a written reflection.
- Committed objectives closing below 1.0 prompt for a postmortem-style explanation.
- Score bands for display: **0.7–1.0 green, 0.4–0.6 amber, 0.0–0.3 red** (Google).
  0.6–0.7 org-wide average is the sweet spot; consistent 1.0s = sandbagging.

### Hygiene signals
- **Stale**: no check-in for > `staleDays` (default 7 — weekly cadence is the
  industry heartbeat; weekly-updating teams complete ~43% more OKRs).
- **Orphan**: an active team/individual objective with no parent alignment
  (flagged, never forced — directional alignment, not mandatory cascade).
- **Overloaded**: > 5 KRs on an objective (creation-time warning).

---

## 3. Information architecture

Sidebar navigation (the common IA across Perdoo/Quantive/Mooncamp/Profit.co),
with a global **cycle picker** — every page is scoped to the selected cycle:

1. **Dashboard** — the reporting home:
   - KPI row (stat tiles): overall progress with delta vs expected, objective
     count, % of KRs on track, KRs needing update (stale)
   - Status breakdown (objectives by status, part-to-whole)
   - **Progress over time vs expected** line chart (actual line + expected
     reference — the signature OKR chart)
   - Team comparison (progress by team, single-hue bars)
   - Needs-attention list: at-risk + stale + blocked items
   - Recent check-ins feed
2. **Objectives** — entry & tracking workspace:
   - Filterable list (level, team, status, lifecycle) of expandable objective
     cards; KR rows with progress bars, status chips, owner, quick check-in
   - Create/edit objective with inline KR builder
   - Objective detail: meta, KR list with sparklines + check-in history timeline,
     initiatives, aligned children, close-and-grade flow
3. **Check-in** — the weekly ritual page (Tability-style): all of the selected
   cycle's KRs grouped by objective, each with its last update, staleness flag,
   and an inline check-in form (value, status, note, blocker)
4. **Alignment** — expandable tree from company objectives down (Lattice Tree /
   Perdoo Map / Mooncamp Alignment Map), with progress + status on every node
   and an orphans section
5. **People** — teams and people management (CRUD, ownership counts)
6. **Settings** — cycles CRUD (open/close), status thresholds, staleness window,
   JSON export/import, reset demo data

## 4. UX conventions

- Status colors use the reserved status palette (good green / warning amber /
  serious orange-red) and always ship with an icon + label, never color alone.
- Progress bars: thin, rounded data-end; blue accent fill on a light track.
- Charts follow the dataviz method: 2px lines, hairline solid gridlines, direct
  labels used sparingly, tooltips that enhance rather than gate, one axis, no pies
  for close comparisons, teams keep their fixed palette slot in every chart.
- Numbers: compact formatting (12.9K, €4.2M); scores as 0.0–1.0 with one decimal.
- Every destructive action confirms; check-ins are editable history (deletable,
  reverting the KR's current value).

## 5. Non-goals (this version)

Multi-user auth/permissions, real-time collaboration, integrations (Slack/Jira),
notifications/reminders (staleness surfaces in-app instead), KR weighting UI
auto-rebalance, and a backend — state persists to localStorage and round-trips
via JSON export/import.

## 6. Tech

Vite + React 19 + TypeScript (strict), Zustand w/ persist, React Router,
Recharts, Tailwind CSS v4, date-fns, lucide-react. No server; `npm run dev`
serves on localhost.
