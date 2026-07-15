import { CircleCheck, CircleMinus, TriangleAlert, FileText, Flag } from 'lucide-react'
import type { ObjectiveLifecycle, Status } from '../lib/types'
import { formatScore } from '../lib/format'

const STATUS_CONFIG: Record<
  Status,
  { label: string; color: string; bg: string; Icon: typeof CircleCheck }
> = {
  on_track: {
    label: 'On track',
    color: 'var(--color-status-good-text)',
    bg: 'color-mix(in srgb, var(--color-status-good) 12%, transparent)',
    Icon: CircleCheck,
  },
  behind: {
    label: 'Behind',
    color: '#8a5a00',
    bg: 'color-mix(in srgb, var(--color-status-warning) 18%, transparent)',
    Icon: CircleMinus,
  },
  at_risk: {
    label: 'At risk',
    color: 'var(--color-status-critical)',
    bg: 'color-mix(in srgb, var(--color-status-critical) 10%, transparent)',
    Icon: TriangleAlert,
  },
}

export function statusLabel(status: Status): string {
  return STATUS_CONFIG[status].label
}

export function StatusChip({ status, small = false }: { status: Status; small?: boolean }) {
  const { label, color, bg, Icon } = STATUS_CONFIG[status]
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-md font-medium ${
        small ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-0.5 text-xs'
      }`}
      style={{ color, backgroundColor: bg }}
    >
      <Icon size={small ? 11 : 13} strokeWidth={2.4} />
      {label}
    </span>
  )
}

export function LifecycleChip({
  lifecycle,
  finalScore,
}: {
  lifecycle: ObjectiveLifecycle
  finalScore?: number
}) {
  if (lifecycle === 'draft') {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-black/5 px-2 py-0.5 text-xs font-medium text-ink-secondary">
        <FileText size={12} /> Draft
      </span>
    )
  }
  if (lifecycle === 'closed') {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-accent-wash px-2 py-0.5 text-xs font-medium text-accent-strong">
        <Flag size={12} />
        Closed{finalScore !== undefined ? ` · ${formatScore(finalScore)}` : ''}
      </span>
    )
  }
  return null
}
