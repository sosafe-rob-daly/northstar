import { NavLink, Outlet } from 'react-router-dom'
import {
  Compass,
  LayoutDashboard,
  Target,
  CalendarCheck,
  Network,
  Users,
  Settings as SettingsIcon,
} from 'lucide-react'
import { CyclePicker } from './CyclePicker'

const NAV = [
  { to: '/', label: 'Dashboard', Icon: LayoutDashboard, end: true },
  { to: '/objectives', label: 'Objectives', Icon: Target, end: false },
  { to: '/check-in', label: 'Check-in', Icon: CalendarCheck, end: true },
  { to: '/alignment', label: 'Alignment', Icon: Network, end: true },
  { to: '/people', label: 'People', Icon: Users, end: true },
  { to: '/settings', label: 'Settings', Icon: SettingsIcon, end: true },
]

export function Layout() {
  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 flex w-56 flex-col border-r border-grid bg-surface">
        <div className="flex items-center gap-2 px-5 pt-5 pb-6">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white">
            <Compass size={18} />
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-ink">Northstar</span>
        </div>
        <nav className="flex flex-col gap-0.5 px-3">
          {NAV.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-accent-wash/60 text-accent-strong'
                    : 'text-ink-secondary hover:bg-black/5 hover:text-ink'
                }`
              }
            >
              <Icon size={16} strokeWidth={2.2} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto px-5 py-4 text-[11px] leading-relaxed text-ink-muted">
          Local-first OKR workspace.
          <br />
          Data lives in your browser.
        </div>
      </aside>
      <div className="ml-56 flex-1">
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-grid bg-page/90 px-8 py-3 backdrop-blur">
          <CyclePicker />
        </header>
        <main className="mx-auto max-w-6xl px-8 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
