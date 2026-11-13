import { useMemo, useState } from 'react'
import { CalcBox } from '../components/CalcBox'
import { Tex } from '../components/Rich'
import { Empty, PageHead, TopicPicker, TopicTag } from '../components/ui'
import { GEN_BY_ID, GENERATORS } from '../lib/calc'
import { go, href } from '../lib/router'
import { useProgress } from '../lib/store'
import { isTopic, TOPICS } from '../topics'
import type { TopicId } from '../types'

export default function Calculs({ genId, topic }: { genId?: string; topic?: string }) {
  const p = useProgress()
  const [t, setT] = useState<TopicId | 'all'>(topic && isTopic(topic) ? topic : 'all')
  const [mixKey, setMixKey] = useState(0)

  const mixGen = useMemo(() => {
    const pool = GENERATORS.filter((g) => t === 'all' || g.topic === t)
    return pool[Math.floor(Math.random() * pool.length)]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, mixKey])

  if (genId === 'mix') {
    const g = mixGen
    return (
      <div className="stack narrow">
        <a href={href('/calculs')} className="back">
          ← Calculs
        </a>
        <PageHead kicker="Calculs" title="Série mélangée" />
        {g ? <CalcBox key={mixKey} gen={g} onNext={() => setMixKey((k) => k + 1)} /> : <Empty>Aucun générateur.</Empty>}
      </div>
    )
  }

  if (genId) {
    const g = GEN_BY_ID.get(genId)
    if (!g) return <Empty>Exercice introuvable.</Empty>
    return (
      <div className="stack narrow">
        <a href={href('/calculs')} className="back">
          ← Calculs
        </a>
        <PageHead kicker={g.fr} title={g.title} />
        <CalcBox gen={g} />
        <p className="muted small">
          Saisie : pourcentages en % (ex. <code>7.25</code>), montants sans séparateur ou avec virgules (ex. <code>1,250,000</code>). Une petite marge d’arrondi est acceptée.
        </p>
      </div>
    )
  }

  const list = GENERATORS.filter((g) => t === 'all' || g.topic === t)
  const counts = Object.fromEntries([['all', GENERATORS.length], ...TOPICS.map((tp) => [tp.id, GENERATORS.filter((g) => g.topic === tp.id).length])])
  return (
    <div className="stack">
      <PageHead kicker="Pratiquer" title="Calculs">
        Environ 30 % des questions demandent un calcul. Chaque exercice est généré avec de nouveaux chiffres, à l’infini, avec une correction pas à pas.
      </PageHead>
      <TopicPicker value={t} onChange={setT} counts={counts} />
      <button className="btn primary big" onClick={() => go('/calculs/mix')}>
        Série mélangée {t === 'all' ? '' : 'sur ce topic'} →
      </button>
      <div className="formula-grid">
        {list.map((g) => {
          const s = p.calc[g.id]
          return (
            <a key={g.id} href={href(`/calculs/${g.id}`)} className="card formula-card link-card">
              <div className="row between">
                <h3 lang="en">
                  <TopicTag id={g.topic} /> {g.title}
                </h3>
                <span className="muted small">{s ? `${s.ok}/${s.seen}` : 'nouveau'}</span>
              </div>
              <p className="muted small">{g.fr}</p>
              <Tex tex={g.tex} block />
            </a>
          )
        })}
      </div>
    </div>
  )
}
