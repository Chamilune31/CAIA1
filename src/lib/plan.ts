import { CARDS, QUESTIONS } from '../content'
import { TOPICS, midWeight } from '../topics'
import type { Progress, Question, TopicId } from '../types'
import { GENERATORS } from './calc'

/* ---------- Statistiques par topic ---------- */
export interface TopicStats {
  total: number
  seen: number
  attempts: number
  ok: number
  accuracy: number | null // 0..1
  mastered: number // questions avec ≥ 2 bonnes réponses d'affilée
}

export const topicStats = (p: Progress, t: TopicId): TopicStats => {
  const qs = QUESTIONS.filter((q) => q.topic === t)
  let seen = 0,
    attempts = 0,
    ok = 0,
    mastered = 0
  for (const q of qs) {
    const s = p.q[q.id]
    if (!s) continue
    seen++
    attempts += s.seen
    ok += s.ok
    if (s.streak >= 2) mastered++
  }
  for (const g of GENERATORS.filter((g) => g.topic === t)) {
    const s = p.calc[g.id]
    if (s) {
      attempts += s.seen
      ok += s.ok
    }
  }
  return { total: qs.length, seen, attempts, ok, accuracy: attempts ? ok / attempts : null, mastered }
}

/** Score de préparation global (0..100), pondéré par le poids des topics à l'examen. */
export const readiness = (p: Progress) => {
  let w = 0,
    s = 0
  for (const t of TOPICS) {
    const st = topicStats(p, t.id)
    const cover = st.total ? st.seen / st.total : 0
    const acc = st.accuracy ?? 0
    const m = midWeight(t.id)
    w += m
    s += m * (0.4 * cover + 0.6 * acc * Math.min(1, cover * 2))
  }
  return Math.round((s / w) * 100)
}

/* ---------- Choix des questions ---------- */
const shuffle = <T,>(xs: T[]) => {
  const a = [...xs]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Priorité : erreurs à revoir, questions jamais vues, révisions arrivées à échéance, puis le reste. */
export const pickQuestions = (p: Progress, n: number, topic: TopicId | 'all' = 'all', pool: Question[] = QUESTIONS) => {
  const now = Date.now()
  const list = topic === 'all' ? pool : pool.filter((q) => q.topic === topic)
  const score = (q: Question) => {
    const s = p.q[q.id]
    if (!s) return 2 + Math.random()
    if (s.streak < 0 && s.due <= now) return 4 + Math.random()
    if (s.due <= now) return 1 + Math.random() - Math.min(s.streak, 5) * 0.1
    return Math.random() * 0.5
  }
  return list
    .map((q) => [q, score(q)] as const)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([q]) => q)
}

/** Tirage façon examen : répartition selon le poids des topics. */
export const examQuestions = (n: number) => {
  const totalW = TOPICS.reduce((a, t) => a + midWeight(t.id), 0)
  const out: Question[] = []
  const quotas = TOPICS.map((t) => ({ t: t.id, n: (midWeight(t.id) / totalW) * n }))
  const base = quotas.map((q) => ({ ...q, k: Math.floor(q.n) }))
  let left = n - base.reduce((a, b) => a + b.k, 0)
  for (const q of [...base].sort((a, b) => b.n - b.k - (a.n - a.k))) {
    if (left <= 0) break
    q.k++
    left--
  }
  for (const q of base) out.push(...shuffle(QUESTIONS.filter((x) => x.topic === q.t)).slice(0, q.k))
  // si un topic manque de questions, on complète avec d'autres
  if (out.length < n) out.push(...shuffle(QUESTIONS.filter((x) => !out.includes(x))).slice(0, n - out.length))
  return shuffle(out)
}

export const dueCards = (p: Progress, topic: TopicId | 'all' = 'all', newLimit = 15) => {
  const now = Date.now()
  const list = topic === 'all' ? CARDS : CARDS.filter((c) => c.topic === topic)
  const due = list.filter((c) => p.cards[c.id] && p.cards[c.id].due <= now).sort((a, b) => p.cards[a.id].due - p.cards[b.id].due)
  const fresh = list.filter((c) => !p.cards[c.id]).slice(0, newLimit)
  return { due, fresh, all: [...due, ...fresh] }
}

export const errorQuestions = (p: Progress) =>
  QUESTIONS.filter((q) => p.q[q.id] && p.q[q.id].streak < 0).sort((a, b) => p.q[b.id].last - p.q[a.id].last)

/* ---------- Planning jusqu'à l'examen ---------- */
const ORDER: TopicId[] = ['intro', 'hf', 'real', 'pe', 'pd', 'digital', 'ethics']
export const FINAL_REVIEW_DAYS = 21

export interface PlanStep {
  topic: TopicId | 'review'
  start: Date
  end: Date
}

export const studyPlan = (examDate: string, from = new Date()): PlanStep[] => {
  const exam = new Date(examDate + 'T09:00:00')
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  const days = Math.round((exam.getTime() - start.getTime()) / 864e5)
  if (days <= 0) return []
  const review = Math.min(FINAL_REVIEW_DAYS, Math.floor(days / 4))
  const learn = days - review
  const totalW = ORDER.reduce((a, t) => a + midWeight(t), 0)
  const steps: PlanStep[] = []
  let cursor = start.getTime()
  ORDER.forEach((t, i) => {
    const len = i === ORDER.length - 1 ? start.getTime() + learn * 864e5 - cursor : Math.round((midWeight(t) / totalW) * learn) * 864e5
    steps.push({ topic: t, start: new Date(cursor), end: new Date(cursor + len) })
    cursor += len
  })
  steps.push({ topic: 'review', start: new Date(cursor), end: exam })
  return steps.filter((s) => s.end.getTime() > s.start.getTime())
}

export const currentStep = (plan: PlanStep[], now = new Date()) =>
  plan.find((s) => now.getTime() >= s.start.getTime() && now.getTime() < s.end.getTime()) ?? plan[0]

export const daysUntil = (examDate: string) =>
  Math.ceil((new Date(examDate + 'T09:00:00').getTime() - Date.now()) / 864e5)

/** Jours consécutifs avec au moins un exercice. */
export const streakDays = (p: Progress) => {
  let n = 0
  const d = new Date()
  const key = (x: Date) => new Date(x.getTime() - x.getTimezoneOffset() * 6e4).toISOString().slice(0, 10)
  if (!p.days[key(d)]) d.setDate(d.getDate() - 1)
  while (p.days[key(d)]) {
    n++
    d.setDate(d.getDate() - 1)
  }
  return n
}
