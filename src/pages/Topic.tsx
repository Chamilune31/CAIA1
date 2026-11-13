import { Empty } from '../components/ui'
import { CARDS, FICHES, FORMULAS, LESSONS, QUESTIONS } from '../content'
import { GENERATORS } from '../lib/calc'
import { dueCards, tagStats, topicStats } from '../lib/plan'
import { href } from '../lib/router'
import { useProgress } from '../lib/store'
import { TOPIC, isTopic } from '../topics'
import { NoteList } from './Notes'

export default function Topic({ id }: { id?: string }) {
  const p = useProgress()
  if (!id || !isTopic(id)) return <Empty>Unknown topic.</Empty>
  const t = TOPIC[id]
  const st = topicStats(p, id)
  const notes = FICHES.filter((f) => f.topic === id)
  const read = notes.filter((f) => p.read[f.id]).length
  const cards = CARDS.filter((c) => c.topic === id)
  const due = dueCards(p, id, 0).due.length
  const gens = GENERATORS.filter((g) => g.topic === id)
  const formulas = FORMULAS.filter((f) => f.topic === id)
  const lessons = LESSONS.filter((l) => l.topic === id)
  const tags = tagStats(p)
    .filter((x) => x.topic === id)
    .sort((a, b) => (a.accuracy ?? 2) - (b.accuracy ?? 2) || b.total - a.total)

  return (
    <div className="stack" style={{ ['--tc' as string]: t.color }}>
      <a className="crumb" href={href('/notes')}>
        ← All topics
      </a>
      <header className="topic-hero">
        <p className="muted">
          {t.weight[0]}–{t.weight[1]}% of the Level I exam
        </p>
        <h1>{t.name}</h1>
        <p className="lede">{t.summary}</p>
        <div className="stat-row">
          <div>
            <b>
              {read}/{notes.length}
            </b>
            <span>notes read</span>
          </div>
          <div>
            <b>
              {st.seen}/{st.total}
            </b>
            <span>questions seen</span>
          </div>
          <div>
            <b className={st.accuracy !== null && st.accuracy < 0.7 ? 'bad-text' : ''}>{st.accuracy === null ? '—' : `${Math.round(st.accuracy * 100)}%`}</b>
            <span>answered correctly</span>
          </div>
          <div>
            <b>{st.mastered}</b>
            <span>questions mastered</span>
          </div>
        </div>
      </header>

      <div className="action-grid">
        <a className="action" href={href(`/quiz?topic=${id}&n=10`)}>
          <b>Practise 10 questions</b>
          <span>{QUESTIONS.filter((q) => q.topic === id).length} in the bank</span>
        </a>
        <a className="action" href={href(`/flashcards?topic=${id}`)}>
          <b>Flashcards</b>
          <span>
            {cards.length} cards{due ? `, ${due} due` : ''}
          </span>
        </a>
        {gens.length > 0 && (
          <a className="action" href={href(`/calc?topic=${id}`)}>
            <b>Calculation drills</b>
            <span>{gens.length} types, endless numbers</span>
          </a>
        )}
        {formulas.length > 0 && (
          <a className="action" href={href(`/formulas?topic=${id}`)}>
            <b>Formulas</b>
            <span>{formulas.length} to know</span>
          </a>
        )}
      </div>

      <section className="stack tight">
        <h2>Study notes</h2>
        <NoteList notes={notes} />
        {lessons.length > 0 && (
          <ul className="note-list">
            {lessons.map((l) => (
              <li key={l.id}>
                <a href={href(`/courses/${l.id}`)}>
                  <span className="pill">Mine</span>
                  <span className="t">{l.title}</span>
                  <span className="s">from my course</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <div className="section-title">
          <h2>Subtopics</h2>
          <p>Weakest first. Tap one to practise it.</p>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Subtopic</th>
                <th>Questions</th>
                <th>Correct</th>
              </tr>
            </thead>
            <tbody>
              {tags.map((x) => (
                <tr key={x.tag}>
                  <td>
                    <a href={href(`/quiz?topic=${id}&tag=${encodeURIComponent(x.tag)}&n=10`)}>{x.tag}</a>
                  </td>
                  <td className="muted">
                    {x.seen}/{x.total} seen
                  </td>
                  <td className={x.accuracy !== null && x.accuracy < 0.7 ? 'bad-text' : ''}>{x.accuracy === null ? '—' : `${Math.round(x.accuracy * 100)}%`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
