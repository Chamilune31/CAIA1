import { useSyncExternalStore } from 'react'
import type { CardStat, ExamRecord, ItemStat, Progress, Settings } from '../types'

const PKEY = 'caia1.progress'
const SKEY = 'caia1.settings'

export const DEFAULT_SETTINGS: Settings = {
  examDate: '2027-03-01',
  dailyGoal: 30,
  token: '',
  repo: 'Chamilune31/CAIA1',
  theme: 'auto',
  autoSync: true,
  onboarded: false,
}

export const emptyProgress = (): Progress => ({
  version: 1,
  updatedAt: 0,
  q: {},
  calc: {},
  cards: {},
  read: {},
  exams: [],
  days: {},
})

const load = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback
  } catch {
    return fallback
  }
}

let progress: Progress = load(PKEY, emptyProgress())
let settings: Settings = load(SKEY, DEFAULT_SETTINGS)
const listeners = new Set<() => void>()
const changeHooks = new Set<() => void>()

const emit = () => listeners.forEach((l) => l())
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

const persist = () => {
  try {
    localStorage.setItem(PKEY, JSON.stringify(progress))
  } catch {
    /* storage full or unavailable */
  }
}

export const useProgress = () => useSyncExternalStore(subscribe, () => progress)
export const useSettings = () => useSyncExternalStore(subscribe, () => settings)
export const getProgress = () => progress
export const getSettings = () => settings

/** Called after every local change (used by GitHub sync). */
export const onLocalChange = (fn: () => void) => {
  changeHooks.add(fn)
  return () => {
    changeHooks.delete(fn)
  }
}

export const updateProgress = (fn: (p: Progress) => Progress | void, opts: { silent?: boolean } = {}) => {
  const draft = structuredClone(progress)
  progress = fn(draft) ?? draft
  progress.updatedAt = Date.now()
  persist()
  emit()
  if (!opts.silent) changeHooks.forEach((h) => h())
}

export const replaceProgress = (p: Progress) => {
  progress = { ...emptyProgress(), ...p }
  persist()
  emit()
}

export const updateSettings = (patch: Partial<Settings>) => {
  settings = { ...settings, ...patch }
  try {
    localStorage.setItem(SKEY, JSON.stringify(settings))
  } catch {
    /* ignore */
  }
  emit()
}

/* ---------- Dates ---------- */
export const today = (d = new Date()) => {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 6e4)
  return z.toISOString().slice(0, 10)
}

const bumpDay = (p: Progress) => {
  const k = today()
  p.days[k] = (p.days[k] ?? 0) + 1
}

/* ---------- Recording answers ---------- */
const DAY = 864e5
// Review intervals for questions (days) by streak of correct answers.
const Q_STEPS = [0, 1, 3, 7, 16, 35]

export const nextItem = (s: ItemStat | undefined, ok: boolean, now = Date.now()): ItemStat => {
  const prev = s ?? { seen: 0, ok: 0, last: 0, streak: 0, due: 0 }
  const streak = ok ? Math.max(prev.streak, 0) + 1 : Math.min(prev.streak, 0) - 1
  const step = ok ? Q_STEPS[Math.min(streak, Q_STEPS.length - 1)] : 0
  // A miss comes back in 10 minutes, then the next day if it persists.
  const due = ok ? now + step * DAY : now + (streak <= -2 ? DAY : 10 * 6e4)
  return { seen: prev.seen + 1, ok: prev.ok + (ok ? 1 : 0), last: now, streak, due }
}

export const recordQuestion = (id: string, ok: boolean) =>
  updateProgress((p) => {
    p.q[id] = nextItem(p.q[id], ok)
    bumpDay(p)
  })

export const recordCalc = (genId: string, ok: boolean) =>
  updateProgress((p) => {
    p.calc[genId] = nextItem(p.calc[genId], ok)
    bumpDay(p)
  })

/** Simplified SM-2 spaced repetition. grade: 0 = again, 1 = hard, 2 = good, 3 = easy */
export const nextCard = (s: CardStat | undefined, grade: 0 | 1 | 2 | 3, now = Date.now()): CardStat => {
  const prev = s ?? { reps: 0, ease: 2.5, interval: 0, due: 0, last: 0, lapses: 0 }
  let { reps, ease, interval, lapses } = prev
  if (grade === 0) {
    reps = 0
    lapses += 1
    interval = 0
    ease = Math.max(1.3, ease - 0.2)
  } else {
    ease = Math.max(1.3, ease + [0, -0.15, 0, 0.15][grade])
    reps += 1
    if (reps === 1) interval = grade === 3 ? 3 : 1
    else if (reps === 2) interval = grade === 1 ? 3 : 6
    else interval = Math.round(interval * ease * (grade === 1 ? 0.8 : grade === 3 ? 1.3 : 1))
  }
  const due = grade === 0 ? now + 5 * 6e4 : now + interval * DAY
  return { reps, ease, interval, due, last: now, lapses }
}

export const recordCard = (id: string, grade: 0 | 1 | 2 | 3) =>
  updateProgress((p) => {
    p.cards[id] = nextCard(p.cards[id], grade)
    bumpDay(p)
  })

export const markRead = (id: string) =>
  updateProgress((p) => {
    p.read[id] = Date.now()
  })

export const recordExam = (e: ExamRecord) =>
  updateProgress((p) => {
    p.exams = [...p.exams.filter((x) => x.id !== e.id), e]
  })

/* ---------- Lossless merge (two devices) ---------- */
const mergeMap = <T extends { last: number }>(a: Record<string, T>, b: Record<string, T>) => {
  const out: Record<string, T> = { ...a }
  for (const [k, v] of Object.entries(b)) if (!out[k] || v.last > out[k].last) out[k] = v
  return out
}

export const mergeProgress = (a: Progress, b: Progress): Progress => {
  const days: Record<string, number> = { ...a.days }
  for (const [k, v] of Object.entries(b.days ?? {})) days[k] = Math.max(days[k] ?? 0, v)
  const read: Record<string, number> = { ...a.read }
  for (const [k, v] of Object.entries(b.read ?? {})) read[k] = Math.max(read[k] ?? 0, v)
  const exams = [...a.exams]
  for (const e of b.exams ?? []) if (!exams.some((x) => x.id === e.id)) exams.push(e)
  exams.sort((x, y) => x.date - y.date)
  return {
    version: 1,
    updatedAt: Math.max(a.updatedAt, b.updatedAt),
    q: mergeMap(a.q, b.q ?? {}),
    calc: mergeMap(a.calc, b.calc ?? {}),
    cards: mergeMap(a.cards, b.cards ?? {}),
    read,
    exams,
    days,
  }
}
