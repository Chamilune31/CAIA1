import { useState } from 'react'
import { Practice } from '../components/Quiz'
import { PageHead, TopicPicker } from '../components/ui'
import { QUESTIONS } from '../content'
import { errorQuestions, pickQuestions, topicStats } from '../lib/plan'
import { go } from '../lib/router'
import { getProgress, useProgress } from '../lib/store'
import { isTopic, TOPICS } from '../topics'
import type { Question, TopicId } from '../types'

export default function Qcm({ query }: { query: Record<string, string> }) {
  const p = useProgress()
  const initialTopic: TopicId | 'all' = query.topic && isTopic(query.topic) ? query.topic : 'all'
  const [t, setT] = useState<TopicId | 'all'>(initialTopic)
  const [n, setN] = useState(10)
  const [onlyCalc, setOnlyCalc] = useState(false)
  const [tag, setTag] = useState('')
  const [run, setRun] = useState<Question[] | null>(() => {
    if (query.mode === 'errors') return errorQuestions(getProgress()).slice(0, 20)
    if (query.topic && isTopic(query.topic)) return pickQuestions(getProgress(), +(query.n || 10), query.topic)
    return null
  })
  const [runKey, setRunKey] = useState(0)

  const start = (qs: Question[]) => {
    setRun(qs)
    setRunKey((k) => k + 1)
  }

  if (run)
    return (
      <div className="stack narrow">
        <button
          className="back link"
          onClick={() => {
            setRun(null)
            go('/qcm')
          }}
        >
          ← Choisir une autre série
        </button>
        <Practice key={runKey} questions={run} onDone={() => setRun(null)} />
      </div>
    )

  const pool = QUESTIONS.filter((q) => (t === 'all' || q.topic === t) && (!onlyCalc || q.calc) && (!tag || q.tag === tag))
  const tags = [...new Set(QUESTIONS.filter((q) => t === 'all' || q.topic === t).map((q) => q.tag))].sort()
  const errors = errorQuestions(p)
  const counts = Object.fromEntries([['all', QUESTIONS.length], ...TOPICS.map((tp) => [tp.id, QUESTIONS.filter((q) => q.topic === tp.id).length])])
  const st = t !== 'all' ? topicStats(p, t) : null
  const unseen = pool.filter((q) => !p.q[q.id]).length

  return (
    <div className="stack">
      <PageHead kicker="Pratiquer" title="QCM">
        Questions type examen (4 choix), en anglais, corrigées immédiatement avec une explication en français.
      </PageHead>
      <TopicPicker
        value={t}
        onChange={(x) => {
          setT(x)
          setTag('')
        }}
        counts={counts}
      />
      <section className="card setup">
        <div className="field">
          <label>Nombre de questions</label>
          <div className="seg">
            {[5, 10, 20, 40].map((k) => (
              <button key={k} className={n === k ? 'on' : ''} onClick={() => setN(k)}>
                {k}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <label htmlFor="tag">Sous-thème</label>
          <select id="tag" value={tag} onChange={(e) => setTag(e.target.value)}>
            <option value="">Tous les sous-thèmes</option>
            {tags.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </div>
        <label className="check">
          <input type="checkbox" checked={onlyCalc} onChange={(e) => setOnlyCalc(e.target.checked)} /> Questions de calcul seulement
        </label>
        <p className="muted small">
          {pool.length} questions dans ce choix · {unseen} jamais vues
          {st && st.accuracy !== null ? ` · réussite ${Math.round(st.accuracy * 100)} %` : ''}
        </p>
        <button className="btn primary big" disabled={!pool.length} onClick={() => start(pickQuestions(p, n, 'all', pool))}>
          Commencer
        </button>
      </section>
      <section className="card row between wrap">
        <div>
          <h3>Carnet d’erreurs</h3>
          <p className="muted small">{errors.length ? `${errors.length} questions ratées à reprendre.` : 'Aucune erreur en attente.'}</p>
        </div>
        <button className="btn" disabled={!errors.length} onClick={() => start(errors.slice(0, 20))}>
          Reprendre mes erreurs
        </button>
      </section>
    </div>
  )
}
