import { useEffect, useMemo, useRef, useState } from 'react'
import { nextNote } from '../lib/plan'
import { href } from '../lib/router'
import { getProgress, recordExam, recordQuestion } from '../lib/store'
import { TOPIC } from '../topics'
import type { ExamRecord, Question, TopicId } from '../types'
import { Rich } from './Rich'
import { Bar, Modal, TopicTag } from './ui'

const L = ['A', 'B', 'C', 'D', 'E']

const shuffleIdx = (n: number) => {
  const a = [...Array(n).keys()]
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function TopicScores({ byTopic }: { byTopic: Partial<Record<TopicId, [number, number]>> }) {
  return (
    <ul className="topic-results">
      {Object.entries(byTopic).map(([t, v]) => (
        <li key={t}>
          <TopicTag id={t as TopicId} long link />
          <b className={v![0] / v![1] >= 0.7 ? '' : 'bad-text'}>
            {v![0]}/{v![1]}
          </b>
        </li>
      ))}
    </ul>
  )
}

/* ================= Practice: instant feedback ================= */
export function Practice({ questions, onDone, title }: { questions: Question[]; onDone?: () => void; title?: string }) {
  const orders = useMemo(() => questions.map((q) => shuffleIdx(q.options.length)), [questions])
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [results, setResults] = useState<boolean[]>([])
  const q = questions[i]
  const done = i >= questions.length

  const choose = (opt: number) => {
    if (picked !== null || !q) return
    setPicked(opt)
    const ok = opt === q.answer
    recordQuestion(q.id, ok)
    setResults((r) => [...r, ok])
  }
  const next = () => {
    setPicked(null)
    setI((x) => x + 1)
    window.scrollTo({ top: 0 })
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (done || ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return
      const k = e.key.toUpperCase()
      const idx = ['1', '2', '3', '4'].includes(k) ? +k - 1 : L.indexOf(k)
      if (picked === null && idx >= 0 && idx < (q?.options.length ?? 0)) choose(orders[i][idx])
      else if (picked !== null && e.key === 'Enter') {
        e.preventDefault()
        next()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!questions.length) return <div className="empty">No questions match this selection yet.</div>

  if (done) {
    const ok = results.filter(Boolean).length
    const byTopic: Partial<Record<TopicId, [number, number]>> = {}
    questions.forEach((qq, k) => {
      const t = (byTopic[qq.topic] ??= [0, 0])
      t[1]++
      if (results[k]) t[0]++
    })
    return (
      <div className="card result">
        <h2>{title ?? 'Set complete'}</h2>
        <div className="big-score">
          {ok}
          <span> / {questions.length} correct</span>
        </div>
        <Bar value={ok / questions.length} color={ok / questions.length >= 0.7 ? 'var(--ok)' : 'var(--bad)'} label="Score" />
        <TopicScores byTopic={byTopic} />
        <p className="muted small">Missed questions come back in 10 minutes, then in your next sessions until you get them right.</p>
        {onDone && (
          <button className="btn primary" onClick={onDone}>
            Continue
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="quiz">
      <div className="quiz-top">
        <span>
          Question {i + 1} of {questions.length}
        </span>
        <Bar value={i / questions.length} label="Progress through the set" />
      </div>
      <QuestionCard q={q} order={orders[i]} picked={picked} reveal={picked !== null} onPick={choose} />
      {picked === null ? (
        <p className="kbd">
          Answer with <kbd>A</kbd>–<kbd>D</kbd> or <kbd>1</kbd>–<kbd>4</kbd>
        </p>
      ) : (
        <div className="quiz-actions sticky">
          <button className="btn primary big" onClick={next} autoFocus>
            {i + 1 < questions.length ? 'Next question' : 'See results'}
          </button>
          <span className="kbd">
            <kbd>Enter</kbd>
          </span>
        </div>
      )}
    </div>
  )
}

export function QuestionCard({
  q,
  order,
  picked,
  reveal,
  onPick,
}: {
  q: Question
  order: number[]
  picked: number | null
  reveal: boolean
  onPick: (opt: number) => void
}) {
  const note = reveal && picked !== q.answer ? nextNote(getProgress(), q.topic) : null
  return (
    <article className="card qcard" style={{ ['--tc' as string]: TOPIC[q.topic].color }}>
      <div className="qmeta">
        <TopicTag id={q.topic} long />
        <span>{q.tag}</span>
        {q.calc && <span className="pill">Calculation</span>}
        <span className="lvl" title={`Difficulty ${q.level} of 3`} aria-label={`Difficulty ${q.level} of 3`}>
          {[1, 2, 3].map((n) => (
            <i key={n} className={n <= q.level ? 'on' : ''} />
          ))}
        </span>
      </div>
      <p className="qtext">
        <Rich text={q.q} />
      </p>
      <ol className="options">
        {order.map((o, k) => {
          const cls = reveal ? (o === q.answer ? 'right' : o === picked ? 'wrong' : 'dim') : picked === o ? 'sel' : ''
          return (
            <li key={o}>
              <button className={`opt ${cls}`} onClick={() => onPick(o)} disabled={reveal} aria-pressed={picked === o}>
                <span className="letter">{L[k]}</span>
                <span>
                  <Rich text={q.options[o]} />
                </span>
              </button>
            </li>
          )
        })}
      </ol>
      {reveal && (
        <div className={`explain ${picked === q.answer ? 'ok' : picked === null ? '' : 'ko'}`} role="status">
          <b>{picked === null ? 'Not answered' : picked === q.answer ? 'Correct' : `Not quite — the answer is ${L[order.indexOf(q.answer)]}`}</b>
          <p>
            <Rich text={q.explain} />
          </p>
          {note && (
            <a className="link" href={href(`/note/${note.id}`)}>
              Review: {note.title}
            </a>
          )}
        </div>
      )}
    </article>
  )
}

/* ================= Mock exam: timed, marked at the end ================= */
const fmtTime = (s: number) => {
  const h = Math.floor(Math.max(0, s) / 3600)
  const m = Math.floor((Math.max(0, s) % 3600) / 60)
  const ss = Math.floor(Math.max(0, s) % 60)
  return `${h ? h + ':' + String(m).padStart(2, '0') : m}:${String(ss).padStart(2, '0')}`
}

export function Exam({ questions, limit, onExit }: { questions: Question[]; limit: number; onExit: () => void }) {
  const orders = useMemo(() => questions.map((q) => shuffleIdx(q.options.length)), [questions])
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null))
  const [flags, setFlags] = useState<boolean[]>(() => questions.map(() => false))
  const [i, setI] = useState(0)
  const [left, setLeft] = useState(limit)
  const [finished, setFinished] = useState<ExamRecord | null>(null)
  const [confirm, setConfirm] = useState(false)
  const [filter, setFilter] = useState<'wrong' | 'flagged' | 'all'>('wrong')
  const startRef = useRef(Date.now())

  useEffect(() => {
    if (finished) return
    const id = setInterval(() => setLeft(limit - (Date.now() - startRef.current) / 1000), 500)
    return () => clearInterval(id)
  }, [finished, limit])

  const submit = () => {
    setConfirm(false)
    const byTopic: Partial<Record<TopicId, [number, number]>> = {}
    let correct = 0
    questions.forEach((q, k) => {
      const ok = answers[k] === q.answer
      if (ok) correct++
      const t = (byTopic[q.topic] ??= [0, 0])
      t[1]++
      if (ok) t[0]++
      if (answers[k] !== null) recordQuestion(q.id, ok)
    })
    const rec: ExamRecord = {
      id: `ex-${startRef.current}`,
      date: startRef.current,
      total: questions.length,
      correct,
      seconds: Math.round((Date.now() - startRef.current) / 1000),
      limit,
      byTopic,
    }
    recordExam(rec)
    setFinished(rec)
    window.scrollTo({ top: 0 })
  }

  useEffect(() => {
    if (!finished && left <= 0) submit()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left, finished])

  if (finished) {
    const score = finished.correct / finished.total
    const shown = questions
      .map((q, k) => ({ q, k }))
      .filter(({ q, k }) => filter === 'all' || (filter === 'wrong' ? answers[k] !== q.answer : flags[k]))
    return (
      <div className="stack">
        <div className="card result">
          <h2>Mock exam complete</h2>
          <div className="big-score">
            {Math.round(score * 100)}
            <span>%</span>
          </div>
          <p className="muted">
            {finished.correct} of {finished.total} correct in {fmtTime(finished.seconds)} (time allowed {fmtTime(limit)})
          </p>
          <Bar value={score} color={score >= 0.7 ? 'var(--ok)' : 'var(--bad)'} label="Score" />
          <p className="small muted">CAIA does not publish a pass mark. Aim for 70% or more in practice to give yourself a margin.</p>
          <TopicScores byTopic={finished.byTopic} />
          <button className="btn" onClick={onExit}>
            Back to mock exams
          </button>
        </div>
        <div className="row between wrap">
          <h2>Review</h2>
          <div className="seg" role="group" aria-label="Filter the review">
            <button className={filter === 'wrong' ? 'on' : ''} onClick={() => setFilter('wrong')}>
              Mistakes
            </button>
            <button className={filter === 'flagged' ? 'on' : ''} onClick={() => setFilter('flagged')}>
              Flagged
            </button>
            <button className={filter === 'all' ? 'on' : ''} onClick={() => setFilter('all')}>
              All
            </button>
          </div>
        </div>
        {shown.map(({ q, k }) => (
          <div key={q.id} className="stack tight">
            <p className="muted small">Question {k + 1}</p>
            <QuestionCard q={q} order={orders[k]} picked={answers[k]} reveal onPick={() => {}} />
          </div>
        ))}
        {!shown.length && <div className="empty">{filter === 'wrong' ? 'No mistakes. Well done.' : 'Nothing to show for this filter.'}</div>}
      </div>
    )
  }

  const q = questions[i]
  const answered = answers.filter((a) => a !== null).length
  const blank = questions.length - answered
  return (
    <div className="quiz exam">
      <div className="exam-bar">
        <span className={`timer ${left < 300 ? 'late' : ''}`} aria-label="Time left">
          {fmtTime(left)}
        </span>
        <span className="muted small">
          {answered} of {questions.length} answered
        </span>
        <button className="btn small" onClick={() => (blank ? setConfirm(true) : submit())}>
          Finish
        </button>
      </div>
      <QuestionCard q={q} order={orders[i]} picked={answers[i]} reveal={false} onPick={(o) => setAnswers((a) => a.map((x, k) => (k === i ? o : x)))} />
      <div className="row between">
        <button className="btn" disabled={i === 0} onClick={() => setI(i - 1)}>
          Previous
        </button>
        <button className={`btn ${flags[i] ? 'flagged' : ''}`} aria-pressed={flags[i]} onClick={() => setFlags((f) => f.map((x, k) => (k === i ? !x : x)))}>
          {flags[i] ? 'Flagged' : 'Flag for review'}
        </button>
        <button className="btn primary" disabled={i === questions.length - 1} onClick={() => setI(i + 1)}>
          Next
        </button>
      </div>
      <div className="grid-nav" aria-label="Jump to question">
        {questions.map((_, k) => (
          <button
            key={k}
            className={`${k === i ? 'cur' : ''} ${answers[k] !== null ? 'done' : ''} ${flags[k] ? 'flag' : ''}`}
            onClick={() => setI(k)}
            aria-label={`Question ${k + 1}${answers[k] !== null ? ', answered' : ''}${flags[k] ? ', flagged' : ''}`}
          >
            {k + 1}
          </button>
        ))}
      </div>
      {confirm && (
        <Modal label="Finish the exam?" onClose={() => setConfirm(false)}>
          <h2>Finish the exam?</h2>
          <p>
            {blank} question{blank > 1 ? 's are' : ' is'} still unanswered. Unanswered questions count as wrong.
          </p>
          <div className="row">
            <button className="btn primary" onClick={submit}>
              Finish and mark
            </button>
            <button className="btn" onClick={() => setConfirm(false)} autoFocus>
              Keep going
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
