import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { addDays, format, formatDistanceToNow, isAfter, parseISO } from 'date-fns'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Clock, OctagonAlert, TriangleAlert } from 'lucide-react'
import { useOkrStore } from '../store/store'
import { useSelectedCycle } from '../lib/useSelectedCycle'
import type { Status } from '../lib/types'
import {
  expectedProgress,
  krStatus,
  daysSinceCheckIn,
  latestCheckIn,
} from '../lib/progress'
import {
  buildProgressMap,
  checkInsForKr,
  computeObjective,
  initials,
  progressAtDate,
} from '../lib/selectors'
import { formatKrValue, formatPercent } from '../lib/format'
import { Card, EmptyState } from '../components/ui'
import { StatTile } from '../components/StatTile'
import { StatusChip, statusLabel } from '../components/StatusChip'

const STATUS_FILL: Record<Status, string> = {
  on_track: 'var(--color-status-good)',
  behind: 'var(--color-status-warning)',
  at_risk: 'var(--color-status-critical)',
}

export function Dashboard() {
  const { objectives, keyResults, checkIns, people, teams, settings } = useOkrStore()
  const cycle = useSelectedCycle()

  const data = useMemo(() => {
    if (!cycle) return undefined
    const now = new Date()
    const cycleObjectives = objectives.filter((o) => o.cycleId === cycle.id)
    const active = cycleObjectives.filter((o) => o.lifecycle === 'active')
    const scoped = cycleObjectives.filter((o) => o.lifecycle !== 'draft')
    const krIds = new Set(
      keyResults.filter((k) => scoped.some((o) => o.id === k.objectiveId)).map((k) => k.id),
    )
    const activeKrs = keyResults.filter((k) => active.some((o) => o.id === k.objectiveId))
    const expected = expectedProgress(cycle, now)

    // Overall progress: average across non-draft objectives (children fold via rollup)
    const progressMap = buildProgressMap(cycleObjectives, keyResults)
    const overall =
      scoped.length > 0
        ? scoped.reduce((sum, o) => sum + (progressMap.get(o.id) ?? 0), 0) / scoped.length
        : 0

    // Per-objective status
    const objStatuses = active.map((o) => ({
      objective: o,
      computed: computeObjective(o, objectives, keyResults, checkIns, cycle, settings),
    }))
    const statusCounts: Record<Status, number> = { on_track: 0, behind: 0, at_risk: 0 }
    for (const { computed } of objStatuses) statusCounts[computed.status]++

    // KR statuses + hygiene
    const krRows = activeKrs.map((kr) => {
      const history = checkInsForKr(checkIns, kr.id)
      return {
        kr,
        objective: active.find((o) => o.id === kr.objectiveId)!,
        status: krStatus(kr, history, cycle, settings, now),
        staleDays: daysSinceCheckIn(history, now),
        latest: latestCheckIn(history),
      }
    })
    const onTrackKrs = krRows.filter((r) => r.status === 'on_track').length
    const staleKrs = krRows.filter((r) => r.staleDays > settings.staleDays)

    // Trend: weekly points across the cycle; actual only up to today
    const start = parseISO(cycle.startDate)
    const end = parseISO(cycle.endDate)
    const points: { label: string; actual: number | null; expected: number }[] = []
    for (let d = start; !isAfter(d, end); d = addDays(d, 7)) {
      points.push({
        label: format(d, 'MMM d'),
        actual: isAfter(d, now)
          ? null
          : Math.round(progressAtDate(scoped, keyResults, checkIns, d) * 1000) / 10,
        expected: Math.round(expectedProgress(cycle, d) * 1000) / 10,
      })
    }
    const lastPoint = points[points.length - 1]
    if (!lastPoint || lastPoint.label !== format(end, 'MMM d')) {
      points.push({
        label: format(end, 'MMM d'),
        actual: isAfter(end, now) ? null : Math.round(progressAtDate(scoped, keyResults, checkIns, end) * 1000) / 10,
        expected: 100,
      })
    }
    if (!isAfter(now, end) && !isAfter(start, now)) {
      // ensure "today" is represented so the actual line reaches the present
      const todayLabel = format(now, 'MMM d')
      if (!points.some((p) => p.label === todayLabel)) {
        const idx = points.findIndex((p) => p.actual === null)
        const todayPoint = {
          label: todayLabel,
          actual: Math.round(progressAtDate(scoped, keyResults, checkIns, now) * 1000) / 10,
          expected: Math.round(expected * 1000) / 10,
        }
        if (idx === -1) points.push(todayPoint)
        else points.splice(idx, 0, todayPoint)
      }
    }

    // Team comparison
    const teamRows = teams
      .map((team) => {
        const teamObjectives = scoped.filter((o) => o.teamId === team.id)
        if (teamObjectives.length === 0) return null
        const avg =
          teamObjectives.reduce((sum, o) => sum + (progressMap.get(o.id) ?? 0), 0) /
          teamObjectives.length
        return { team, progress: avg, count: teamObjectives.length }
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .sort((a, b) => b.progress - a.progress)

    // Needs attention: at-risk KRs, blockers, stale KRs
    const attention = [
      ...krRows
        .filter((r) => r.status === 'at_risk')
        .map((r) => ({
          key: `risk-${r.kr.id}`,
          title: r.kr.title,
          objectiveId: r.objective.id,
          reason: r.latest?.blocker ? `Blocker: ${r.latest.blocker}` : 'Marked at risk',
          Icon: r.latest?.blocker ? OctagonAlert : TriangleAlert,
          status: 'at_risk' as Status,
        })),
      ...staleKrs
        .filter((r) => r.status !== 'at_risk')
        .map((r) => ({
          key: `stale-${r.kr.id}`,
          title: r.kr.title,
          objectiveId: r.objective.id,
          reason: Number.isFinite(r.staleDays)
            ? `No check-in for ${r.staleDays} days`
            : 'Never checked in',
          Icon: Clock,
          status: r.status,
        })),
    ].slice(0, 8)

    // Recent check-ins across the cycle
    const recent = checkIns
      .filter((c) => krIds.has(c.keyResultId))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, 6)
      .map((c) => ({
        checkIn: c,
        kr: keyResults.find((k) => k.id === c.keyResultId)!,
        author: people.find((p) => p.id === c.authorId),
      }))

    return {
      active,
      draftCount: cycleObjectives.filter((o) => o.lifecycle === 'draft').length,
      closedCount: cycleObjectives.filter((o) => o.lifecycle === 'closed').length,
      expected,
      overall,
      statusCounts,
      krTotal: krRows.length,
      onTrackKrs,
      staleCount: staleKrs.length,
      points,
      teamRows,
      attention,
      recent,
    }
  }, [cycle, objectives, keyResults, checkIns, people, teams, settings])

  if (!cycle || !data) return <EmptyState title="No cycles yet" hint="Create one in Settings." />

  const gapPp = Math.round((data.overall - data.expected) * 100)
  const statusTotal = data.statusCounts.on_track + data.statusCounts.behind + data.statusCounts.at_risk

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-ink">Dashboard</h1>
        <p className="text-xs text-ink-muted">{cycle.name}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Overall progress"
          value={formatPercent(data.overall)}
          delta={cycle.status === 'open' ? `${gapPp >= 0 ? '+' : ''}${gapPp} pp vs expected` : undefined}
          deltaGood={gapPp >= 0}
          sub={cycle.status === 'open' ? `Expected ${formatPercent(data.expected)} by today` : 'Cycle closed'}
        />
        <StatTile
          label="Objectives"
          value={String(data.active.length)}
          sub={`active · ${data.draftCount} draft · ${data.closedCount} closed`}
        />
        <StatTile
          label="Key results on track"
          value={data.krTotal > 0 ? `${data.onTrackKrs}/${data.krTotal}` : '—'}
          sub={data.krTotal > 0 ? formatPercent(data.onTrackKrs / data.krTotal) : 'No active KRs'}
        />
        <StatTile
          label="Need a check-in"
          value={String(data.staleCount)}
          delta={data.staleCount > 0 ? `> ${settings.staleDays} days old` : undefined}
          deltaGood={data.staleCount === 0}
          sub={
            data.staleCount > 0 ? (
              <Link to="/check-in" className="text-accent-strong hover:underline">
                Run the weekly check-in →
              </Link>
            ) : (
              'All fresh'
            )
          }
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Card className="p-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">Progress over time</h2>
            <div className="flex items-center gap-4 text-xs text-ink-secondary">
              <span className="flex items-center gap-1.5">
                <span className="h-0.5 w-4 rounded-full bg-accent" /> Actual
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-0 w-4 border-t-2 border-dashed border-ink-muted" /> Expected
              </span>
            </div>
          </div>
          <div className="mt-3 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.points} margin={{ top: 6, right: 12, bottom: 0, left: -18 }}>
                <CartesianGrid stroke="var(--color-grid)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: 'var(--color-ink-muted)', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--color-baseline)' }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  tick={{ fill: 'var(--color-ink-muted)', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-grid)',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value, name) => [
                    value === null || value === undefined ? '—' : `${value}%`,
                    name === 'actual' ? 'Actual' : 'Expected',
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="expected"
                  stroke="var(--color-ink-muted)"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                  activeDot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="var(--color-accent)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, stroke: 'var(--color-surface)', strokeWidth: 2 }}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="text-sm font-semibold text-ink">Objective status</h2>
          {statusTotal === 0 ? (
            <p className="mt-3 text-xs text-ink-muted">No active objectives.</p>
          ) : (
            <>
              <div className="mt-3 flex h-3 w-full gap-0.5 overflow-hidden rounded-[4px]">
                {(['on_track', 'behind', 'at_risk'] as Status[])
                  .filter((s) => data.statusCounts[s] > 0)
                  .map((s) => (
                    <div
                      key={s}
                      className="h-full"
                      style={{
                        width: `${(data.statusCounts[s] / statusTotal) * 100}%`,
                        backgroundColor: STATUS_FILL[s],
                      }}
                      title={`${statusLabel(s)}: ${data.statusCounts[s]}`}
                    />
                  ))}
              </div>
              <div className="mt-3 space-y-2">
                {(['on_track', 'behind', 'at_risk'] as Status[]).map((s) => (
                  <div key={s} className="flex items-center justify-between">
                    <StatusChip status={s} small />
                    <span className="text-sm font-semibold text-ink tabular-nums">
                      {data.statusCounts[s]}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-3 border-t border-grid pt-2.5 text-xs text-ink-muted">
                Status = owner's latest check-in, or pace vs time elapsed before any check-in.
              </p>
            </>
          )}
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Card className="p-4">
          <h2 className="text-sm font-semibold text-ink">Progress by team</h2>
          <div className="mt-3 space-y-3">
            {data.teamRows.length === 0 && <p className="text-xs text-ink-muted">No team objectives.</p>}
            {data.teamRows.map(({ team, progress, count }) => (
              <div key={team.id}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-ink-secondary">{team.name}</span>
                  <span className="font-semibold text-ink tabular-nums">{formatPercent(progress)}</span>
                </div>
                <div className="h-2 w-full rounded-[4px] bg-accent-wash">
                  <div
                    className="h-full rounded-l-[4px] bg-accent"
                    style={{
                      width: `${Math.min(1, progress) * 100}%`,
                      borderTopRightRadius: 4,
                      borderBottomRightRadius: 4,
                    }}
                    title={`${team.name}: ${formatPercent(progress)} across ${count} objective${count === 1 ? '' : 's'}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4 lg:col-span-2">
          <h2 className="text-sm font-semibold text-ink">Needs attention</h2>
          <div className="mt-2 divide-y divide-grid">
            {data.attention.length === 0 && (
              <p className="py-3 text-xs text-ink-muted">Nothing at risk, blocked, or stale. Nice.</p>
            )}
            {data.attention.map((item) => (
              <div key={item.key} className="flex items-center gap-3 py-2">
                <item.Icon
                  size={15}
                  className="shrink-0"
                  style={{ color: STATUS_FILL[item.status] }}
                />
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/objectives/${item.objectiveId}`}
                    className="block truncate text-sm text-ink hover:text-accent-strong hover:underline"
                  >
                    {item.title}
                  </Link>
                  <p className="truncate text-xs text-ink-muted">{item.reason}</p>
                </div>
                <StatusChip status={item.status} small />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <h2 className="text-sm font-semibold text-ink">Recent check-ins</h2>
        <div className="mt-2 divide-y divide-grid">
          {data.recent.length === 0 && <p className="py-3 text-xs text-ink-muted">No check-ins yet.</p>}
          {data.recent.map(({ checkIn, kr, author }) => (
            <div key={checkIn.id} className="flex gap-3 py-2.5">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-wash text-[11px] font-semibold text-accent-strong">
                {author ? initials(author.name) : '—'}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 text-xs">
                  <span className="font-medium text-ink">{author?.name ?? 'Someone'}</span>
                  <span className="text-ink-muted">
                    updated{' '}
                    <Link
                      to={`/objectives/${kr.objectiveId}`}
                      className="text-ink-secondary hover:text-accent-strong hover:underline"
                    >
                      {kr.title}
                    </Link>{' '}
                    to <span className="font-semibold text-ink">{formatKrValue(kr, checkIn.value)}</span>
                  </span>
                  <StatusChip status={checkIn.status} small />
                  <span className="text-ink-muted">
                    {formatDistanceToNow(parseISO(checkIn.createdAt), { addSuffix: true })}
                  </span>
                </div>
                {checkIn.note && <p className="mt-0.5 truncate text-xs text-ink-secondary">{checkIn.note}</p>}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
