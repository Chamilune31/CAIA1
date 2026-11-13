import { Bar, PageHead, TopicTag } from '../components/ui'
import { CARDS } from '../content'
import { GENERATORS } from '../lib/calc'
import { currentStep, readiness, streakDays, studyPlan, topicStats } from '../lib/plan'
import { href } from '../lib/router'
import { today, useProgress, useSettings } from '../lib/store'
import { TOPIC, TOPICS } from '../topics'

const fmt = (d: Date) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })

export default function Suivi() {
  const p = useProgress()
  const s = useSettings()
  const plan = studyPlan(s.examDate)
  const step = plan.length ? currentStep(plan) : null
  const ready = readiness(p)
  const cardsSeen = Object.keys(p.cards).length
  const cardsMature = Object.values(p.cards).filter((c) => c.interval >= 21).length

  // activité des 12 dernières semaines
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
  const totalWork = Object.values(p.days).reduce((a, b) => a + b, 0)

  return (
    <div className="stack">
      <PageHead kicker="Mon suivi" title="Progression" />
      <div className="grid-3">
        <div className="card stat">
          <b>{ready} %</b>
          <span>préparation pondérée par les poids de l’examen</span>
        </div>
        <div className="card stat">
          <b>{streakDays(p)} j</b>
          <span>
            d’affilée · {totalWork} exercices au total
          </span>
        </div>
        <div className="card stat">
          <b>
            {cardsMature}/{CARDS.length}
          </b>
          <span>flashcards maîtrisées ({cardsSeen} déjà vues)</span>
        </div>
      </div>

      <section className="card">
        <h2>Par topic</h2>
        <div className="table-wrap">
          <table className="topic-table">
            <thead>
              <tr>
                <th>Topic</th>
                <th>Poids</th>
                <th>Questions vues</th>
                <th>Réussite</th>
                <th>Maîtrisées</th>
              </tr>
            </thead>
            <tbody>
              {TOPICS.map((t) => {
                const st = topicStats(p, t.id)
                const weak = st.accuracy !== null && st.accuracy < 0.7
                return (
                  <tr key={t.id}>
                    <td>
                      <a href={href(`/qcm?topic=${t.id}&n=10`)}>
                        <TopicTag id={t.id} /> {t.fr}
                      </a>
                    </td>
                    <td>
                      {t.weight[0]}–{t.weight[1]} %
                    </td>
                    <td className="bar-cell">
                      <Bar value={st.total ? st.seen / st.total : 0} color={t.color} />
                      <span className="small muted">
                        {st.seen}/{st.total}
                      </span>
                    </td>
                    <td className={weak ? 'bad-text' : ''}>{st.accuracy === null ? '—' : `${Math.round(st.accuracy * 100)} %`}</td>
                    <td>{st.mastered}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="muted small">En rouge : sous 70 % de réussite. Ces topics sont prioritaires dans la séance du jour et dans le nouveau contenu.</p>
      </section>

      <section className="card">
        <h2>Planning jusqu’à l’examen</h2>
        {!plan.length && <p className="muted">La date d’examen est passée : modifie-la dans les réglages.</p>}
        <ol className="timeline">
          {plan.map((st, i) => {
            const cur = st === step
            const past = st.end.getTime() < Date.now()
            const color = st.topic === 'review' ? 'var(--ink)' : TOPIC[st.topic].color
            return (
              <li key={i} className={`${cur ? 'cur' : ''} ${past ? 'past' : ''}`} style={{ ['--tc' as string]: color }}>
                <span className="tl-dates">
                  {fmt(st.start)} → {fmt(st.end)}
                </span>
                <span>{st.topic === 'review' ? 'Révision générale + examens blancs' : TOPIC[st.topic].fr}</span>
              </li>
            )
          })}
        </ol>
        <p className="muted small">Durées proportionnelles aux poids de l’examen. Les 3 dernières semaines sont réservées aux examens blancs.</p>
      </section>

      <section className="card">
        <h2>Activité</h2>
        <div className="heat">
          {weeks.map((col, i) => (
            <div key={i}>
              {col.map((c) => (
                <span key={c.key} title={`${c.key} : ${Math.max(0, c.n)}`} className={c.n < 0 ? 'future' : c.n === 0 ? '' : c.n < 15 ? 'l1' : c.n < s.dailyGoal ? 'l2' : 'l3'} />
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Calculs</h2>
        <ul className="calc-stats">
          {GENERATORS.map((g) => {
            const c = p.calc[g.id]
            return (
              <li key={g.id}>
                <a href={href(`/calculs/${g.id}`)}>
                  <TopicTag id={g.topic} /> <span lang="en">{g.title}</span>
                </a>
                <span className={c && c.ok / c.seen < 0.7 ? 'bad-text' : 'muted'}>{c ? `${c.ok}/${c.seen}` : '—'}</span>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
