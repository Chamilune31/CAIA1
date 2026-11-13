import { useState } from 'react'
import { Exam } from '../components/Quiz'
import { PageHead, TopicTag } from '../components/ui'
import { QUESTIONS } from '../content'
import { examQuestions } from '../lib/plan'
import { useProgress } from '../lib/store'
import { TOPICS } from '../topics'
import type { Question, TopicId } from '../types'

// Rythme réel : 200 questions en 4 heures = 72 secondes par question.
const FORMATS = [
  { n: 25, label: 'Sprint', desc: '25 questions · 30 min' },
  { n: 50, label: 'Demi-session', desc: '50 questions · 1 h' },
  { n: 100, label: 'Session complète', desc: '100 questions · 2 h (comme une demi-journée d’examen)' },
]

export default function Examen() {
  const p = useProgress()
  const [run, setRun] = useState<{ qs: Question[]; limit: number } | null>(null)

  if (run) return <Exam questions={run.qs} limit={run.limit} onExit={() => setRun(null)} />

  const past = [...p.exams].reverse()
  return (
    <div className="stack">
      <PageHead kicker="Pratiquer" title="Examen blanc">
        Questions tirées selon le poids de chaque topic, au rythme réel de l’examen (72 secondes par question). Correction à la fin seulement.
      </PageHead>
      <div className="grid-3">
        {FORMATS.map((f) => {
          const n = Math.min(f.n, QUESTIONS.length)
          return (
            <button key={f.n} className="card tile action" onClick={() => setRun({ qs: examQuestions(n), limit: n * 72 })}>
              <p className="kicker">{f.label}</p>
              <h3>{f.desc}</h3>
              {n < f.n && <p className="muted small">{n} questions disponibles pour l’instant</p>}
            </button>
          )
        })}
      </div>
      <section className="card">
        <h2>Historique</h2>
        {!past.length && <p className="muted">Aucun examen blanc pour l’instant.</p>}
        {past.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Score</th>
                  <th>Temps</th>
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
                    <td>{new Date(e.date).toLocaleDateString('fr-FR')}</td>
                    <td>
                      <b className={e.correct / e.total >= 0.7 ? 'ok-text' : 'bad-text'}>{Math.round((e.correct / e.total) * 100)} %</b>{' '}
                      <span className="muted small">
                        ({e.correct}/{e.total})
                      </span>
                    </td>
                    <td>{Math.round(e.seconds / 60)} min</td>
                    {TOPICS.map((t) => {
                      const v = e.byTopic[t.id as TopicId]
                      return <td key={t.id}>{v ? `${Math.round((v[0] / v[1]) * 100)} %` : '—'}</td>
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
