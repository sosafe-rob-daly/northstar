import { useRef, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { Download, Lock, LockOpen, Plus, Trash2, Upload } from 'lucide-react'
import { useOkrStore, exportData, type OkrData } from '../store/store'
import { Button, Card, Field, inputClass } from '../components/ui'

export function SettingsPage() {
  const store = useOkrStore()
  const { cycles, objectives, settings } = store
  const [cycleName, setCycleName] = useState('')
  const [cycleStart, setCycleStart] = useState('')
  const [cycleEnd, setCycleEnd] = useState('')
  const [message, setMessage] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const addCycle = () => {
    if (!cycleName.trim() || !cycleStart || !cycleEnd) {
      setMessage('A cycle needs a name, start date, and end date.')
      return
    }
    if (cycleEnd <= cycleStart) {
      setMessage('The cycle must end after it starts.')
      return
    }
    store.addCycle({ name: cycleName.trim(), startDate: cycleStart, endDate: cycleEnd, status: 'open' })
    setCycleName('')
    setCycleStart('')
    setCycleEnd('')
    setMessage('')
  }

  const download = () => {
    const blob = new Blob([JSON.stringify(exportData(), null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `northstar-okrs-${format(new Date(), 'yyyy-MM-dd')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result)) as OkrData
        if (!Array.isArray(data.objectives) || !Array.isArray(data.keyResults)) {
          throw new Error('missing collections')
        }
        store.importData(data)
        setMessage('Import complete.')
      } catch {
        setMessage('That file is not a valid Northstar export.')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-ink">Settings</h1>
        <p className="text-xs text-ink-muted">Cycles, status thresholds, and your data.</p>
      </div>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-ink">Cycles</h2>
        <Card className="divide-y divide-grid">
          {[...cycles]
            .sort((a, b) => (a.startDate < b.startDate ? 1 : -1))
            .map((cycle) => {
              const count = objectives.filter((o) => o.cycleId === cycle.id).length
              return (
                <div key={cycle.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink">{cycle.name}</p>
                    <p className="text-xs text-ink-muted">
                      {format(parseISO(cycle.startDate), 'MMM d, yyyy')} –{' '}
                      {format(parseISO(cycle.endDate), 'MMM d, yyyy')} · {count} objective
                      {count === 1 ? '' : 's'}
                    </p>
                  </div>
                  <Button
                    onClick={() =>
                      store.updateCycle(cycle.id, {
                        status: cycle.status === 'open' ? 'closed' : 'open',
                      })
                    }
                  >
                    {cycle.status === 'open' ? (
                      <>
                        <Lock size={13} /> Close cycle
                      </>
                    ) : (
                      <>
                        <LockOpen size={13} /> Reopen
                      </>
                    )}
                  </Button>
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(
                          `Delete ${cycle.name} and its ${count} objective${count === 1 ? '' : 's'} (including all check-ins)?`,
                        )
                      )
                        store.deleteCycle(cycle.id)
                    }}
                    className="rounded-md p-1 text-ink-muted hover:bg-black/5 hover:text-status-critical"
                    aria-label={`Delete ${cycle.name}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )
            })}
          <div className="grid grid-cols-1 gap-2 px-4 py-3 sm:grid-cols-4">
            <Field label="Name">
              <input
                className={inputClass}
                value={cycleName}
                onChange={(e) => setCycleName(e.target.value)}
                placeholder="Q4 2026"
              />
            </Field>
            <Field label="Starts">
              <input type="date" className={inputClass} value={cycleStart} onChange={(e) => setCycleStart(e.target.value)} />
            </Field>
            <Field label="Ends">
              <input type="date" className={inputClass} value={cycleEnd} onChange={(e) => setCycleEnd(e.target.value)} />
            </Field>
            <div className="flex items-end">
              <Button onClick={addCycle}>
                <Plus size={14} /> Add cycle
              </Button>
            </div>
          </div>
        </Card>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-ink">Status thresholds</h2>
        <Card className="p-4">
          <p className="mb-3 text-xs text-ink-secondary">
            Before a key result has any check-in, its status derives from the gap between expected
            progress (time elapsed) and actual progress, in percentage points.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Behind when gap exceeds" hint="pp behind schedule">
              <input
                type="number"
                className={inputClass}
                value={settings.behindGapPp}
                onChange={(e) => store.updateSettings({ behindGapPp: Number(e.target.value) })}
              />
            </Field>
            <Field label="At risk when gap exceeds" hint="pp behind schedule">
              <input
                type="number"
                className={inputClass}
                value={settings.atRiskGapPp}
                onChange={(e) => store.updateSettings({ atRiskGapPp: Number(e.target.value) })}
              />
            </Field>
            <Field label="Stale after" hint="days without a check-in">
              <input
                type="number"
                className={inputClass}
                value={settings.staleDays}
                onChange={(e) => store.updateSettings({ staleDays: Number(e.target.value) })}
              />
            </Field>
          </div>
        </Card>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-ink">Data</h2>
        <Card className="space-y-3 p-4">
          <p className="text-xs text-ink-secondary">
            Everything lives in your browser's localStorage. Export a JSON snapshot to back up or
            move workspaces; importing replaces the current workspace.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={download}>
              <Download size={14} /> Export JSON
            </Button>
            <Button onClick={() => fileRef.current?.click()}>
              <Upload size={14} /> Import JSON
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) importFile(file)
                e.target.value = ''
              }}
            />
            <Button
              variant="danger"
              onClick={() => {
                if (window.confirm('Replace everything with the demo workspace? Your current data is lost unless exported.'))
                  store.resetToSeed()
              }}
            >
              Reset to demo data
            </Button>
          </div>
          {message && <p className="text-xs font-medium text-ink-secondary">{message}</p>}
        </Card>
      </section>
    </div>
  )
}
