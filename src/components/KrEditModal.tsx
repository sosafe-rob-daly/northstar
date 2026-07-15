import { useState } from 'react'
import { useOkrStore } from '../store/store'
import type { KeyResult, KrDirection, MetricType } from '../lib/types'
import { Button, Field, Modal, inputClass } from './ui'

/** Standalone editor for a single key result (mirrors the objective form's KR row). */
export function KrEditModal({ kr, onClose }: { kr: KeyResult; onClose: () => void }) {
  const people = useOkrStore((s) => s.people)
  const checkIns = useOkrStore((s) => s.checkIns)
  const updateKeyResult = useOkrStore((s) => s.updateKeyResult)

  const [title, setTitle] = useState(kr.title)
  const [metricType, setMetricType] = useState<MetricType>(kr.metricType)
  const [direction, setDirection] = useState<KrDirection>(kr.direction)
  const [startValue, setStartValue] = useState(String(kr.startValue))
  const [targetValue, setTargetValue] = useState(String(kr.targetValue))
  const [unit, setUnit] = useState(kr.unit ?? '')
  const [ownerId, setOwnerId] = useState(kr.ownerId ?? '')
  const [weight, setWeight] = useState(String(kr.weight))
  const [error, setError] = useState('')

  const save = () => {
    if (!title.trim()) return setError('A key result needs a title.')
    if (metricType !== 'boolean') {
      if (startValue.trim() === '' || targetValue.trim() === '')
        return setError('Start and target values are required — a key result without a metric is a task.')
      if (Number(startValue) === Number(targetValue))
        return setError('Start and target are identical, so progress can never move.')
    }
    const payload = {
      title: title.trim(),
      metricType,
      unit: unit.trim() || undefined,
      direction: metricType === 'boolean' ? ('increase' as const) : direction,
      startValue: metricType === 'boolean' ? 0 : Number(startValue),
      targetValue: metricType === 'boolean' ? 1 : Number(targetValue),
      ownerId: ownerId || undefined,
      weight: Math.max(0.1, Number(weight) || 1),
    }
    // Before any check-in exists, current value tracks the start value
    const hasCheckIns = checkIns.some((c) => c.keyResultId === kr.id)
    updateKeyResult(
      kr.id,
      hasCheckIns ? payload : { ...payload, currentValue: payload.startValue },
    )
    onClose()
  }

  return (
    <Modal title="Edit key result" onClose={onClose}>
      <div className="space-y-4">
        <Field label="Key result">
          <input
            className={inputClass}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder='Verb + metric + from X to Y — e.g. "Increase NPS from 41 to 50"'
            autoFocus
          />
        </Field>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="Metric">
            <select
              className={inputClass}
              value={metricType}
              onChange={(e) => setMetricType(e.target.value as MetricType)}
            >
              <option value="number">Number</option>
              <option value="percent">Percent</option>
              <option value="currency">Currency</option>
              <option value="boolean">Done / not done</option>
            </select>
          </Field>
          {metricType !== 'boolean' && (
            <>
              <Field label="Direction">
                <select
                  className={inputClass}
                  value={direction}
                  onChange={(e) => setDirection(e.target.value as KrDirection)}
                >
                  <option value="increase">Increase to</option>
                  <option value="decrease">Decrease to</option>
                  <option value="stay_above">Stay above</option>
                  <option value="stay_below">Stay below</option>
                </select>
              </Field>
              <Field label="Unit">
                <input
                  className={inputClass}
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="€, NPS…"
                />
              </Field>
              <Field label="Start">
                <input
                  type="number"
                  className={inputClass}
                  value={startValue}
                  onChange={(e) => setStartValue(e.target.value)}
                />
              </Field>
              <Field label="Target">
                <input
                  type="number"
                  className={inputClass}
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                />
              </Field>
            </>
          )}
          <Field label="Owner">
            <select className={inputClass} value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
              <option value="">Objective owner</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Weight">
            <input
              type="number"
              min="0.1"
              step="0.5"
              className={inputClass}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </Field>
        </div>
        {error && <p className="text-sm font-medium text-status-critical">{error}</p>}
        <div className="flex justify-end gap-2 border-t border-grid pt-4">
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save}>Save key result</Button>
        </div>
      </div>
    </Modal>
  )
}
