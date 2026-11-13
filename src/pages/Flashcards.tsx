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
        <button className="back link" onClick={() => setRun(null)}>
          ← Flashcards
        </button>
        <Deck cards={run.cards} reverse={run.reverse} onDone={() => setRun(null)} />
      </div>
    )

  const { due, fresh } = dueCards(p, t, 20)
  const all = t === 'all' ? CARDS : CARDS.filter((c) => c.topic === t)
  const shuffled = () => [...all].sort(() => Math.random() - 0.5).slice(0, 30)
  const needle = q.trim().toLowerCase()
  const glossary = all.filter((c) => !needle || `${c.front} ${c.back} ${c.fr ?? ''}`.toLowerCase().includes(needle)).sort((a, b) => a.front.localeCompare(b.front))
  const counts = Object.fromEntries([['all', CARDS.length], ...TOPICS.map((tp) => [tp.id, CARDS.filter((c) => c.topic === tp.id).length])])

  return (
    <div className="stack">
      <PageHead kicker="Apprendre" title="Flashcards">
        Le vocabulaire et les définitions de l’examen, en répétition espacée : chaque carte revient juste avant que tu l’oublies.
      </PageHead>
      <TopicPicker value={t} onChange={setT} counts={counts} />
      <div className="grid-3">
        <button className="card tile action" disabled={!due.length && !fresh.length} onClick={() => setRun({ cards: [...due, ...fresh], reverse: false })}>
          <p className="kicker">Révision du jour</p>
          <h3>{due.length + fresh.length} cartes</h3>
          <p className="muted small">
            {due.length} à revoir · {fresh.length} nouvelles
          </p>
        </button>
        <button className="card tile action" disabled={!all.length} onClick={() => setRun({ cards: shuffled(), reverse: true })}>
          <p className="kicker">Sens inversé</p>
          <h3>Définition → terme</h3>
          <p className="muted small">30 cartes au hasard</p>
        </button>
        <button className="card tile action" disabled={!all.length} onClick={() => setRun({ cards: shuffled(), reverse: false })}>
          <p className="kicker">Entraînement libre</p>
          <h3>30 cartes au hasard</h3>
          <p className="muted small">compte aussi pour la répétition</p>
        </button>
      </div>
      <section className="card">
        <div className="row between wrap">
          <h2>Glossaire</h2>
          <input className="search" placeholder="Rechercher un terme" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <dl className="glossary">
          {glossary.map((c) => (
            <div key={c.id}>
              <dt lang="en">
                <TopicTag id={c.topic} /> {c.front}
              </dt>
              <dd>
                <span lang="en">
                  <Rich text={c.back} />
                </span>
                {c.fr && (
                  <span className="muted small">
                    {' '}
                    — <Rich text={c.fr} />
                  </span>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  )
}
