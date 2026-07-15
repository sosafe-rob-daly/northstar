# Research: How OKR tools work in the wild

Condensed findings from web research (July 2026) across OKR methodology sources
(Doerr / Google re:Work / What Matters / Felipe Castro / Christina Wodtke) and the
leading commercial tools: Perdoo, Quantive (Gtmhub), Lattice, Microsoft Viva Goals
(Ally.io), Weekdone, Profit.co, Mooncamp, WorkBoard, and Tability. This document is
the evidence base for `SPEC.md`.

## Methodology essentials

- **Objective** = qualitative, inspirational, time-bound, no numbers.
  **Key Result** = quantitative; canonical pattern *verb + metric + from X to Y*.
  1 objective → 3–5 KRs; 1–3 objectives per team per cycle.
- **Cadence**: nested dual cadence — annual strategic + quarterly tactical, with a
  weekly check-in heartbeat (Castro's "triple cadence"). Everyone on one cadence.
- **Committed vs aspirational**: committed OKRs expect 1.0 (a miss requires a
  postmortem); aspirational expect ~0.7 average. Mislabeling is a classic failure.
- **Scoring (Google)**: 0.0–1.0 per KR; objective = average of KR scores. Bands:
  0.7–1.0 green, 0.4–0.6 amber, 0.0–0.3 red. Org-wide 0.6–0.7 average is the sweet
  spot; consistent 1.0s = sandbagging. Scores must never feed compensation.
  Two schools: continuous progress only (Perdoo) vs end-of-cycle grading + written
  reflection (What Matters). Retros in the last 2 weeks of a cycle correlate with
  30–45% more goals completed next cycle.
- **Alignment**: directional ("a network, not an org chart"), not strict metric
  cascading — strict cascading is called out as an anti-pattern by Gothelf, Castro,
  Wodtke, and Tability. Flag orphans; never force full coverage.

## Measurement mechanics (converged across tools)

- **KR target types** (Perdoo's naming, mirrored by Quantive/Viva):
  *increase to*, *decrease to*, *binary*, *stay at/above*, *stay at/below*
  (+ milestone/percent-tracked variants in Profit.co/Mooncamp).
- **Progress math**: increase `(current−start)/(target−start)`; decrease
  `(start−current)/(start−target)`; guardrail types are binary met/unmet at any
  point in time (Viva: control KRs have no "Behind" state); clamp 0–100%.
- **Objective rollup**: equal-weight average of KRs is the base rule everywhere;
  optional per-KR weights (Lattice, Profit.co — weights sum to 1; Viva per-child
  contribution %). Child objectives roll up either as pseudo-KRs (Weekdone,
  PeopleForce), by explicit contribution weight (Viva), or children-only average
  (Quantive, GitLab).
- **Expected progress**: linear elapsed-time fraction of the cycle. Perdoo draws a
  grey expected line vs the blue actual line; Quantive a dashed "ideal progress"
  line; **Viva Goals draws an expected-progress tick directly on every progress
  bar**. This is the signature feature separating OKR tools from spreadsheets.
- **Auto status from pace** (gap = expected − actual, in percentage points):
  - Viva Goals (adopted in this app): gap ≤ 0 → On Track; 0–25 → Behind;
    > 25 → At Risk. Thresholds admin-configurable.
  - Weekdone (ratio-based "RAG+B"): ≥100% of expected → Blue (exceeded),
    66–100% → Green, 33–66% → Orange, 0–33% → Red.
  - WorkBoard: proprietary predictive green/yellow/red from progress-to-plan vs
    time remaining ("lean into the red" — no red means sandbagging).

## The check-in

Identical atomic payload in every tool researched: **new value + status/confidence
+ note** (Quantive adds a confidence scale; Weekdone wraps it in the weekly PPP —
Progress, Plans, Problems). Blockers should be specific and actionable. Progress is
objective, confidence is subjective — keep both. Weekly is the standard cadence
(weekly-updating teams complete ~43% more OKRs; skipping the rhythm makes
abandonment 3× more likely). Reminder defaults: Viva Monday 9:00, Weekdone Friday
17:00, WorkBoard's WoBot Fridays. Viva ships a **bulk check-in** flow walking every
KR not updated since the last reminder.

## Status vocabularies

- Perdoo: On track (green) / Needs attention (yellow) / Off track (red) / No status
  (gray); objective status = weakest child status; closing statuses
  (achieved/partially/missed/postponed).
- Lattice: exactly three — On Track / Progressing / Off Track, self-reported.
- Viva Goals: On Track / Behind / At Risk (+ lifecycle: Not Started, Closed,
  Postponed); manual status at check-in overrides the derived one.
- Weekdone: auto-only RAG+B (Exceeded blue / On Track green / At Risk yellow /
  Off Track red).

## Information architecture (common denominator)

Sidebar app with: **Dashboard/Home** (to-dos, my OKRs, needs-attention),
**Goals/OKR list** (filterable; expandable hierarchy; list/cascade/tree views),
**Alignment map** (tree of cards, expand/collapse, orphan discovery — Mooncamp),
**Check-ins** (dedicated ritual surface), **Dashboards/Reports** (progress vs
expected, status breakdown, team comparison, stale/no-progress lists with "ask for
update"), **People/Teams**, **Settings** (periods/cycles, statuses, thresholds).
A global time-period/cycle picker scopes every view.

## Entry UX (fields captured)

Objective: title, description, owner, team/level, time period, parent alignment,
type, tags, visibility, draft-vs-publish. KR: title, metric type + unit,
direction/target type, start/target values, owner, weight. Draft state for
future-cycle planning (Perdoo defaults future timeframes to Draft; Mooncamp has
"Plans" draft spaces; WorkBoard locks published OKRs).

## Hygiene / health features (pitfall countermeasures)

- Staleness indicators ("last updated 21 days ago"), check-in compliance reports
  (Profit.co check-ins report, "Say:Do ratio").
- Viva Goals **health indicators**: needs attention = not started 7 days in,
  unaligned, >5 KRs, or score >0.8 (sandbag flag); at risk = >25% off pace, past
  due, or no owner.
- Soft limits with warnings: >3 objectives per team, >5 KRs per objective.
- "KRs as tasks" litmus: require metric + start + target; give tasks a home as
  **initiatives** attached to KRs (first-class in Perdoo and Viva Goals).
- Separate KPIs (health metrics) from OKRs (change) — Perdoo's KPI Boards.

## Pitfalls the tooling must not create

Sandbagging (never tie scores to comp), set-and-forget (reminders + staleness),
too many OKRs (limits), KRs as tasks (initiatives + litmus test), BAU as OKRs
(KPI separation), rigid cascading (directional alignment + orphan flags).

## Full source lists

Kept in the research agents' reports; primary references: Google re:Work, What
Matters (Doerr), Perdoo support docs, Microsoft Learn (Viva Goals), Quantive help
center, Lattice help center, Weekdone help/blog, Profit.co answers/docs, Mooncamp
docs, workboard.com, Tability guides.
