import { CARDS, FICHES, QUESTIONS, recentPacks } from '../content'
import { Bar, TopicTag } from '../components/ui'
import { GENERATORS } from '../lib/calc'
import { currentStep, daysUntil, dueCards, errorQuestions, readiness, streakDays, studyPlan, topicStats } from '../lib/plan'
import { href } from '../lib/router'
import { today, useProgress, useSettings } from '../lib/store'
import { TOPIC, TOPICS } from '../topics'

export default function Home() {
  const p = useProgress()
  const s = useSettings()
  const days = daysUntil(s.examDate)
  const plan = studyPlan(s.examDate)
  const step = plan.length ? currentStep(plan) : null
  const ready = readiness(p)
  const cards = dueCards(p)
  const sessionCards = dueCards(p, 'all', 8).all.slice(0, 15).length
  const errors = errorQuestions(p)
  const doneToday = p.days[today()] ?? 0
  const streak = streakDays(p)
  const fresh = recentPacks()
  const focusFiches = step && step.topic !== 'review' ? FICHES.filter((f) => f.topic === step.topic) : []
  const nextFiche = focusFiches.find((f) => !p.read[f.id]) ?? focusFiches[0]

  return (
    <div className="stack home">
      <section className="hero">
        <div>
          <p className="kicker">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <h1>
            {days > 0 ? (
              <>
                J−{days} <span className="muted">avant le Level I</span>
              </>
            ) : (
              'Révisions libres'
            )}
          </h1>
          {step && (
            <p className="lede">
              Focus du moment :{' '}
              {step.topic === 'review' ? (
                <b>révision générale et examens blancs</b>
              ) : (
                <>
                  <TopicTag id={step.topic} /> <b>{TOPIC[step.topic].fr}</b>
                </>
              )}{' '}
              <span className="muted">jusqu’au {step.end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
            </p>
          )}
        </div>
        <div className="hero-stats">
          <div>
            <b>{ready}</b>
            <span>% préparation</span>
          </div>
          <div>
            <b>{doneToday}</b>
            <span>/ {s.dailyGoal} aujourd’hui</span>
          </div>
          <div>
            <b>{streak}</b>
            <span>jour{streak > 1 ? 's' : ''} d’affilée</span>
          </div>
        </div>
      </section>

      <a href={href('/seance')} className="card session-cta">
        <div>
          <p className="kicker">Séance du jour · ~25 min</p>
          <h2>Lancer ma séance</h2>
          <p className="muted">
            {sessionCards} flashcards · 10 QCM ciblés{errors.length ? ` (dont ${Math.min(errors.length, 4)} erreurs à revoir)` : ''} · 2 calculs
          </p>
        </div>
        <span className="arrow">→</span>
      </a>

      <div className="grid-3">
        {nextFiche && (
          <a href={href(`/fiche/${nextFiche.id}`)} className="card tile" style={{ ['--tc' as string]: TOPIC[nextFiche.topic].color }}>
            <p className="kicker">Fiche suggérée</p>
            <h3>{nextFiche.fr}</h3>
            <p className="muted small" lang="en">
              {nextFiche.title} · {nextFiche.minutes} min
            </p>
          </a>
        )}
        <a href={href('/flashcards')} className="card tile">
          <p className="kicker">Flashcards</p>
          <h3>{cards.due.length} à revoir</h3>
          <p className="muted small">{cards.fresh.length ? `${CARDS.filter((c) => !p.cards[c.id]).length} jamais vues` : 'Toutes vues'}</p>
        </a>
        <a href={href('/qcm?mode=errors')} className="card tile">
          <p className="kicker">Carnet d’erreurs</p>
          <h3>{errors.length} question{errors.length > 1 ? 's' : ''}</h3>
          <p className="muted small">{errors.length ? 'Les reprendre maintenant' : 'Rien à reprendre'}</p>
        </a>
      </div>

      <section className="card">
        <div className="row between">
          <h2>Les 7 topics</h2>
          <span className="muted small">poids à l’examen 2027</span>
        </div>
        <ul className="topic-list">
          {TOPICS.map((t) => {
            const st = topicStats(p, t.id)
            return (
              <li key={t.id} style={{ ['--tc' as string]: t.color }}>
                <a href={href(`/fiches/${t.id}`)}>
                  <span className="tl-name">
                    <TopicTag id={t.id} /> {t.fr}
                  </span>
                  <span className="tl-weight">
                    {t.weight[0]}–{t.weight[1]} %
                  </span>
                  <span className="tl-bar">
                    <Bar value={st.total ? st.seen / st.total : 0} color={t.color} />
                  </span>
                  <span className="tl-acc">{st.accuracy === null ? '—' : `${Math.round(st.accuracy * 100)} %`}</span>
                </a>
              </li>
            )
          })}
        </ul>
        <p className="muted small">Barre : questions déjà vues · à droite : taux de réussite.</p>
      </section>

      {fresh.length > 0 && (
        <section className="card">
          <h2>Nouveau contenu</h2>
          <ul className="plain">
            {fresh.map((pk) => (
              <li key={pk.id}>
                <span className="pill new">nouveau</span> {pk.title}{' '}
                <span className="muted small">({new Date(pk.added).toLocaleDateString('fr-FR')})</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="muted small center">
        {QUESTIONS.length} QCM · {GENERATORS.length} types de calculs · {CARDS.length} flashcards · {FICHES.length} fiches
      </p>
    </div>
  )
}
