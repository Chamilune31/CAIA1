import { useMemo, useState } from 'react'
import { CalcBox } from '../components/CalcBox'
import { Tex } from '../components/Rich'
import { Empty, PageHead, TopicPicker, TopicTag } from '../components/ui'
import { GEN_BY_ID, GENERATORS } from '../lib/calc'
import { go, href } from '../lib/router'
import { useProgress } from '../lib/store'
import { isTopic, TOPICS } from '../topics'
import type { TopicId } from '../types'

const INPUT_HELP = (
  <p className="muted small">
    Type percentages as numbers in % (e.g. <code>7.25</code>) and amounts with or without commas (e.g. <code>1,250,000</code>). Small rounding differences are accepted.
  </p>
)

export default function Calc({ genId, topic }: { genId?: string; topic?: string }) {
  const p = useProgress()
  const [t, setT] = useState<TopicId | 'all'>(topic && isTopic(topic) ? topic : 'all')
  const [mixKey, setMixKey] = useState(0)

  const mixGen = useMemo(() => {
    const pool = GENERATORS.filter((g) => t === 'all' || g.topic === t)
    return pool[Math.floor(Math.random() * pool.length)]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, mixKey])

  if (genId === 'mix')
    return (
      <div className="stack narrow">
        <PageHead back={{ to: '/calc', label: 'Calculations' }} title={t === 'all' ? 'Mixed drill' : `Mixed drill: ${TOPICS.find((x) => x.id === t)?.short}`} />
        {mixGen ? <CalcBox key={mixKey} gen={mixGen} nextLabel="Next calculation" onNext={() => setMixKey((k) => k + 1)} /> : <Empty>No drills for this topic.</Empty>}
        {INPUT_HELP}
      </div>
    )

  if (genId) {
    const g = GEN_BY_ID.get(genId)
    if (!g) return <Empty>This drill does not exist.</Empty>
    return (
      <div className="stack narrow">
        <PageHead back={{ to: '/calc', label: 'Calculations' }} title={g.title}>
          {g.subtitle}
        </PageHead>
        <CalcBox gen={g} />
        {INPUT_HELP}
      </div>
    )
  }

  const list = GENERATORS.filter((g) => t === 'all' || g.topic === t)
  const counts = Object.fromEntries([['all', GENERATORS.length], ...TOPICS.map((tp) => [tp.id, GENERATORS.filter((g) => g.topic === tp.id).length])])
  return (
    <div className="stack">
      <PageHead title="Calculation drills">Up to 30% of exam questions involve a calculation. Every drill generates new numbers and shows a worked solution.</PageHead>
      <TopicPicker value={t} onChange={setT} counts={counts} />
      <div>
        <button className="btn primary big" onClick={() => go('/calc/mix')}>
          Start a mixed drill
        </button>
      </div>
      <div className="formula-grid">
        {list.map((g) => {
          const s = p.calc[g.id]
          return (
            <a key={g.id} href={href(`/calc/${g.id}`)} className="card formula-card link-card">
              <div className="row between">
                <h3>{g.title}</h3>
                <span className={`small ${s && s.ok / s.seen < 0.7 ? 'bad-text' : 'muted'}`}>{s ? `${s.ok}/${s.seen} right` : 'Not tried'}</span>
              </div>
              <p className="muted small">
                <TopicTag id={g.topic} /> {g.subtitle}
              </p>
              <Tex tex={g.tex} block />
            </a>
          )
        })}
      </div>
    </div>
  )
}
