# Northstar — a local-first OKR tool

A full-featured OKR (Objectives & Key Results) workspace: entry, measurement,
weekly check-ins, alignment, end-of-cycle grading, and reporting. Runs entirely
in the browser — no backend, data persists to localStorage.

Built from research into how OKR tools work in the wild (Perdoo, Quantive,
Lattice, Viva Goals, Weekdone, Profit.co, Mooncamp, WorkBoard, Tability) and OKR
methodology sources (Doerr, Google re:Work, What Matters). See
[SPEC.md](SPEC.md) for the product spec and [docs/RESEARCH.md](docs/RESEARCH.md)
for the research findings.

## Run it

```sh
npm install
npm run dev     # → http://localhost:5173
```

The app boots with a seeded demo workspace (a fictional B2B SaaS company, one
open cycle two weeks in, one closed & graded cycle). Reset or replace it any
time in **Settings → Data**.

## What's inside

- **Dashboard** — overall progress vs expected pace, actual-vs-expected trend
  line, objective status breakdown, team comparison, needs-attention list
  (at-risk, blocked, stale), and a check-in feed.
- **Objectives** — filterable list with expandable KR rows; create/edit with an
  inline KR builder that enforces the *metric + start + target* litmus test and
  warns on >5 KRs; committed vs aspirational types; draft → active → closed
  lifecycle.
- **Key results** — four metric types (number, percent, currency, done/not-done)
  and four directions (increase, decrease, stay above, stay below); weighted
  rollup to objective progress; initiatives (tasks) attached to KRs; expected
  progress tick on every progress bar.
- **Check-in** — the weekly ritual page: every KR sorted stalest-first, inline
  updates capturing value + status + note + blocker, full history kept.
- **Alignment** — directional alignment tree from company objectives down, with
  orphan detection (flagged, never forced).
- **Close & grade** — Google-style 0.0–1.0 scoring prefilled from measured
  progress, objective score as the average, written reflection, and a mandatory
  postmortem when a committed objective closes below 1.0.
- **Settings** — cycle management, configurable status thresholds and staleness
  window, JSON export/import, demo reset.

Status model: **on track / behind / at risk** (Viva Goals bands). A KR's status
is the owner's latest check-in assertion; before any check-in it derives from
the gap between expected progress (time elapsed) and actual progress.

## Stack

Vite · React 19 · TypeScript · Zustand (persisted) · React Router · Recharts ·
Tailwind CSS v4 · date-fns · lucide-react

```sh
npm run build   # type-check + production build
npm run lint    # oxlint
```
