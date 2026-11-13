import { useState } from 'react'
import { Exam } from '../components/Quiz'
import { fmtDate, PageHead, TopicTag } from '../components/ui'
import { QUESTIONS } from '../content'
import { examQuestions } from '../lib/plan'
import { useProgress } from '../lib/store'
import { TOPICS } from '../topics'
import type { Question, TopicId } from '../types'

// Real pace: 200 questions in 4 hours = 72 seconds per question.
const FORMATS = [
  { n: 25, label: 'Sprint', time: '30 minutes' },
  { n: 50, label: 'Half session', time: '1 hour' },
  { n: 100, label: 'Full session', time: '2 hours, like one half of exam day' },
]

export default function MockExam() {
  const p = useProgress()
  const [run, setRun] = useState<{ qs: Question[]; limit: number } | null>(null)

  if (run) return <Exam questions={run.qs} limit={run.limit} onExit={() => setRun(null)} />

  const past = [...p.exams].reverse()
  return (
    <div className="stack">
      <PageHead title="Mock exam">Questions drawn in proportion to the 2027 topic weights, at real exam pace (72 seconds per question). Marked at the end, with a full review.</PageHead>
      <div className="grid-3">
        {FORMATS.map((f) => {
          const n = Math.min(f.n, QUESTIONS.length)
          return (
            <button key={f.n} className="card tile" onClick={() => setRun({ qs: examQuestions(n), limit: n * 72 })}>
              <span className="label">{f.label}</span>
              <span className="big">{n} questions</span>
              <span className="muted small">{f.time}</span>
            </button>
          )
        })}
      </div>
      <section className="card">
        <h2 style={{ marginBottom: 10 }}>Past attempts</h2>
        {!past.length && <p className="muted">Your results will appear here, broken down by topic.</p>}
        {past.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Score</th>
                  <th>Time</th>
                  {TOPICS.map((t) => (
                    <th key={t.id}>
                      <TopicTag id={t.id} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {past.map((e) => (
                  <tr key={e.id}>
                    <td>{fmtDate(e.date)}</td>
                    <td>
                      <b className={e.correct / e.total >= 0.7 ? 'ok-text' : 'bad-text'}>{Math.round((e.correct / e.total) * 100)}%</b>{' '}
                      <span className="muted small">
                        ({e.correct}/{e.total})
                      </span>
                    </td>
                    <td>{Math.round(e.seconds / 60)} min</td>
                    {TOPICS.map((t) => {
                      const v = e.byTopic[t.id as TopicId]
                      return <td key={t.id}>{v ? `${Math.round((v[0] / v[1]) * 100)}%` : '—'}</td>
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
