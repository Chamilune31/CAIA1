import { useEffect, useState } from 'react'
import { onSync, syncState } from './lib/github'
import { href, useRoute } from './lib/router'
import { useSettings } from './lib/store'
import Home from './pages/Home'
import Fiches from './pages/Fiches'
import Formules from './pages/Formules'
import Flashcards from './pages/Flashcards'
import Cours from './pages/Cours'
import Qcm from './pages/Qcm'
import Calculs from './pages/Calculs'
import Examen from './pages/Examen'
import Seance from './pages/Seance'
import Suivi from './pages/Suivi'
import Reglages from './pages/Reglages'

const NAV = [
  {
    group: 'Apprendre',
    items: [
      ['/fiches', 'Fiches'],
      ['/formules', 'Formules'],
      ['/flashcards', 'Flashcards'],
      ['/cours', 'Mes cours'],
    ],
  },
  {
    group: 'Pratiquer',
    items: [
      ['/qcm', 'QCM'],
      ['/calculs', 'Calculs'],
      ['/examen', 'Examen blanc'],
    ],
  },
  {
    group: 'Mon suivi',
    items: [
      ['/suivi', 'Progression'],
      ['/reglages', 'Réglages'],
    ],
  },
] as const

const MOBILE = [
  ['/', 'Accueil', 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z'],
  ['/fiches', 'Apprendre', 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19V5'],
  ['/qcm', 'Pratiquer', 'M9 11l3 3 8-8M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9'],
  ['/suivi', 'Suivi', 'M4 20V10M10 20V4M16 20v-7M22 20H2'],
] as const

const SECTION_OF: Record<string, string> = {
  fiches: '/fiches',
  fiche: '/fiches',
  formules: '/fiches',
  flashcards: '/fiches',
  cours: '/fiches',
  qcm: '/qcm',
  calculs: '/qcm',
  examen: '/qcm',
  seance: '/qcm',
  suivi: '/suivi',
  reglages: '/suivi',
}

function SyncDot() {
  const [s, setS] = useState(syncState())
  useEffect(() => onSync(setS), [])
  if (s.status === 'off') return null
  const label = { idle: 'Synchro prête', syncing: 'Synchronisation…', ok: 'Synchronisé', error: 'Erreur de synchro', off: '' }[s.status]
  return <a href={href('/reglages')} className={`sync ${s.status}`} title={s.error ?? label} aria-label={label} />
}

export default function App() {
  const { parts, query } = useRoute()
  const settings = useSettings()
  const [first, ...rest] = parts

  useEffect(() => {
    const root = document.documentElement
    if (settings.theme === 'auto') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', settings.theme)
  }, [settings.theme])

  let page
  switch (first) {
    case undefined:
      page = <Home />
      break
    case 'fiches':
      page = <Fiches topic={rest[0]} />
      break
    case 'fiche':
      page = <Fiches ficheId={rest[0]} />
      break
    case 'formules':
      page = <Formules />
      break
    case 'flashcards':
      page = <Flashcards topic={query.topic} />
      break
    case 'cours':
      page = <Cours id={rest[0]} />
      break
    case 'qcm':
      page = <Qcm query={query} />
      break
    case 'calculs':
      page = <Calculs genId={rest[0]} topic={query.topic} />
      break
    case 'examen':
      page = <Examen />
      break
    case 'seance':
      page = <Seance />
      break
    case 'suivi':
      page = <Suivi />
      break
    case 'reglages':
      page = <Reglages />
      break
    default:
      page = <Home />
  }

  const current = '/' + (first ?? '')
  const section = first ? SECTION_OF[first] : '/'

  return (
    <div className="shell">
      <aside className="side">
        <a href={href('/')} className="brand">
          <span className="brand-mark">CAIA</span>
          <span className="brand-sub">Level I · carnet</span>
        </a>
        <a href={href('/')} className={`nav-link ${current === '/' ? 'on' : ''}`}>
          Accueil
        </a>
        {NAV.map((g) => (
          <nav key={g.group}>
            <p className="nav-group">{g.group}</p>
            {g.items.map(([to, label]) => (
              <a key={to} href={href(to)} className={`nav-link ${current === to || (to === '/fiches' && first === 'fiche') ? 'on' : ''}`}>
                {label}
              </a>
            ))}
          </nav>
        ))}
        <div className="side-foot">
          <SyncDot />
          <span className="muted small">Examen : {new Date(settings.examDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>
      </aside>

      <header className="topbar">
        <a href={href('/')} className="brand">
          <span className="brand-mark">CAIA</span>
          <span className="brand-sub">Level I</span>
        </a>
        <SyncDot />
      </header>

      {section !== '/' && (
        <nav className="subnav">
          {NAV.find((g) => g.items.some(([to]) => to === section))?.items.map(([to, label]) => (
            <a key={to} href={href(to)} className={current === to || (to === '/fiches' && first === 'fiche') ? 'on' : ''}>
              {label}
            </a>
          ))}
        </nav>
      )}

      <main className="main" key={first ?? 'home'}>
        {page}
      </main>

      <nav className="bottombar">
        {MOBILE.map(([to, label, d]) => (
          <a key={to} href={href(to)} className={section === to ? 'on' : ''}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d={d} />
            </svg>
            {label}
          </a>
        ))}
      </nav>
    </div>
  )
}
