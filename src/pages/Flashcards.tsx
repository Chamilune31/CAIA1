import { useState } from 'react'
import { Deck } from '../components/Deck'
import { Rich } from '../components/Rich'
import { PageHead, TopicPicker, TopicTag } from '../components/ui'
import { CARDS } from '../content'
import { dueCards } from '../lib/plan'
import { useProgress } from '../lib/store'
import { isTopic, TOPICS } from '../topics'
import type { Card, TopicId } from '../types'

export default function Flashcards({ topic }: { topic?: string }) {
  const p = useProgress()
  const [t, setT] = useState<TopicId | 'all'>(topic && isTopic(topic) ? topic : 'all')
  const [run, setRun] = useState<{ cards: Card[]; reverse: boolean } | null>(null)
  const [q, setQ] = useState('')

  if (run)
    return (
      <div className="stack narrow">
        <button className="crumb" onClick={() => setRun(null)}>
          ← Flashcards
        </button>
        <Deck cards={run.cards} reverse={run.reverse} onDone={() => setRun(null)} />
      </div>
    )

  const { due, fresh } = dueCards(p, t, 20)
  const all = t === 'all' ? CARDS : CARDS.filter((c) => c.topic === t)
  const shuffled = () => [...all].sort(() => Math.random() - 0.5).slice(0, 30)
  const needle = q.trim().toLowerCase()
  const glossary = all.filter((c) => !needle || `${c.front} ${c.back}`.toLowerCase().includes(needle)).sort((a, b) => a.front.localeCompare(b.front))
  const counts = Object.fromEntries([['all', CARDS.length], ...TOPICS.map((tp) => [tp.id, CARDS.filter((c) => c.topic === tp.id).length])])
  const learned = all.filter((c) => p.cards[c.id]).length

  return (
    <div className="stack">
      <PageHead title="Flashcards">Exam vocabulary with spaced repetition: each card comes back just before you would forget it.</PageHead>
      <TopicPicker value={t} onChange={setT} counts={counts} />
      <div className="grid-3">
        <button className="card tile" disabled={!due.length && !fresh.length} onClick={() => setRun({ cards: [...due, ...fresh], reverse: false })}>
          <span className="label">Today’s review</span>
          <span className="big">{due.length + fresh.length} cards</span>
          <span className="muted small">
            {due.length} due, {fresh.length} new
          </span>
        </button>
        <button className="card tile" disabled={!all.length} onClick={() => setRun({ cards: shuffled(), reverse: true })}>
          <span className="label">Reverse mode</span>
          <span className="big">Definition first</span>
          <span className="muted small">Name the term from its definition</span>
        </button>
        <button className="card tile" disabled={!all.length} onClick={() => setRun({ cards: shuffled(), reverse: false })}>
          <span className="label">Free practice</span>
          <span className="big">30 random cards</span>
          <span className="muted small">
            {learned} of {all.length} cards started
          </span>
        </button>
      </div>
      <section className="card">
        <div className="row between wrap">
          <h2>Glossary</h2>
          <input className="search" type="search" placeholder="Find a term" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Find a term" />
        </div>
        <dl className="glossary">
          {glossary.map((c) => (
            <div key={c.id}>
              <dt>
                {c.front} <TopicTag id={c.topic} />
              </dt>
              <dd>
                <Rich text={c.back} />
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  )
}
