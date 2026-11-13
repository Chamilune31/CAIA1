import { useState } from 'react'
import { Rich, Tex } from '../components/Rich'
import { PageHead, TopicPicker, TopicTag } from '../components/ui'
import { FORMULAS } from '../content'
import { GENERATORS } from '../lib/calc'
import { href } from '../lib/router'
import { TOPICS } from '../topics'
import type { TopicId } from '../types'

export default function Formules() {
  const [t, setT] = useState<TopicId | 'all'>('all')
  const [q, setQ] = useState('')
  const needle = q.trim().toLowerCase()
  const list = FORMULAS.filter((f) => (t === 'all' || f.topic === t) && (!needle || `${f.name} ${f.vars ?? ''} ${f.note ?? ''}`.toLowerCase().includes(needle)))
  const counts = Object.fromEntries([['all', FORMULAS.length], ...TOPICS.map((tp) => [tp.id, FORMULAS.filter((f) => f.topic === tp.id).length])])
  return (
    <div className="stack">
      <PageHead kicker="Apprendre" title="Formulaire">
        Toutes les formules à connaître. Celles marquées « s’entraîner » ont un générateur d’exercices.
      </PageHead>
      <div className="row wrap">
        <TopicPicker value={t} onChange={setT} counts={counts} />
        <input className="search" placeholder="Rechercher (sharpe, VaR, cap rate…)" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="formula-grid">
        {list.map((f) => {
          const gen = GENERATORS.find((g) => g.id === f.id)
          return (
            <article key={f.id} className="card formula-card">
              <div className="row between">
                <h3 lang="en">
                  <TopicTag id={f.topic} /> {f.name}
                </h3>
                {gen && (
                  <a className="pill link" href={href(`/calculs/${gen.id}`)}>
                    s’entraîner
                  </a>
                )}
              </div>
              <Tex tex={f.tex} block />
              {f.vars && (
                <p className="small">
                  <Rich text={f.vars} />
                </p>
              )}
              {f.note && (
                <p className="small muted">
                  <Rich text={f.note} />
                </p>
              )}
            </article>
          )
        })}
      </div>
    </div>
  )
}
