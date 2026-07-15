import { useState } from 'react'
import { useOkrStore } from '../store/store'
import type { Objective } from '../lib/types'
import { krProgress, scoreBand } from '../lib/progress'
import { formatScore } from '../lib/format'
import { Button, Field, Modal, inputClass } from './ui'

const BAND_COLOR = {
  green: 'var(--color-status-good-text)',
  amber: '#8a5a00',
  red: 'var(--color-status-critical)',
} as const

/**
 * End-of-cycle grading: per-KR 0.0-1.0 scores prefilled from live progress
 * (subjectively adjustable), objective score = average, plus a written
 * reflection. Committed objectives below 1.0 require an explanation.
 */
export function CloseObjectiveModal({
  objective,
  onClose,
}: {
  objective: Objective
  onClose: () => void
}) {
  const keyResults = useOkrStore((s) => s.keyResults)
  const closeObjective = useOkrStore((s) => s.closeObjective)
  const krs = keyResults.filter((k) => k.objectiveId === objective.id)

  const [scores, setScores] = useState<Record<string, number>>(() =>
    Object.fromEntries(krs.map((k) => [k.id, Math.round(krProgress(k) * 10) / 10])),
  )
  const [reflection, setReflection] = useState('')
  const [error, setError] = useState('')

  const values = Object.values(scores)
  const finalScore =
    values.length > 0
      ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100
      : 0
  const committedMiss = objective.type === 'committed' && finalScore < 1

  const save = () => {
    if (committedMiss && reflection.trim().length < 10) {
      setError('This was a committed objective closing below 1.0 — write a short postmortem: what happened, and what changes?')
      return
    }
    closeObjective(
      objective.id,
      krs.map((k) => ({ krId: k.id, score: scores[k.id] ?? 0 })),
      finalScore,
      reflection.trim(),
    )
    onClose()
  }

  return (
    <Modal title="Close & grade objective" onClose={onClose} wide>
      <div className="space-y-4">
        <p className="text-sm text-ink-secondary">
          Grade each key result from 0.0 to 1.0. Scores start at measured progress — adjust them
          where the number doesn't tell the whole story. On aspirational objectives ~0.7 is
          success; consistent 1.0s usually mean targets were too safe.
        </p>
        <div className="space-y-3">
          {krs.map((kr) => {
            const score = scores[kr.id] ?? 0
            return (
              <div key={kr.id} className="flex items-center gap-4 rounded-lg border border-grid bg-page/60 p-3">
                <p className="min-w-0 flex-1 truncate text-sm text-ink">{kr.title}</p>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={score}
                  onChange={(e) => setScores((s) => ({ ...s, [kr.id]: Number(e.target.value) }))}
                  className="w-40 accent-[var(--color-accent)]"
                  aria-label={`Score for ${kr.title}`}
                />
                <span
                  className="w-8 text-right text-sm font-semibold tabular-nums"
                  style={{ color: BAND_COLOR[scoreBand(score)] }}
                >
                  {formatScore(score)}
                </span>
              </div>
            )
          })}
        </div>
        <div className="flex items-center justify-between rounded-lg bg-accent-wash/50 px-4 py-3">
          <span className="text-sm font-medium text-ink">Objective score (average)</span>
          <span className="text-xl font-semibold" style={{ color: BAND_COLOR[scoreBand(finalScore)] }}>
            {formatScore(finalScore)}
          </span>
        </div>
        <Field
          label={committedMiss ? 'Reflection — required: committed objective below 1.0' : 'Reflection'}
        >
          <textarea
            className={`${inputClass} resize-none`}
            rows={3}
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="What did we learn? What carries into next cycle — continue, modify, or drop?"
          />
        </Field>
        {error && <p className="text-sm font-medium text-status-critical">{error}</p>}
        <div className="flex justify-end gap-2 border-t border-grid pt-4">
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save}>Close objective</Button>
        </div>
      </div>
    </Modal>
  )
}
