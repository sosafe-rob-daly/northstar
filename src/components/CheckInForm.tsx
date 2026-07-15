import { useState } from 'react'
import { CircleCheck, CircleMinus, TriangleAlert } from 'lucide-react'
import { useOkrStore } from '../store/store'
import type { KeyResult, Status } from '../lib/types'
import { formatKrValue } from '../lib/format'
import { Button, Field, inputBase, inputClass } from './ui'

const STATUS_OPTIONS: { value: Status; label: string; Icon: typeof CircleCheck; active: string }[] = [
  { value: 'on_track', label: 'On track', Icon: CircleCheck, active: 'border-status-good text-status-good-text bg-status-good/10' },
  { value: 'behind', label: 'Behind', Icon: CircleMinus, active: 'border-status-warning text-[#8a5a00] bg-status-warning/15' },
  { value: 'at_risk', label: 'At risk', Icon: TriangleAlert, active: 'border-status-critical text-status-critical bg-status-critical/10' },
]

/**
 * The atomic check-in: new value + status + note (+ optional blocker).
 */
export function CheckInForm({
  kr,
  defaultStatus,
  onDone,
}: {
  kr: KeyResult
  defaultStatus?: Status
  onDone: () => void
}) {
  const addCheckIn = useOkrStore((s) => s.addCheckIn)
  const [value, setValue] = useState(String(kr.currentValue))
  const [status, setStatus] = useState<Status>(defaultStatus ?? 'on_track')
  const [note, setNote] = useState('')
  const [blocker, setBlocker] = useState('')
  const [showBlocker, setShowBlocker] = useState(false)

  const submit = () => {
    addCheckIn({
      keyResultId: kr.id,
      value: kr.metricType === 'boolean' ? (Number(value) >= 1 ? 1 : 0) : Number(value),
      status,
      note: note.trim() || undefined,
      blocker: blocker.trim() || undefined,
      authorId: kr.ownerId,
    })
    onDone()
  }

  return (
    <div className="space-y-3 rounded-lg border border-grid bg-page/70 p-3">
      <div className="flex flex-wrap items-end gap-3">
        {kr.metricType === 'boolean' ? (
          <Field label="Achieved?">
            <select className={inputClass} value={value} onChange={(e) => setValue(e.target.value)}>
              <option value="0">Not yet</option>
              <option value="1">Done</option>
            </select>
          </Field>
        ) : (
          <Field label={`New value (now ${formatKrValue(kr, kr.currentValue)}, target ${formatKrValue(kr, kr.targetValue)})`}>
            <input
              type="number"
              className={`${inputBase} w-40`}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoFocus
            />
          </Field>
        )}
        <div>
          <span className="mb-1 block text-xs font-medium text-ink-secondary">How does it feel?</span>
          <div className="flex gap-1.5">
            {STATUS_OPTIONS.map(({ value: v, label, Icon, active }) => (
              <button
                key={v}
                type="button"
                onClick={() => setStatus(v)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  status === v ? active : 'border-baseline text-ink-secondary hover:border-ink-muted'
                }`}
              >
                <Icon size={13} strokeWidth={2.4} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <Field label="Note — what changed, what's next?">
        <textarea
          className={`${inputClass} resize-none`}
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Progress is objective, confidence is subjective — say why."
        />
      </Field>
      {showBlocker ? (
        <Field label="Blocker (be specific and actionable)">
          <input
            className={inputClass}
            value={blocker}
            onChange={(e) => setBlocker(e.target.value)}
            placeholder='e.g. "Waiting on legal approval for the DPA rewrite"'
          />
        </Field>
      ) : (
        <button
          type="button"
          onClick={() => setShowBlocker(true)}
          className="text-xs font-medium text-ink-muted hover:text-ink-secondary"
        >
          + Flag a blocker
        </button>
      )}
      <div className="flex justify-end gap-2">
        <Button onClick={onDone}>Cancel</Button>
        <Button variant="primary" onClick={submit}>Save check-in</Button>
      </div>
    </div>
  )
}
