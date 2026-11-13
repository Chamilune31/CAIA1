export type TopicId = 'ethics' | 'intro' | 'real' | 'pe' | 'pd' | 'hf' | 'digital'

export interface Topic {
  id: TopicId
  code: string
  name: string // nom officiel (anglais)
  fr: string // nom français
  weight: [number, number] // fourchette de poids 2027, en %
  color: string
  summary: string // une phrase en français
}

/* ---------- Fiches de cours ---------- */
export type Block =
  | { t: 'h'; text: string }
  | { t: 'p'; text: string }
  | { t: 'list'; items: string[]; ordered?: boolean }
  | { t: 'formula'; tex: string; label?: string; note?: string }
  | { t: 'tip'; text: string } // à retenir
  | { t: 'trap'; text: string } // piège d'examen
  | { t: 'fr'; text: string } // explication en français
  | { t: 'table'; head: string[]; rows: string[][] }
  | { t: 'example'; title?: string; lines: string[] }

export interface Fiche {
  id: string
  topic: TopicId
  title: string
  fr: string // titre français
  minutes: number
  blocks: Block[]
}

/* ---------- QCM ---------- */
export interface Question {
  id: string
  topic: TopicId
  tag: string // sous-thème, ex. "Sharpe ratio"
  q: string
  options: string[] // 4 options, en anglais
  answer: number // index de la bonne réponse
  explain: string // explication en français
  level: 1 | 2 | 3
  calc?: boolean // question de calcul
}

/* ---------- Flashcards ---------- */
export interface Card {
  id: string
  topic: TopicId
  front: string // terme (anglais)
  back: string // définition (anglais)
  fr?: string // traduction / astuce en français
}

/* ---------- Formules ---------- */
export interface Formula {
  id: string
  topic: TopicId
  name: string
  tex: string
  vars?: string // légende des variables (français)
  note?: string
}

/* ---------- Packs (fichiers JSON de contenu) ---------- */
export interface Pack {
  id: string
  added: string // AAAA-MM-JJ
  title: string
  fiches?: Fiche[]
  questions?: Question[]
  cards?: Card[]
  formulas?: Formula[]
}

/* ---------- Leçons tirées des cours de l'utilisatrice ---------- */
export interface Lesson {
  id: string
  topic: TopicId
  title: string
  source: string // ex. "cours/notes-hedge-funds.pdf"
  added: string
  blocks: Block[]
  fixes?: string[] // erreurs relevées dans les notes
  questions?: Question[]
}

/* ---------- Progression ---------- */
export interface ItemStat {
  seen: number
  ok: number
  last: number // horodatage ms
  streak: number // bonnes réponses d'affilée (négatif = erreurs d'affilée)
  due: number // prochaine révision (ms)
}

export interface CardStat {
  reps: number
  ease: number
  interval: number // jours
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
  days: Record<string, number> // AAAA-MM-JJ -> nb d'exercices
}

export interface Settings {
  examDate: string
  dailyGoal: number
  token: string
  repo: string // owner/name
  theme: 'auto' | 'light' | 'dark'
  autoSync: boolean
}
