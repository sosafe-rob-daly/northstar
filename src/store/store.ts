import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  CheckIn,
  Cycle,
  Id,
  Initiative,
  KeyResult,
  Objective,
  Person,
  Settings,
  Team,
} from '../lib/types'
import { DEFAULT_SETTINGS } from '../lib/progress'
import { inferCycleType } from '../lib/cycles'
import { buildSeed } from '../data/seed'

export interface OkrData {
  cycles: Cycle[]
  teams: Team[]
  people: Person[]
  objectives: Objective[]
  keyResults: KeyResult[]
  checkIns: CheckIn[]
  initiatives: Initiative[]
  settings: Settings
}

interface OkrState extends OkrData {
  selectedCycleId: Id | null

  setSelectedCycle: (id: Id) => void

  addCycle: (cycle: Omit<Cycle, 'id'>) => Id
  updateCycle: (id: Id, patch: Partial<Cycle>) => void
  deleteCycle: (id: Id) => void

  addTeam: (team: Omit<Team, 'id'>) => Id
  updateTeam: (id: Id, patch: Partial<Team>) => void
  deleteTeam: (id: Id) => void

  addPerson: (person: Omit<Person, 'id'>) => Id
  updatePerson: (id: Id, patch: Partial<Person>) => void
  deletePerson: (id: Id) => void

  addObjective: (
    objective: Omit<Objective, 'id' | 'createdAt' | 'updatedAt'>,
    krs: Omit<KeyResult, 'id' | 'objectiveId' | 'createdAt'>[],
  ) => Id
  updateObjective: (id: Id, patch: Partial<Objective>) => void
  deleteObjective: (id: Id) => void
  closeObjective: (
    id: Id,
    grades: { krId: Id; score: number }[],
    finalScore: number,
    reflection: string,
  ) => void
  reopenObjective: (id: Id) => void

  addKeyResult: (kr: Omit<KeyResult, 'id' | 'createdAt'>) => Id
  updateKeyResult: (id: Id, patch: Partial<KeyResult>) => void
  deleteKeyResult: (id: Id) => void

  addCheckIn: (checkIn: Omit<CheckIn, 'id' | 'createdAt'>) => Id
  deleteCheckIn: (id: Id) => void

  addInitiative: (initiative: Omit<Initiative, 'id' | 'createdAt' | 'done'>) => Id
  toggleInitiative: (id: Id) => void
  deleteInitiative: (id: Id) => void

  updateSettings: (patch: Partial<Settings>) => void

  importData: (data: OkrData) => void
  resetToSeed: () => void
}

const uid = () => crypto.randomUUID()
const now = () => new Date().toISOString()

export const useOkrStore = create<OkrState>()(
  persist(
    (set) => ({
      ...buildSeed(),
      selectedCycleId: null,

      setSelectedCycle: (id) => set({ selectedCycleId: id }),

      addCycle: (cycle) => {
        const id = uid()
        set((s) => ({ cycles: [...s.cycles, { ...cycle, id }] }))
        return id
      },
      updateCycle: (id, patch) =>
        set((s) => ({
          cycles: s.cycles.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),
      deleteCycle: (id) =>
        set((s) => {
          const objectiveIds = new Set(
            s.objectives.filter((o) => o.cycleId === id).map((o) => o.id),
          )
          const krIds = new Set(
            s.keyResults.filter((k) => objectiveIds.has(k.objectiveId)).map((k) => k.id),
          )
          return {
            cycles: s.cycles.filter((c) => c.id !== id),
            objectives: s.objectives
              .filter((o) => !objectiveIds.has(o.id))
              .map((o) =>
                o.parentId && objectiveIds.has(o.parentId) ? { ...o, parentId: undefined } : o,
              ),
            keyResults: s.keyResults.filter((k) => !krIds.has(k.id)),
            checkIns: s.checkIns.filter((c) => !krIds.has(c.keyResultId)),
            initiatives: s.initiatives.filter((i) => !krIds.has(i.keyResultId)),
            selectedCycleId: s.selectedCycleId === id ? null : s.selectedCycleId,
          }
        }),

      addTeam: (team) => {
        const id = uid()
        set((s) => ({ teams: [...s.teams, { ...team, id }] }))
        return id
      },
      updateTeam: (id, patch) =>
        set((s) => ({
          teams: s.teams.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),
      deleteTeam: (id) =>
        set((s) => ({
          teams: s.teams.filter((t) => t.id !== id),
          people: s.people.map((p) => (p.teamId === id ? { ...p, teamId: undefined } : p)),
          objectives: s.objectives.map((o) =>
            o.teamId === id ? { ...o, teamId: undefined } : o,
          ),
        })),

      addPerson: (person) => {
        const id = uid()
        set((s) => ({ people: [...s.people, { ...person, id }] }))
        return id
      },
      updatePerson: (id, patch) =>
        set((s) => ({
          people: s.people.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),
      deletePerson: (id) =>
        set((s) => ({
          people: s.people.filter((p) => p.id !== id),
          keyResults: s.keyResults.map((k) =>
            k.ownerId === id ? { ...k, ownerId: undefined } : k,
          ),
        })),

      addObjective: (objective, krs) => {
        const id = uid()
        const ts = now()
        set((s) => ({
          objectives: [...s.objectives, { ...objective, id, createdAt: ts, updatedAt: ts }],
          keyResults: [
            ...s.keyResults,
            ...krs.map((kr) => ({ ...kr, id: uid(), objectiveId: id, createdAt: ts })),
          ],
        }))
        return id
      },
      updateObjective: (id, patch) =>
        set((s) => ({
          objectives: s.objectives.map((o) =>
            o.id === id ? { ...o, ...patch, updatedAt: now() } : o,
          ),
        })),
      deleteObjective: (id) =>
        set((s) => {
          const krIds = new Set(
            s.keyResults.filter((k) => k.objectiveId === id).map((k) => k.id),
          )
          return {
            objectives: s.objectives
              .filter((o) => o.id !== id)
              .map((o) => (o.parentId === id ? { ...o, parentId: undefined } : o)),
            keyResults: s.keyResults.filter((k) => !krIds.has(k.id)),
            checkIns: s.checkIns.filter((c) => !krIds.has(c.keyResultId)),
            initiatives: s.initiatives.filter((i) => !krIds.has(i.keyResultId)),
          }
        }),
      closeObjective: (id, grades, finalScore, reflection) =>
        set((s) => ({
          objectives: s.objectives.map((o) =>
            o.id === id
              ? { ...o, lifecycle: 'closed', finalScore, reflection, updatedAt: now() }
              : o,
          ),
          keyResults: s.keyResults.map((k) => {
            const grade = grades.find((g) => g.krId === k.id)
            return grade ? { ...k, finalScore: grade.score } : k
          }),
        })),
      reopenObjective: (id) =>
        set((s) => ({
          objectives: s.objectives.map((o) =>
            o.id === id
              ? { ...o, lifecycle: 'active', finalScore: undefined, updatedAt: now() }
              : o,
          ),
        })),

      addKeyResult: (kr) => {
        const id = uid()
        set((s) => ({ keyResults: [...s.keyResults, { ...kr, id, createdAt: now() }] }))
        return id
      },
      updateKeyResult: (id, patch) =>
        set((s) => ({
          keyResults: s.keyResults.map((k) => (k.id === id ? { ...k, ...patch } : k)),
        })),
      deleteKeyResult: (id) =>
        set((s) => ({
          keyResults: s.keyResults.filter((k) => k.id !== id),
          checkIns: s.checkIns.filter((c) => c.keyResultId !== id),
          initiatives: s.initiatives.filter((i) => i.keyResultId !== id),
        })),

      addCheckIn: (checkIn) => {
        const id = uid()
        set((s) => ({
          checkIns: [...s.checkIns, { ...checkIn, id, createdAt: now() }],
          keyResults: s.keyResults.map((k) =>
            k.id === checkIn.keyResultId ? { ...k, currentValue: checkIn.value } : k,
          ),
        }))
        return id
      },
      deleteCheckIn: (id) =>
        set((s) => {
          const target = s.checkIns.find((c) => c.id === id)
          if (!target) return s
          const remaining = s.checkIns.filter((c) => c.id !== id)
          const siblings = remaining
            .filter((c) => c.keyResultId === target.keyResultId)
            .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
          const kr = s.keyResults.find((k) => k.id === target.keyResultId)
          const revertValue = siblings[0]?.value ?? kr?.startValue ?? 0
          return {
            checkIns: remaining,
            keyResults: s.keyResults.map((k) =>
              k.id === target.keyResultId ? { ...k, currentValue: revertValue } : k,
            ),
          }
        }),

      addInitiative: (initiative) => {
        const id = uid()
        set((s) => ({
          initiatives: [...s.initiatives, { ...initiative, id, done: false, createdAt: now() }],
        }))
        return id
      },
      toggleInitiative: (id) =>
        set((s) => ({
          initiatives: s.initiatives.map((i) => (i.id === id ? { ...i, done: !i.done } : i)),
        })),
      deleteInitiative: (id) =>
        set((s) => ({ initiatives: s.initiatives.filter((i) => i.id !== id) })),

      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

      importData: (data) =>
        set({
          cycles: data.cycles ?? [],
          teams: data.teams ?? [],
          people: data.people ?? [],
          objectives: data.objectives ?? [],
          keyResults: data.keyResults ?? [],
          checkIns: data.checkIns ?? [],
          initiatives: data.initiatives ?? [],
          settings: { ...DEFAULT_SETTINGS, ...data.settings },
          selectedCycleId: null,
        }),
      resetToSeed: () => set({ ...buildSeed(), selectedCycleId: null }),
    }),
    {
      name: 'northstar-okr-v1',
      version: 2,
      migrate: (persisted, version) => {
        const state = persisted as OkrState
        if (version < 2 && state?.cycles) {
          state.cycles = state.cycles.map((c) =>
            c.type ? c : { ...c, type: inferCycleType(c) },
          )
        }
        return state
      },
    },
  ),
)

export function exportData(): OkrData {
  const s = useOkrStore.getState()
  return {
    cycles: s.cycles,
    teams: s.teams,
    people: s.people,
    objectives: s.objectives,
    keyResults: s.keyResults,
    checkIns: s.checkIns,
    initiatives: s.initiatives,
    settings: s.settings,
  }
}
