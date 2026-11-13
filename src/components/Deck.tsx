import { useEffect, useState } from 'react'
import { nextCard, recordCard, useProgress } from '../lib/store'
import { TOPIC } from '../topics'
import type { Card } from '../types'
import { Rich } from './Rich'
import { Bar, TopicTag } from './ui'

const GRADES = [
  { g: 0, label: 'À revoir', key: '1' },
  { g: 1, label: 'Difficile', key: '2' },
  { g: 2, label: 'Bien', key: '3' },
  { g: 3, label: 'Facile', key: '4' },
] as const

const fmtInterval = (d: number) => (d === 0 ? '5 min' : d === 1 ? '1 j' : d < 30 ? `${d} j` : `${Math.round(d / 30)} mois`)

export function Deck({ cards, onDone, reverse = false }: { cards: Card[]; onDone?: () => void; reverse?: boolean }) {
  const p = useProgress()
  const [queue, setQueue] = useState(cards)
  const [flipped, setFlipped] = useState(false)
  const [count, setCount] = useState(0)
  const c = queue[0]

  const grade = (g: 0 | 1 | 2 | 3) => {
    if (!c) return
    recordCard(c.id, g)
    setCount((n) => n + 1)
    setFlipped(false)
    // une carte « à revoir » repasse en fin de paquet
    setQueue((q) => (g === 0 ? [...q.slice(1), c] : q.slice(1)))
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!c) return
      if (!flipped && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault()
        setFlipped(true)
      } else if (flipped) {
        const gr = GRADES.find((x) => x.key === e.key)
        if (gr) grade(gr.g)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!c)
    return (
      <div className="card result">
        <p className="kicker">Paquet terminé</p>
        <div className="big-score">
          {count}
          <span> cartes</span>
        </div>
        <p className="muted">Les prochaines révisions sont planifiées automatiquement.</p>
        {onDone && (
          <button className="btn primary" onClick={onDone}>
            Continuer
          </button>
        )}
      </div>
    )

  const front = reverse ? c.back : c.front
  const back = reverse ? c.front : c.back
  return (
    <div className="deck">
      <div className="quiz-top">
        <span className="muted">{queue.length} restante{queue.length > 1 ? 's' : ''}</span>
        <Bar value={count / (count + queue.length)} />
      </div>
      <button
        className={`flash ${flipped ? 'flipped' : ''}`}
        style={{ ['--tc' as string]: TOPIC[c.topic].color }}
        onClick={() => setFlipped(true)}
        aria-label="Retourner la carte"
      >
        <span className="flash-meta">
          <TopicTag id={c.topic} />
        </span>
        <span className={`flash-front ${reverse ? 'def' : ''}`} lang="en">
          <Rich text={front} />
        </span>
        {flipped ? (
          <span className="flash-back">
            <span lang="en" className={reverse ? 'term' : ''}>
              <Rich text={back} />
            </span>
            {c.fr && (
              <span className="flash-fr">
                <Rich text={c.fr} />
              </span>
            )}
          </span>
        ) : (
          <span className="muted small">Toucher ou Espace pour voir la réponse</span>
        )}
      </button>
      {flipped && (
        <div className="grades">
          {GRADES.map(({ g, label, key }) => (
            <button key={g} className={`grade g${g}`} onClick={() => grade(g)}>
              {label}
              <small>{fmtInterval(nextCard(p.cards[c.id], g).interval)}</small>
              <kbd>{key}</kbd>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
