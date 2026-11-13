export type TopicId = 'ethics' | 'intro' | 'real' | 'pe' | 'pd' | 'hf' | 'digital'

export interface Topic {
  id: TopicId
  code: string
  name: string // official topic name
  short: string // short label
  weight: [number, number] // 2027 exam weight range, in %
  color: string
  summary: string // one-line description
}

/* ---------- Study notes ---------- */
export type Block =
  | { t: 'h'; text: string }
  | { t: 'p'; text: string }
  | { t: 'list'; items: string[]; ordered?: boolean }
  | { t: 'formula'; tex: string; label?: string; note?: string }
  | { t: 'tip'; text: string } // key point
  | { t: 'trap'; text: string } // exam trap
  | { t: 'recap'; text: string } // plain-language summary
  | { t: 'table'; head: string[]; rows: string[][] }
  | { t: 'example'; title?: string; lines: string[] }

export interface Fiche {
  id: string
  topic: TopicId
  title: string
  subtitle: string // one-line description
  minutes: number
  blocks: Block[]
}

/* ---------- QCM ---------- */
export interface Question {
  id: string
  topic: TopicId
  tag: string // subtopic, e.g. "Sharpe ratio"
  q: string
  options: string[] // 4 options, shuffled on display
  answer: number // index of the correct option
  explain: string // why the answer is right
  level: 1 | 2 | 3
  calc?: boolean // calculation question
}

/* ---------- Flashcards ---------- */
export interface Card {
  id: string
  topic: TopicId
  front: string // term
  back: string // definition
  hint?: string // optional memory aid
}

/* ---------- Formules ---------- */
export interface Formula {
  id: string
  topic: TopicId
  name: string
  tex: string
  vars?: string // what the symbols mean
  note?: string
}

/* ---------- Packs (content JSON files) ---------- */
export interface Pack {
  id: string
  added: string // YYYY-MM-DD
  title: string
  fiches?: Fiche[]
  questions?: Question[]
  cards?: Card[]
  formulas?: Formula[]
}

/* ---------- Lessons built from the learner's own course material ---------- */
export interface Lesson {
  id: string
  topic: TopicId
  title: string
  source: string // e.g. "cours/notes-hedge-funds.pdf"
  added: string
  blocks: Block[]
  fixes?: string[] // errors found in the source notes
  questions?: Question[]
}

/* ---------- Progress ---------- */
export interface ItemStat {
  seen: number
  ok: number
  last: number // timestamp (ms)
  streak: number // consecutive correct answers (negative = consecutive misses)
  due: number // next review (ms)
}

export interface CardStat {
  reps: number
  ease: number
  interval: number // days
  due: number
  last: number
  lapses: number
}

export interface ExamRecord {
  id: string
  date: number
  total: number
  correct: number
  seconds: number
  limit: number
  byTopic: Partial<Record<TopicId, [number, number]>>
}

export interface Progress {
  version: 1
  updatedAt: number
  q: Record<string, ItemStat>
  calc: Record<string, ItemStat>
  cards: Record<string, CardStat>
  read: Record<string, number>
  exams: ExamRecord[]
  days: Record<string, number> // YYYY-MM-DD -> items practised
}

export interface Settings {
  examDate: string
  dailyGoal: number
  token: string
  repo: string // owner/name
  theme: 'auto' | 'light' | 'dark'
  autoSync: boolean
  onboarded: boolean
}
