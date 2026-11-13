import { useEffect } from 'react'
import { Blocks } from '../components/Rich'
import { Empty, PageHead, TopicPicker, TopicTag } from '../components/ui'
import { FICHES, LESSONS, QUESTIONS } from '../content'
import { go, href } from '../lib/router'
import { markRead, useProgress } from '../lib/store'
import { TOPIC, TOPICS, isTopic } from '../topics'
import type { TopicId } from '../types'

export default function Fiches({ topic, ficheId }: { topic?: string; ficheId?: string }) {
  if (ficheId) return <Reader id={ficheId} />
  const t: TopicId | 'all' = topic && isTopic(topic) ? topic : 'all'
  return <List t={t} />
}

function List({ t }: { t: TopicId | 'all' }) {
  const p = useProgress()
  const topics = t === 'all' ? TOPICS : [TOPIC[t]]
  return (
    <div className="stack">
      <PageHead kicker="Apprendre" title="Fiches de cours">
        Synthèses en anglais (la langue de l’examen), avec les points clés et les pièges expliqués en français.
      </PageHead>
      <TopicPicker value={t} onChange={(x) => go(x === 'all' ? '/fiches' : `/fiches/${x}`)} />
      {topics.map((tp) => {
        const list = FICHES.filter((f) => f.topic === tp.id)
        const read = list.filter((f) => p.read[f.id]).length
        const lessons = LESSONS.filter((l) => l.topic === tp.id)
        return (
          <section key={tp.id} className="topic-section" style={{ ['--tc' as string]: tp.color }}>
            <div className="row between">
              <h2>
                <TopicTag id={tp.id} /> {tp.fr}
              </h2>
              <span className="muted small">
                {read}/{list.length} lues · {tp.weight[0]}–{tp.weight[1]} %
              </span>
            </div>
            <p className="muted small" lang="en">
              {tp.name} — {tp.summary}
            </p>
            <div className="fiche-grid">
              {list.map((f) => (
                <a key={f.id} href={href(`/fiche/${f.id}`)} className={`card fiche-tile ${p.read[f.id] ? 'read' : ''}`}>
                  <h3>{f.fr}</h3>
                  <p className="muted small" lang="en">
                    {f.title}
                  </p>
                  <span className="small muted">
                    {f.minutes} min {p.read[f.id] ? '· ✓ lue' : ''}
                  </span>
                </a>
              ))}
              {lessons.map((l) => (
                <a key={l.id} href={href(`/cours/${l.id}`)} className="card fiche-tile lesson">
                  <span className="pill">mon cours</span>
                  <h3>{l.title}</h3>
                </a>
              ))}
            </div>
            {!list.length && <Empty>Pas encore de fiche pour ce topic.</Empty>}
          </section>
        )
      })}
    </div>
  )
}

function Reader({ id }: { id: string }) {
  const p = useProgress()
  const idx = FICHES.findIndex((f) => f.id === id)
  const f = FICHES[idx]
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [id])
  if (!f) return <Empty>Fiche introuvable.</Empty>
  const siblings = FICHES.filter((x) => x.topic === f.topic)
  const si = siblings.indexOf(f)
  const prev = siblings[si - 1]
  const next = siblings[si + 1]
  const nq = QUESTIONS.filter((q) => q.topic === f.topic).length
  return (
    <article className="stack narrow reader" style={{ ['--tc' as string]: TOPIC[f.topic].color }}>
      <a href={href(`/fiches/${f.topic}`)} className="back">
        ← {TOPIC[f.topic].fr}
      </a>
      <header className="page-head">
        <p className="kicker">
          <TopicTag id={f.topic} /> {f.minutes} min de lecture
        </p>
        <h1 lang="en">{f.title}</h1>
        <p className="lede">{f.fr}</p>
      </header>
      <div lang="en">
        <Blocks blocks={f.blocks} />
      </div>
      <div className="reader-foot">
        <button className={`btn ${p.read[f.id] ? '' : 'primary'}`} onClick={() => markRead(f.id)} disabled={!!p.read[f.id]}>
          {p.read[f.id] ? '✓ Fiche lue' : 'Marquer comme lue'}
        </button>
        <a className="btn" href={href(`/qcm?topic=${f.topic}&n=10`)}>
          10 QCM sur ce topic ({nq})
        </a>
      </div>
      <nav className="row between">
        {prev ? (
          <a href={href(`/fiche/${prev.id}`)} className="pager">
            ← {prev.fr}
          </a>
        ) : (
          <span />
        )}
        {next && (
          <a href={href(`/fiche/${next.id}`)} className="pager right">
            {next.fr} →
          </a>
        )}
      </nav>
    </article>
  )
}
