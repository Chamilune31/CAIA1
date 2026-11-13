import { useState } from 'react'
import { Practice } from '../components/Quiz'
import { PageHead, plural, TopicPicker } from '../components/ui'
import { QUESTIONS } from '../content'
import { errorQuestions, pickQuestions, topicStats } from '../lib/plan'
import { go } from '../lib/router'
import { getProgress, useProgress } from '../lib/store'
import { isTopic, TOPICS } from '../topics'
import type { Question, TopicId } from '../types'

export default function Questions({ query }: { query: Record<string, string> }) {
  const p = useProgress()
  const [t, setT] = useState<TopicId | 'all'>(query.topic && isTopic(query.topic) ? query.topic : 'all')
  const [n, setN] = useState(10)
  const [onlyCalc, setOnlyCalc] = useState(false)
  const [tag, setTag] = useState(query.tag ?? '')
  const [run, setRun] = useState<Question[] | null>(() => {
    const pr = getProgress()
    if (query.mode === 'errors') return errorQuestions(pr).slice(0, 20)
    if (query.topic && isTopic(query.topic)) {
      const pool = QUESTIONS.filter((q) => q.topic === query.topic && (!query.tag || q.tag === query.tag))
      return pickQuestions(pr, +(query.n || 10), 'all', pool)
    }
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
          className="crumb"
          onClick={() => {
            setRun(null)
            go('/quiz')
          }}
        >
          ← Choose another set
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
      <PageHead title="Practice questions">Exam-style multiple choice, marked instantly with an explanation. Questions you miss come back until you get them right.</PageHead>

      {errors.length > 0 && (
        <section className="card row between wrap" style={{ borderColor: 'var(--gold)' }}>
          <div>
            <h2>{plural(errors.length, 'question')} to retry</h2>
            <p className="muted small">Questions you got wrong recently.</p>
          </div>
          <button className="btn primary" onClick={() => start(errors.slice(0, 20))}>
            Retry my mistakes
          </button>
        </section>
      )}

      <section className="card stack">
        <h2>Build a set</h2>
        <div className="field">
          <span className="field-label">Topic</span>
          <TopicPicker
            value={t}
            onChange={(x) => {
              setT(x)
              setTag('')
            }}
            counts={counts}
          />
        </div>
        <div className="row wrap" style={{ alignItems: 'flex-end', gap: 16 }}>
          <div className="field" style={{ flex: '1 1 240px' }}>
            <label htmlFor="tag">Subtopic</label>
            <select id="tag" value={tag} onChange={(e) => setTag(e.target.value)}>
              <option value="">All subtopics</option>
              {tags.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <span className="field-label">Questions</span>
            <div className="seg" role="group" aria-label="Number of questions">
              {[5, 10, 20, 40].map((k) => (
                <button key={k} className={n === k ? 'on' : ''} onClick={() => setN(k)}>
                  {k}
                </button>
              ))}
            </div>
          </div>
        </div>
        <label className="check">
          <input type="checkbox" checked={onlyCalc} onChange={(e) => setOnlyCalc(e.target.checked)} /> Calculation questions only
        </label>
        <div className="row between wrap">
          <p className="muted small">
            {pool.length} questions match, {unseen} not seen yet
            {st && st.accuracy !== null ? `. You score ${Math.round(st.accuracy * 100)}% on this topic.` : '.'}
          </p>
          <button className="btn primary big" disabled={!pool.length} onClick={() => start(pickQuestions(p, n, 'all', pool))}>
            Start {Math.min(n, pool.length)} questions
          </button>
        </div>
      </section>
    </div>
  )
}
