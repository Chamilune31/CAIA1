import { useState } from 'react'
import { Bar, fmtDate, PageHead, plural, TopicTag } from '../components/ui'
import { CARDS } from '../content'
import { GENERATORS } from '../lib/calc'
import { currentStep, readiness, streakDays, studyPlan, tagStats, topicStats } from '../lib/plan'
import { href } from '../lib/router'
import { today, useProgress, useSettings } from '../lib/store'
import { TOPIC, TOPICS } from '../topics'

export default function Progress() {
  const p = useProgress()
  const s = useSettings()
  const [showAllTags, setShowAllTags] = useState(false)
  const plan = studyPlan(s.examDate)
  const step = plan.length ? currentStep(plan) : null
  const ready = readiness(p)
  const cardsSeen = Object.keys(p.cards).length
  const cardsMature = Object.values(p.cards).filter((c) => c.interval >= 21).length
  const totalWork = Object.values(p.days).reduce((a, b) => a + b, 0)
  const tags = tagStats(p)
    .filter((t) => t.attempts > 0)
    .sort((a, b) => (a.accuracy ?? 0) - (b.accuracy ?? 0))

  // last 12 weeks of activity
  const weeks: { key: string; n: number }[][] = []
  const d = new Date()
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7) - 7 * 11)
  for (let w = 0; w < 12; w++) {
    const col = []
    for (let k = 0; k < 7; k++) {
      const key = today(d)
      col.push({ key, n: d > new Date() ? -1 : (p.days[key] ?? 0) })
      d.setDate(d.getDate() + 1)
    }
    weeks.push(col)
  }

  return (
    <div className="stack">
      <PageHead title="Progress" />
      <div className="grid-3">
        <div className="card stat">
          <b>{ready}%</b>
          <span>Readiness, weighted by exam topic weights</span>
        </div>
        <div className="card stat">
          <b>{plural(streakDays(p), 'day')}</b>
          <span>in a row, {totalWork} items practised in total</span>
        </div>
        <div className="card stat">
          <b>
            {cardsMature}/{CARDS.length}
          </b>
          <span>flashcards mastered ({cardsSeen} started)</span>
        </div>
      </div>

      <section className="card">
        <div className="section-title">
          <h2>By topic</h2>
          <p>Red means under 70% correct: those topics get priority in your daily session and in new content.</p>
        </div>
        <div className="table-wrap">
          <table className="topic-table">
            <thead>
              <tr>
                <th>Topic</th>
                <th>Weight</th>
                <th>Questions seen</th>
                <th>Correct</th>
                <th>Mastered</th>
              </tr>
            </thead>
            <tbody>
              {TOPICS.map((t) => {
                const st = topicStats(p, t.id)
                const weak = st.accuracy !== null && st.accuracy < 0.7
                return (
                  <tr key={t.id}>
                    <td>
                      <a href={href(`/topic/${t.id}`)}>
                        <TopicTag id={t.id} long />
                      </a>
                    </td>
                    <td>
                      {t.weight[0]}–{t.weight[1]}%
                    </td>
                    <td className="bar-cell">
                      <Bar value={st.total ? st.seen / st.total : 0} color={t.color} label={`${t.short}: questions seen`} />
                      <span className="small muted">
                        {st.seen}/{st.total}
                      </span>
                    </td>
                    <td className={weak ? 'bad-text' : ''}>{st.accuracy === null ? '—' : `${Math.round(st.accuracy * 100)}%`}</td>
                    <td>{st.mastered}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <div className="section-title">
          <h2>Subtopics</h2>
          <p>Weakest first. Tap one to practise it.</p>
        </div>
        {!tags.length && <p className="muted">Answer a few questions and your subtopic scores will appear here.</p>}
        {tags.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Subtopic</th>
                  <th>Topic</th>
                  <th>Attempts</th>
                  <th>Correct</th>
                </tr>
              </thead>
              <tbody>
                {(showAllTags ? tags : tags.slice(0, 10)).map((x) => (
                  <tr key={x.topic + x.tag}>
                    <td>
                      <a href={href(`/quiz?topic=${x.topic}&tag=${encodeURIComponent(x.tag)}&n=10`)}>{x.tag}</a>
                    </td>
                    <td>
                      <TopicTag id={x.topic} />
                    </td>
                    <td className="muted">{x.attempts}</td>
                    <td className={(x.accuracy ?? 1) < 0.7 ? 'bad-text' : ''}>{Math.round((x.accuracy ?? 0) * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {tags.length > 10 && (
          <button className="link small" style={{ marginTop: 10 }} onClick={() => setShowAllTags(!showAllTags)}>
            {showAllTags ? 'Show fewer' : `Show all ${tags.length}`}
          </button>
        )}
      </section>

      <section className="card">
        <div className="section-title">
          <h2>Study plan</h2>
          <p>Time per topic follows the exam weights; the last three weeks are for mixed review and mock exams.</p>
        </div>
        {!plan.length && <p className="muted">Your exam date has passed. Set a new one in Settings.</p>}
        <ol className="timeline">
          {plan.map((st, i) => {
            const cur = st === step
            const past = st.end.getTime() < Date.now()
            const color = st.topic === 'review' ? 'var(--gold)' : TOPIC[st.topic].color
            return (
              <li key={i} className={`${cur ? 'cur' : ''} ${past ? 'past' : ''}`} style={{ ['--tc' as string]: color }} aria-current={cur ? 'step' : undefined}>
                <span className="tl-dates">
                  {fmtDate(st.start)} – {fmtDate(st.end)}
                </span>
                <span>{st.topic === 'review' ? 'Mixed review and mock exams' : TOPIC[st.topic].name}</span>
              </li>
            )
          })}
        </ol>
      </section>

      <section className="card">
        <div className="section-title">
          <h2>Activity</h2>
          <p>Last 12 weeks. Darkest = daily goal reached.</p>
        </div>
        <div className="heat" role="img" aria-label="Activity over the last 12 weeks">
          {weeks.map((col, i) => (
            <div key={i}>
              {col.map((c) => (
                <span key={c.key} title={`${c.key}: ${Math.max(0, c.n)} items`} className={c.n < 0 ? 'future' : c.n === 0 ? '' : c.n < 15 ? 'l1' : c.n < s.dailyGoal ? 'l2' : 'l3'} />
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2 style={{ marginBottom: 8 }}>Calculation drills</h2>
        <ul className="calc-stats">
          {GENERATORS.map((g) => {
            const c = p.calc[g.id]
            return (
              <li key={g.id}>
                <a href={href(`/calc/${g.id}`)}>{g.title}</a>
                <span className={c && c.ok / c.seen < 0.7 ? 'bad-text' : 'muted'}>{c ? `${c.ok}/${c.seen}` : '—'}</span>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
