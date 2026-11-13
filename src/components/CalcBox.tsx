import { useMemo, useState } from 'react'
import { checkAnswer, f, Rng, type Generator } from '../lib/calc'
import { recordCalc } from '../lib/store'
import { TOPIC } from '../topics'
import { Tex } from './Rich'
import { TopicTag } from './ui'

const unitLabel = { '%': 'in %', $: 'in $', x: 'as a multiple', '': 'number' } as const

export function CalcBox({ gen, onNext, nextLabel = 'New numbers' }: { gen: Generator; onNext?: () => void; nextLabel?: string }) {
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e9))
  const e = useMemo(() => gen.make(new Rng(seed)), [gen, seed])
  const [val, setVal] = useState('')
  const [res, setRes] = useState<boolean | null>(null)
  const [showFormula, setShowFormula] = useState(false)

  const submit = () => {
    if (res !== null) return
    const ok = checkAnswer(e, val)
    if (ok === null) return
    setRes(ok)
    recordCalc(gen.id, ok)
  }
  const next = () => {
    setVal('')
    setRes(null)
    setShowFormula(false)
    if (onNext) onNext()
    else setSeed(Math.floor(Math.random() * 1e9))
  }
  const giveUp = () => {
    setRes(false)
    recordCalc(gen.id, false)
  }
  const ans = `${e.unit === '$' ? '$' : ''}${f(e.answer, e.decimals)}${e.unit === '%' ? ' %' : e.unit === 'x' ? 'x' : ''}`

  return (
    <article className="card qcard calc" style={{ ['--tc' as string]: TOPIC[gen.topic].color }}>
      <div className="qmeta">
        <TopicTag id={gen.topic} long />
        <span>{gen.title}</span>
      </div>
      <p className="qtext">
        {e.prompt}
      </p>
      {!showFormula && res === null ? (
        <button className="link small" style={{ alignSelf: 'flex-start' }} onClick={() => setShowFormula(true)}>
          Show the formula
        </button>
      ) : (
        <Tex tex={gen.tex} block />
      )}
      <form
        className="calc-input"
        onSubmit={(ev) => {
          ev.preventDefault()
          if (res === null) submit()
          else next()
        }}
      >
        <input
          inputMode="decimal"
          value={val}
          onChange={(ev) => setVal(ev.target.value)}
          placeholder={`Your answer (${unitLabel[e.unit]})`}
          disabled={res !== null}
          autoFocus
          aria-label="Your answer"
        />
        {res === null ? (
          <>
            <button className="btn primary" type="submit" disabled={!val.trim()}>
              Check
            </button>
            <button className="btn ghost" type="button" onClick={giveUp}>
              Show answer
            </button>
          </>
        ) : (
          <button className="btn primary" type="submit" autoFocus>
            {nextLabel}
          </button>
        )}
      </form>
      {res !== null && (
        <div className={`explain ${res ? 'ok' : 'ko'}`} role="status">
          <b>{res ? 'Correct' : 'Answer'}: {ans}</b>
          <ol className="steps">
            {e.steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </div>
      )}
    </article>
  )
}
