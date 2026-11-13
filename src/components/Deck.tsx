import { useEffect, useState } from 'react'
import { nextCard, recordCard, useProgress } from '../lib/store'
import { TOPIC } from '../topics'
import type { Card } from '../types'
import { Rich } from './Rich'
import { Bar, TopicTag } from './ui'

const GRADES = [
  { g: 0, label: 'Again', key: '1' },
  { g: 1, label: 'Hard', key: '2' },
  { g: 2, label: 'Good', key: '3' },
  { g: 3, label: 'Easy', key: '4' },
] as const

const fmtInterval = (d: number) => (d === 0 ? '5 min' : d === 1 ? '1 day' : d < 30 ? `${d} days` : `${Math.round(d / 30)} mo`)

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
    // an "again" card goes back to the end of the deck
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
        <h2>Deck complete</h2>
        <div className="big-score">
          {count}
          <span> {count === 1 ? 'card' : 'cards'} reviewed</span>
        </div>
        <p className="muted">Each card is scheduled to come back just before you are likely to forget it.</p>
        {onDone && (
          <button className="btn primary" onClick={onDone}>
            Continue
          </button>
        )}
      </div>
    )

  const front = reverse ? c.back : c.front
  const back = reverse ? c.front : c.back
  return (
    <div className="deck">
      <div className="quiz-top">
        <span>{queue.length} left</span>
        <Bar value={count / (count + queue.length)} label="Progress through the deck" />
      </div>
      <button
        className={`flash ${flipped ? 'flipped' : ''}`}
        style={{ ['--tc' as string]: TOPIC[c.topic].color }}
        onClick={() => setFlipped(true)}
        aria-label={flipped ? 'Card' : 'Reveal the answer'}
      >
        <span className="flash-meta">
          <TopicTag id={c.topic} long />
        </span>
        <span className={`flash-front ${reverse ? 'def' : ''}`}>
          <Rich text={front} />
        </span>
        {flipped ? (
          <span className="flash-back">
            <span className={reverse ? 'term' : ''}>
              <Rich text={back} />
            </span>
            {c.hint && (
              <span className="flash-hint">
                <Rich text={c.hint} />
              </span>
            )}
          </span>
        ) : (
          <span className="muted small">Tap or press Space to reveal</span>
        )}
      </button>
      {flipped && (
        <div className="grades" role="group" aria-label="How well did you know it?">
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
