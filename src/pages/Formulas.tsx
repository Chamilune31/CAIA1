import { useState } from 'react'
import { Rich, Tex } from '../components/Rich'
import { Empty, PageHead, TopicPicker, TopicTag } from '../components/ui'
import { FORMULAS } from '../content'
import { GEN_BY_ID } from '../lib/calc'
import { href } from '../lib/router'
import { isTopic, TOPICS } from '../topics'
import type { TopicId } from '../types'

export default function Formulas({ topic }: { topic?: string }) {
  const [t, setT] = useState<TopicId | 'all'>(topic && isTopic(topic) ? topic : 'all')
  const [q, setQ] = useState('')
  const needle = q.trim().toLowerCase()
  const list = FORMULAS.filter((f) => (t === 'all' || f.topic === t) && (!needle || `${f.name} ${f.vars ?? ''} ${f.note ?? ''}`.toLowerCase().includes(needle)))
  const counts = Object.fromEntries([['all', FORMULAS.length], ...TOPICS.map((tp) => [tp.id, FORMULAS.filter((f) => f.topic === tp.id).length])])
  return (
    <div className="stack">
      <PageHead title="Formulas">Every formula you need for Level I. Those marked “Drill” have a calculation exercise with fresh numbers each time.</PageHead>
      <TopicPicker value={t} onChange={setT} counts={counts} />
      <input className="search" type="search" placeholder="Filter, e.g. Sharpe, VaR, cap rate" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Filter formulas" />
      {!list.length && <Empty>No formula matches “{q}”.</Empty>}
      <div className="formula-grid">
        {list.map((f) => {
          const gen = GEN_BY_ID.get(f.id)
          return (
            <article key={f.id} className="card formula-card">
              <div className="row between">
                <h3>{f.name}</h3>
                {gen ? (
                  <a className="pill link" href={href(`/calc/${gen.id}`)}>
                    Drill
                  </a>
                ) : (
                  <TopicTag id={f.topic} />
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
