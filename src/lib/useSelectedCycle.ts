import type { Cycle } from './types'
import { useOkrStore } from '../store/store'

/**
 * The globally selected cycle; defaults to the most recent open cycle,
 * then the most recent cycle of any status.
 */
export function useSelectedCycle(): Cycle | undefined {
  const cycles = useOkrStore((s) => s.cycles)
  const selectedCycleId = useOkrStore((s) => s.selectedCycleId)
  const selected = cycles.find((c) => c.id === selectedCycleId)
  if (selected) return selected
  const sorted = [...cycles].sort((a, b) => (a.startDate < b.startDate ? 1 : -1))
  return sorted.find((c) => c.status === 'open') ?? sorted[0]
}
