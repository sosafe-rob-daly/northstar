import type { KeyResult, MetricType } from './types'

const compact = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

const plain = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })

export function formatValue(value: number, metricType: MetricType, unit?: string): string {
  switch (metricType) {
    case 'boolean':
      return value >= 1 ? 'Done' : 'Not done'
    case 'percent':
      return `${plain.format(value)}%`
    case 'currency': {
      const num = Math.abs(value) >= 10_000 ? compact.format(value) : plain.format(value)
      return `${unit && unit.length === 1 ? unit : '$'}${num}`
    }
    case 'number': {
      const num = Math.abs(value) >= 10_000 ? compact.format(value) : plain.format(value)
      return unit ? `${num} ${unit}` : num
    }
  }
}

export function formatKrValue(kr: KeyResult, value: number): string {
  return formatValue(value, kr.metricType, kr.unit)
}

export function formatPercent(fraction: number): string {
  return `${Math.round(fraction * 100)}%`
}

export function formatScore(score: number): string {
  return score.toFixed(1)
}
