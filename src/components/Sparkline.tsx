/**
 * Tiny inline SVG sparkline: de-emphasis gray line, accent end dot with a
 * 2px surface ring (dataviz mark spec).
 */
export function Sparkline({
  points,
  width = 96,
  height = 24,
}: {
  /** Series of 0-1 fractions in time order */
  points: number[]
  width?: number
  height?: number
}) {
  if (points.length < 2) return null
  const pad = 4
  const min = Math.min(...points)
  const max = Math.max(...points)
  const span = max - min || 1
  const coords = points.map((p, i) => ({
    x: pad + (i / (points.length - 1)) * (width - pad * 2),
    y: height - pad - ((p - min) / span) * (height - pad * 2),
  }))
  const path = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ')
  const last = coords[coords.length - 1]
  return (
    <svg width={width} height={height} className="shrink-0" aria-hidden="true">
      <path
        d={path}
        fill="none"
        stroke="var(--color-baseline)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last.x} cy={last.y} r={4} fill="var(--color-accent)" stroke="var(--color-surface)" strokeWidth={2} />
    </svg>
  )
}
