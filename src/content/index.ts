import type { Card, Fiche, Formula, Lesson, Pack, Question, TopicId } from '../types'

// Any JSON file placed in packs/ or cours/ is loaded automatically.
const packMods = import.meta.glob<Pack>('./packs/*.json', { eager: true, import: 'default' })
const lessonMods = import.meta.glob<Lesson>('./cours/*.json', { eager: true, import: 'default' })

export const PACKS: Pack[] = Object.values(packMods).sort((a, b) => a.added.localeCompare(b.added) || a.id.localeCompare(b.id))
export const LESSONS: Lesson[] = Object.values(lessonMods).sort((a, b) => a.added.localeCompare(b.added))

const flat = <T,>(pick: (p: Pack) => T[] | undefined) => PACKS.flatMap((p) => pick(p) ?? [])

export const FICHES: Fiche[] = flat((p) => p.fiches)
export const FORMULAS: Formula[] = flat((p) => p.formulas)
export const CARDS: Card[] = flat((p) => p.cards)
export const QUESTIONS: Question[] = [...flat((p) => p.questions), ...LESSONS.flatMap((l) => l.questions ?? [])]

export const QUESTION_BY_ID = new Map(QUESTIONS.map((q) => [q.id, q]))
export const CARD_BY_ID = new Map(CARDS.map((c) => [c.id, c]))

export const byTopic = <T extends { topic: TopicId }>(list: T[], t: TopicId | 'all') =>
  t === 'all' ? list : list.filter((x) => x.topic === t)

// Packs added in the last 7 days get a "new" badge
export const recentPacks = (days = 7) => {
  const limit = Date.now() - days * 864e5
  return PACKS.filter((p) => new Date(p.added).getTime() >= limit)
}
