import { useState } from 'react'
import { fmtDate, plural, Ring, TopicTag } from '../components/ui'
import { recentPacks } from '../content'
import { currentStep, daysUntil, dueCards, errorQuestions, nextNote, readiness, streakDays, studyPlan, topicStats, weakTags } from '../lib/plan'
import { go, href } from '../lib/router'
import { today, updateSettings, useProgress, useSettings } from '../lib/store'
import { TOPIC, TOPICS, midWeight } from '../topics'

function Onboarding() {
  const s = useSettings()
  const [date, setDate] = useState(s.examDate)
  const [goal, setGoal] = useState(s.dailyGoal)
  return (
    <section className="card onboard stack tight">
      <h2>Set up your plan</h2>
      <p className="muted">Your exam date drives the study plan and the countdown. You can change both later in Settings.</p>
      <div className="row wrap" style={{ alignItems: 'flex-end' }}>
        <div className="field">
          <label htmlFor="ob-date">Exam date</label>
          <input id="ob-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="field" style={{ maxWidth: 160 }}>
          <label htmlFor="ob-goal">Items per day</label>
          <input id="ob-goal" type="number" min={5} max={300} value={goal} onChange={(e) => setGoal(+e.target.value || 30)} />
        </div>
        <button className="btn primary" onClick={() => updateSettings({ examDate: date || s.examDate, dailyGoal: Math.max(5, goal), onboarded: true })}>
          Save plan
        </button>
      </div>
      <p className="hint">CAIA Level I windows run in March and September. 200 questions, 4 hours.</p>
    </section>
  )
}

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
  const weak = weakTags(p, 4)
  const fresh = recentPacks().filter((pk) => !pk.id.endsWith('-base'))
  const focusTopic = step && step.topic !== 'review' ? step.topic : null
  const continueNote = focusTopic ? nextNote(p, focusTopic) : null
  const totalW = TOPICS.reduce((a, t) => a + midWeight(t.id), 0)

  return (
    <div className="stack">
      {!s.onboarded && <Onboarding />}

      <section className="hero">
        <div>
          <p className="hero-date">{fmtDate(new Date(), { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          {days > 0 ? (
            <div className="countdown">
              <b>{days}</b>
              <span>{days === 1 ? 'day' : 'days'} until your Level I exam</span>
            </div>
          ) : (
            <h1>Exam date passed — set your next one in Settings</h1>
          )}
          {step && (
            <p className="hero-focus">
              {step.topic === 'review' ? (
                <>Final stretch: mixed review and mock exams</>
              ) : (
                <>
                  Current focus: <a href={href(`/topic/${step.topic}`)}>{TOPIC[step.topic].name}</a>, until {fmtDate(step.end)}
                </>
              )}
            </p>
          )}
        </div>
        <div className="goal">
          <Ring value={doneToday / s.dailyGoal} label={`${doneToday} of ${s.dailyGoal} items today`} />
          <div className="goal-text">
            <b>
              {doneToday} of {s.dailyGoal} today
            </b>
            <span>{streak > 0 ? `${plural(streak, 'day')} in a row` : 'Start a streak today'}</span>
            <span>Readiness {ready}%</span>
          </div>
        </div>
      </section>

      <section className="card session">
        <div>
          <h2>Today’s session</h2>
          <p className="muted">About 25 minutes, built from what is due, your mistakes and your weakest topics.</p>
          <ol className="steps-inline">
            <li>
              <b>1</b> {plural(sessionCards, 'flashcard')}
            </li>
            <li>
              <b>2</b> 10 questions{errors.length ? `, ${Math.min(errors.length, 4)} to retry` : ''}
            </li>
            <li>
              <b>3</b> 2 calculations
            </li>
          </ol>
        </div>
        <button className="btn big" onClick={() => go('/session')}>
          Start session
        </button>
      </section>

      <section className="card">
        <div className="section-title">
          <h2>Your exam, by weight</h2>
          <p>Width = share of the exam. Fill = questions answered correctly.</p>
        </div>
        <div className="alloc">
          {TOPICS.map((t) => {
            const st = topicStats(p, t.id)
            const mastery = st.total ? (st.seen / st.total) * (st.accuracy ?? 0) : 0
            return (
              <a
                key={t.id}
                href={href(`/topic/${t.id}`)}
                style={{ ['--tc' as string]: t.color, ['--w' as string]: midWeight(t.id) / totalW, ['--m' as string]: `${Math.round(mastery * 100)}%` }}
                title={`${t.name}: ${t.weight[0]}–${t.weight[1]}% of the exam, ${Math.round(mastery * 100)}% mastered`}
                aria-label={`${t.name}, ${t.weight[0]} to ${t.weight[1]} percent of the exam, ${Math.round(mastery * 100)} percent mastered`}
              >
                <span>{t.code}</span>
              </a>
            )
          })}
        </div>
        <div className="alloc-legend">
          {TOPICS.map((t) => {
            const st = topicStats(p, t.id)
            return (
              <a key={t.id} href={href(`/topic/${t.id}`)}>
                <TopicTag id={t.id} long />
                <em>{st.accuracy === null ? `${t.weight[0]}–${t.weight[1]}%` : `${Math.round(st.accuracy * 100)}% right`}</em>
              </a>
            )
          })}
        </div>
      </section>

      <div className="grid-2">
        <section className="card">
          <div className="section-title">
            <h2>Weak spots</h2>
            <a className="link small" href={href('/progress')}>
              All subtopics
            </a>
          </div>
          {weak.length ? (
            <ul className="weak-list">
              {weak.map((w) => (
                <li key={w.topic + w.tag}>
                  <a href={href(`/quiz?topic=${w.topic}&tag=${encodeURIComponent(w.tag)}&n=10`)}>
                    <span className="t">{w.tag}</span>
                    <TopicTag id={w.topic} />
                    <span className="acc">{Math.round((w.accuracy ?? 0) * 100)}%</span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">Subtopics where you score under 70% will show up here once you have answered a few questions.</p>
          )}
        </section>

        <section className="card stack tight">
          <h2>Keep going</h2>
          {continueNote && (
            <a className="action" href={href(`/note/${continueNote.id}`)} style={{ ['--tc' as string]: TOPIC[continueNote.topic].color }}>
              <b>{continueNote.title}</b>
              <span>
                {p.read[continueNote.id] ? 'Read again' : 'Next note'}, {continueNote.minutes} min
              </span>
            </a>
          )}
          <a className="action" href={href('/flashcards')}>
            <b>{cards.due.length ? `${plural(cards.due.length, 'flashcard')} due` : 'Flashcards'}</b>
            <span>{cards.due.length ? 'Review them before they slip' : 'Nothing due — learn new cards'}</span>
          </a>
          <a className="action" href={href(errors.length ? '/quiz?mode=errors' : '/exam')}>
            <b>{errors.length ? `${plural(errors.length, 'question')} to retry` : 'Take a mock exam'}</b>
            <span>{errors.length ? 'From your mistakes' : '25, 50 or 100 questions at exam pace'}</span>
          </a>
        </section>
      </div>

      {fresh.length > 0 && (
        <section className="card">
          <h2 style={{ marginBottom: 10 }}>New this week</h2>
          <ul className="plain">
            {fresh.map((pk) => (
              <li key={pk.id} className="row">
                <span className="pill new">New</span>
                {pk.title}
                <span className="muted small">added {fmtDate(pk.added)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
