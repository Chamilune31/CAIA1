import { useEffect, useState } from 'react'
import { fmtDate } from './components/ui'
import { onSync, syncState } from './lib/github'
import { dueCards, errorQuestions } from './lib/plan'
import { go, href, useRoute } from './lib/router'
import { useProgress, useSettings } from './lib/store'
import Calc from './pages/Calc'
import Courses from './pages/Courses'
import Flashcards from './pages/Flashcards'
import Formulas from './pages/Formulas'
import Home from './pages/Home'
import MockExam from './pages/MockExam'
import Notes from './pages/Notes'
import Progress from './pages/Progress'
import Questions from './pages/Questions'
import Search from './pages/Search'
import Session from './pages/Session'
import Settings from './pages/Settings'
import Topic from './pages/Topic'

const I = {
  home: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z',
  notes: 'M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h11',
  formulas: 'M17 5H7l6 7-6 7h10',
  cards: 'M8 8h12v12H8zM4 16V4h12',
  courses: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM12 10v6M9 13l3-3 3 3',
  questions: 'M9 11l3 3 8-8M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9',
  calc: 'M6 3h12v18H6zM9 7h6M9 12h.01M12 12h.01M15 12h.01M9 16h.01M12 16h.01M15 16h.01',
  exam: 'M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z',
  progress: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  settings: 'M4 6h9M17 6h3M15 4v4M4 12h3M11 12h9M9 10v4M4 18h11M19 18h1M17 16v4',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4',
  learn: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19V5',
}

const Icon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d={d} />
  </svg>
)

export const Seal = () => (
  <svg className="seal" viewBox="0 0 64 64" aria-hidden="true">
    <circle cx="32" cy="32" r="30" fill="var(--green)" />
    <circle cx="32" cy="32" r="24" fill="none" stroke="var(--paper)" strokeWidth="1.4" strokeDasharray="2 3" />
    <text x="32" y="40" textAnchor="middle" fontFamily="Georgia, serif" fontWeight="700" fontSize="22" fill="var(--paper)">
      I
    </text>
    <circle cx="50" cy="14" r="6" fill="var(--gold)" />
  </svg>
)

type NavItem = { to: string; label: string; icon: string; badge?: 'cards' | 'errors' }
const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: 'Learn',
    items: [
      { to: '/notes', label: 'Study notes', icon: I.notes },
      { to: '/formulas', label: 'Formulas', icon: I.formulas },
      { to: '/flashcards', label: 'Flashcards', icon: I.cards, badge: 'cards' },
      { to: '/courses', label: 'My courses', icon: I.courses },
    ],
  },
  {
    group: 'Practise',
    items: [
      { to: '/quiz', label: 'Questions', icon: I.questions, badge: 'errors' },
      { to: '/calc', label: 'Calculations', icon: I.calc },
      { to: '/exam', label: 'Mock exam', icon: I.exam },
    ],
  },
  {
    group: 'Track',
    items: [
      { to: '/progress', label: 'Progress', icon: I.progress },
      { to: '/settings', label: 'Settings', icon: I.settings },
    ],
  },
]

// which nav entry is "current" for each route
const ACTIVE: Record<string, string> = {
  notes: '/notes',
  note: '/notes',
  topic: '/notes',
  formulas: '/formulas',
  flashcards: '/flashcards',
  courses: '/courses',
  quiz: '/quiz',
  calc: '/calc',
  exam: '/exam',
  session: '/quiz',
  progress: '/progress',
  settings: '/settings',
}

const MOBILE = [
  { to: '/', label: 'Today', icon: I.home, section: '/' },
  { to: '/notes', label: 'Learn', icon: I.learn, section: 'learn' },
  { to: '/quiz', label: 'Practise', icon: I.questions, section: 'practise' },
  { to: '/progress', label: 'Progress', icon: I.progress, section: 'track' },
]
const SECTION: Record<string, string> = {
  '/notes': 'learn',
  '/formulas': 'learn',
  '/flashcards': 'learn',
  '/courses': 'learn',
  '/quiz': 'practise',
  '/calc': 'practise',
  '/exam': 'practise',
  '/progress': 'track',
  '/settings': 'track',
}

function SyncStatus() {
  const [s, setS] = useState(syncState())
  useEffect(() => onSync(setS), [])
  if (s.status === 'off') return null
  const label = { idle: 'Sync ready', syncing: 'Syncing…', ok: 'Synced', error: 'Sync error', off: '' }[s.status]
  return (
    <a href={href('/settings')} className={`sync ${s.status}`} title={s.error ?? label}>
      <i /> {label}
    </a>
  )
}

export default function App() {
  const { parts, query } = useRoute()
  const settings = useSettings()
  const p = useProgress()
  const [first, ...rest] = parts
  const counts = { cards: dueCards(p).due.length, errors: errorQuestions(p).length }

  useEffect(() => {
    const root = document.documentElement
    if (settings.theme === 'auto') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', settings.theme)
  }, [settings.theme])

  // "/" opens search from anywhere
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) {
        e.preventDefault()
        go('/search')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  let page
  switch (first) {
    case undefined:
      page = <Home />
      break
    case 'notes':
      page = <Notes topic={rest[0]} />
      break
    case 'note':
      page = <Notes noteId={rest[0]} />
      break
    case 'topic':
      page = <Topic id={rest[0]} />
      break
    case 'formulas':
      page = <Formulas topic={query.topic} />
      break
    case 'flashcards':
      page = <Flashcards topic={query.topic} />
      break
    case 'courses':
      page = <Courses id={rest[0]} />
      break
    case 'quiz':
      page = <Questions query={query} />
      break
    case 'calc':
      page = <Calc genId={rest[0]} topic={query.topic} />
      break
    case 'exam':
      page = <MockExam />
      break
    case 'session':
      page = <Session />
      break
    case 'progress':
      page = <Progress />
      break
    case 'settings':
      page = <Settings />
      break
    case 'search':
      page = <Search q={query.q} />
      break
    default:
      page = <Home />
  }

  const active = first ? ACTIVE[first] : '/'
  const section = active ? (SECTION[active] ?? '/') : '/'
  const subnav = NAV.find((g) => g.items.some((it) => it.to === active))

  return (
    <div className="shell">
      <aside className="side">
        <a href={href('/')} className="brand" aria-label="CAIA Level I, home">
          <Seal />
          <span className="brand-text">
            <b>CAIA Level I</b>
            <span>Revision desk</span>
          </span>
        </a>
        <button className="search-trigger" onClick={() => go('/search')}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d={I.search} />
          </svg>
          Search
          <kbd>/</kbd>
        </button>
        <a href={href('/')} className={`nav-link ${active === '/' ? 'on' : ''}`}>
          <Icon d={I.home} />
          Today
        </a>
        {NAV.map((g) => (
          <nav key={g.group} aria-label={g.group}>
            <p className="nav-group">{g.group}</p>
            {g.items.map((it) => {
              const n = it.badge ? counts[it.badge] : 0
              return (
                <a key={it.to} href={href(it.to)} className={`nav-link ${active === it.to ? 'on' : ''}`} aria-current={active === it.to ? 'page' : undefined}>
                  <Icon d={it.icon} />
                  {it.label}
                  {n > 0 && (
                    <span className={`badge ${it.badge === 'errors' ? 'hot' : ''}`} title={it.badge === 'cards' ? 'Cards due' : 'Questions to retry'}>
                      {n}
                    </span>
                  )}
                </a>
              )
            })}
          </nav>
        ))}
        <div className="side-foot">
          <a href={href('/settings')}>Exam {fmtDate(settings.examDate, { day: 'numeric', month: 'long', year: 'numeric' })}</a>
          <SyncStatus />
        </div>
      </aside>

      <header className="topbar">
        <a href={href('/')} className="brand" aria-label="CAIA Level I, home">
          <Seal />
          <span className="brand-text">
            <b>CAIA Level I</b>
            <span>Revision desk</span>
          </span>
        </a>
        <button className="icon-btn" onClick={() => go('/search')} aria-label="Search">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d={I.search} />
          </svg>
        </button>
      </header>

      {subnav && (
        <nav className="subnav" aria-label={subnav.group}>
          {subnav.items.map((it) => (
            <a key={it.to} href={href(it.to)} className={active === it.to ? 'on' : ''}>
              {it.label}
              {it.badge && counts[it.badge] > 0 ? ` (${counts[it.badge]})` : ''}
            </a>
          ))}
        </nav>
      )}

      <main className="main" key={first ?? 'home'}>
        {page}
      </main>

      <nav className="bottombar" aria-label="Main">
        {MOBILE.map((m) => (
          <a key={m.to} href={href(m.to)} className={section === m.section ? 'on' : ''}>
            <Icon d={m.icon} />
            {m.label}
            {m.section === 'practise' && counts.errors > 0 && <i className="dot" aria-label="Questions to retry" />}
          </a>
        ))}
      </nav>
    </div>
  )
}
