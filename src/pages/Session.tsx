import { useMemo, useState } from 'react'
import { CalcBox } from '../components/CalcBox'
import { Deck } from '../components/Deck'
import { Practice } from '../components/Quiz'
import { PageHead } from '../components/ui'
import { QUESTIONS } from '../content'
import { GENERATORS } from '../lib/calc'
import { currentStep, dueCards, errorQuestions, pickQuestions, studyPlan, topicStats } from '../lib/plan'
import { go } from '../lib/router'
import { getProgress, getSettings } from '../lib/store'
import { TOPICS } from '../topics'
import type { Question, TopicId } from '../types'

const STEPS = ['Flashcards', 'Questions', 'Calculations'] as const

/** Builds the session: mistakes to retry, the current focus topic, and weak topics (< 70%). */
function buildSession() {
  const p = getProgress()
  const plan = studyPlan(getSettings().examDate)
  const step = plan.length ? currentStep(plan) : null
  const focus: TopicId | null = step && step.topic !== 'review' ? step.topic : null
  const weak = TOPICS.map((t) => ({ t: t.id, s: topicStats(p, t.id) }))
    .filter((x) => x.s.accuracy !== null && x.s.accuracy < 0.7)
    .map((x) => x.t)

  const qs: Question[] = []
  const add = (list: Question[]) => list.forEach((q) => !qs.includes(q) && qs.length < 10 && qs.push(q))
  add(errorQuestions(p).slice(0, 4))
  if (focus) add(pickQuestions(p, 4, focus))
  weak.forEach((t) => add(pickQuestions(p, 2, t)))
  add(pickQuestions(p, 10, 'all', QUESTIONS))

  const cards = dueCards(p, 'all', 8).all.slice(0, 15)
  const genPool = GENERATORS.filter((g) => !focus || g.topic === focus || weak.includes(g.topic))
  const pool = genPool.length >= 2 ? genPool : GENERATORS
  const gens = [...pool].sort(() => Math.random() - 0.5).slice(0, 2)
  return { qs, cards, gens }
}

export default function Session() {
  const session = useMemo(buildSession, [])
  const [step, setStep] = useState(session.cards.length ? 0 : 1)
  const [calcIdx, setCalcIdx] = useState(0)

  return (
    <div className="stack narrow">
      <PageHead back={{ to: '/', label: 'Today' }} title={step < 3 ? `Today’s session: ${STEPS[step].toLowerCase()}` : 'Session complete'} />
      <ol className="stepper" aria-label="Session steps">
        {STEPS.map((s, i) => (
          <li key={s} className={i < step ? 'done' : i === step ? 'cur' : ''} aria-current={i === step ? 'step' : undefined}>
            {i + 1}. {s}
          </li>
        ))}
      </ol>
      {step === 0 && <Deck cards={session.cards} onDone={() => setStep(1)} />}
      {step === 1 && <Practice questions={session.qs} onDone={() => setStep(2)} title="Today’s questions" />}
      {step === 2 && (
        <CalcBox
          key={calcIdx}
          gen={session.gens[calcIdx]}
          nextLabel={calcIdx + 1 < session.gens.length ? 'Next calculation' : 'Finish session'}
          onNext={() => (calcIdx + 1 < session.gens.length ? setCalcIdx(calcIdx + 1) : setStep(3))}
        />
      )}
      {step === 3 && (
        <div className="card result">
          <h2>Done for today</h2>
          <p>Your answers are saved and your reviews are scheduled. Keep going with a mock exam, or read a note.</p>
          <div className="row wrap">
            <button className="btn primary" onClick={() => go('/')}>
              Back to today
            </button>
            <button className="btn" onClick={() => go('/exam')}>
              Take a mock exam
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
