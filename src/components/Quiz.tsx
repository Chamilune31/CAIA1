import { useEffect, useMemo, useRef, useState } from 'react'
import { recordExam, recordQuestion } from '../lib/store'
import { TOPIC } from '../topics'
import type { ExamRecord, Question, TopicId } from '../types'
import { Rich } from './Rich'
import { Bar, TopicTag } from './ui'

const L = ['A', 'B', 'C', 'D', 'E']

const shuffleIdx = (n: number) => {
  const a = [...Array(n).keys()]
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/* ================= Mode entraînement : correction immédiate ================= */
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
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (done || (e.target as HTMLElement)?.tagName === 'INPUT') return
      const k = e.key.toUpperCase()
      const idx = ['1', '2', '3', '4'].indexOf(k) >= 0 ? +k - 1 : L.indexOf(k)
      if (picked === null && idx >= 0 && idx < (q?.options.length ?? 0)) choose(orders[i][idx])
      else if (picked !== null && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault()
        next()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!questions.length) return <div className="empty">Aucune question disponible pour ce choix.</div>

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
        <p className="kicker">{title ?? 'Série terminée'}</p>
        <div className="big-score">
          {ok}
          <span>/ {questions.length}</span>
        </div>
        <Bar value={ok / questions.length} color={ok / questions.length >= 0.7 ? 'var(--ok)' : 'var(--bad)'} />
        <ul className="topic-results">
          {Object.entries(byTopic).map(([t, [a, b]]) => (
            <li key={t}>
              <TopicTag id={t as TopicId} /> {TOPIC[t as TopicId].fr} <b>{a}/{b}</b>
            </li>
          ))}
        </ul>
        <p className="muted small">Les questions ratées reviennent automatiquement dans 10 minutes, puis dans tes séances suivantes.</p>
        {onDone && (
          <button className="btn primary" onClick={onDone}>
            Continuer
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="quiz">
      <div className="quiz-top">
        <span className="muted">
          Question {i + 1} / {questions.length}
        </span>
        <Bar value={i / questions.length} />
      </div>
      <QuestionCard q={q} order={orders[i]} picked={picked} reveal={picked !== null} onPick={choose} />
      {picked !== null && (
        <div className="quiz-actions">
          <button className="btn primary" onClick={next} autoFocus>
            {i + 1 < questions.length ? 'Question suivante →' : 'Voir le résultat'}
          </button>
          <span className="muted small kbd-hint">Entrée</span>
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
  return (
    <article className="card qcard" style={{ ['--tc' as string]: TOPIC[q.topic].color }}>
      <div className="qmeta">
        <TopicTag id={q.topic} />
        <span className="muted small">{q.tag}</span>
        {q.calc && <span className="pill">calcul</span>}
        <span className="lvl" title="Difficulté">
          {'●'.repeat(q.level)}
          {'○'.repeat(3 - q.level)}
        </span>
      </div>
      <p className="qtext" lang="en">
        <Rich text={q.q} />
      </p>
      <ol className="options" lang="en">
        {order.map((o, k) => {
          const cls = reveal ? (o === q.answer ? 'right' : o === picked ? 'wrong' : 'dim') : picked === o ? 'sel' : ''
          return (
            <li key={o}>
              <button className={`opt ${cls}`} onClick={() => onPick(o)} disabled={reveal}>
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
        <div className={`explain ${picked === q.answer ? 'ok' : picked === null ? '' : 'ko'}`}>
          <b>{picked === null ? 'Non répondu' : picked === q.answer ? 'Bonne réponse' : 'Raté'}</b>
          <p>
            <Rich text={q.explain} />
          </p>
        </div>
      )}
    </article>
  )
}

/* ================= Mode examen : chronométré, correction à la fin ================= */
const fmtTime = (s: number) => {
  const m = Math.floor(Math.max(0, s) / 60)
  const ss = Math.floor(Math.max(0, s) % 60)
  return `${m}:${String(ss).padStart(2, '0')}`
}

export function Exam({ questions, limit, onExit }: { questions: Question[]; limit: number; onExit: () => void }) {
  const orders = useMemo(() => questions.map((q) => shuffleIdx(q.options.length)), [questions])
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null))
  const [flags, setFlags] = useState<boolean[]>(() => questions.map(() => false))
  const [i, setI] = useState(0)
  const [left, setLeft] = useState(limit)
  const [finished, setFinished] = useState<ExamRecord | null>(null)
  const [reviewFilter, setReviewFilter] = useState<'all' | 'wrong'>('wrong')
  const startRef = useRef(Date.now())

  useEffect(() => {
    if (finished) return
    const id = setInterval(() => setLeft(limit - (Date.now() - startRef.current) / 1000), 500)
    return () => clearInterval(id)
  }, [finished, limit])

  const submit = () => {
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
    const pctScore = finished.correct / finished.total
    const shown = questions.map((q, k) => ({ q, k })).filter(({ q, k }) => reviewFilter === 'all' || answers[k] !== q.answer)
    return (
      <div className="stack">
        <div className="card result">
          <p className="kicker">Examen blanc terminé</p>
          <div className="big-score">
            {Math.round(pctScore * 100)}
            <span>%</span>
          </div>
          <p className="muted">
            {finished.correct} / {finished.total} bonnes réponses en {fmtTime(finished.seconds)} (limite {fmtTime(limit)})
          </p>
          <Bar value={pctScore} color={pctScore >= 0.7 ? 'var(--ok)' : 'var(--bad)'} />
          <p className="small muted">
            Repère : le CAIA ne publie pas de note de passage. Vise au moins 70 % en entraînement pour avoir de la marge.
          </p>
          <ul className="topic-results">
            {Object.entries(finished.byTopic).map(([t, v]) => (
              <li key={t}>
                <TopicTag id={t as TopicId} /> {TOPIC[t as TopicId].fr}{' '}
                <b>
                  {v![0]}/{v![1]}
                </b>
              </li>
            ))}
          </ul>
          <button className="btn" onClick={onExit}>
            Retour
          </button>
        </div>
        <div className="row between">
          <h2>Correction</h2>
          <div className="seg">
            <button className={reviewFilter === 'wrong' ? 'on' : ''} onClick={() => setReviewFilter('wrong')}>
              Erreurs
            </button>
            <button className={reviewFilter === 'all' ? 'on' : ''} onClick={() => setReviewFilter('all')}>
              Tout
            </button>
          </div>
        </div>
        {shown.map(({ q, k }) => (
          <div key={q.id}>
            <p className="muted small">Question {k + 1}</p>
            <QuestionCard q={q} order={orders[k]} picked={answers[k]} reveal onPick={() => {}} />
          </div>
        ))}
        {!shown.length && <div className="empty">Aucune erreur. Impressionnant.</div>}
      </div>
    )
  }

  const q = questions[i]
  const answered = answers.filter((a) => a !== null).length
  return (
    <div className="quiz exam">
      <div className="exam-bar">
        <span className={`timer ${left < 300 ? 'late' : ''}`}>{fmtTime(left)}</span>
        <span className="muted small">
          {answered}/{questions.length} répondues
        </span>
        <button className="btn small" onClick={() => confirmSubmit(answers, submit)}>
          Terminer
        </button>
      </div>
      <QuestionCard
        q={q}
        order={orders[i]}
        picked={answers[i]}
        reveal={false}
        onPick={(o) => setAnswers((a) => a.map((x, k) => (k === i ? o : x)))}
      />
      <div className="row between">
        <button className="btn" disabled={i === 0} onClick={() => setI(i - 1)}>
          ← Précédente
        </button>
        <button className={`btn ${flags[i] ? 'flagged' : ''}`} onClick={() => setFlags((f) => f.map((x, k) => (k === i ? !x : x)))}>
          {flags[i] ? '⚑ Marquée' : '⚐ Marquer'}
        </button>
        <button className="btn primary" disabled={i === questions.length - 1} onClick={() => setI(i + 1)}>
          Suivante →
        </button>
      </div>
      <div className="grid-nav">
        {questions.map((_, k) => (
          <button
            key={k}
            className={`${k === i ? 'cur' : ''} ${answers[k] !== null ? 'done' : ''} ${flags[k] ? 'flag' : ''}`}
            onClick={() => setI(k)}
          >
            {k + 1}
          </button>
        ))}
      </div>
    </div>
  )
}

function confirmSubmit(answers: (number | null)[], submit: () => void) {
  const blank = answers.filter((a) => a === null).length
  // Pas de window.confirm bloquant : un second clic confirme.
  const btn = document.activeElement as HTMLButtonElement | null
  if (blank && btn && btn.dataset.armed !== '1') {
    btn.dataset.armed = '1'
    btn.textContent = `${blank} sans réponse — confirmer ?`
    setTimeout(() => {
      if (btn) {
        btn.dataset.armed = ''
        btn.textContent = 'Terminer'
      }
    }, 4000)
    return
  }
  submit()
}
