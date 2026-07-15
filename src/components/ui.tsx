import { X } from 'lucide-react'
import type { ReactNode } from 'react'

export function Card({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`rounded-xl border border-hairline bg-surface shadow-sm ${className}`}>
      {children}
    </div>
  )
}

export function Button({
  children,
  onClick,
  variant = 'secondary',
  type = 'button',
  disabled = false,
  className = '',
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  type?: 'button' | 'submit'
  disabled?: boolean
  className?: string
}) {
  const styles = {
    primary:
      'bg-accent text-white hover:bg-accent-strong border border-transparent',
    secondary:
      'bg-surface text-ink border border-baseline hover:border-ink-muted',
    ghost: 'text-ink-secondary hover:bg-black/5 border border-transparent',
    danger:
      'bg-surface text-status-critical border border-status-critical/40 hover:bg-status-critical/5',
  }[variant]
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${styles} ${className}`}
    >
      {children}
    </button>
  )
}

export function Modal({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string
  onClose: () => void
  children: ReactNode
  wide?: boolean
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/30 p-4 pt-12"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className={`w-full ${wide ? 'max-w-3xl' : 'max-w-xl'} rounded-xl border border-hairline bg-surface shadow-xl`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-center justify-between border-b border-grid px-5 py-3.5">
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-ink-muted hover:bg-black/5 hover:text-ink"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export function Field({
  label,
  children,
  hint,
  className = '',
}: {
  label: string
  children: ReactNode
  hint?: string
  className?: string
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-medium text-ink-secondary">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-muted">{hint}</span>}
    </label>
  )
}

export const inputBase =
  'rounded-lg border border-baseline bg-surface px-2.5 py-1.5 text-sm text-ink placeholder:text-ink-muted focus:border-accent focus:outline-none'

export const inputClass = `w-full ${inputBase}`

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-baseline px-6 py-10 text-center">
      <p className="text-sm font-medium text-ink-secondary">{title}</p>
      {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
    </div>
  )
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'neutral' | 'accent' | 'violet'
}) {
  const styles = {
    neutral: 'bg-black/5 text-ink-secondary',
    accent: 'bg-accent-wash text-accent-strong',
    violet: 'bg-series-7/10 text-series-7',
  }[tone]
  return (
    <span
      className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium ${styles}`}
    >
      {children}
    </span>
  )
}
