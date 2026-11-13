import type { ReactNode } from 'react'
import { TOPIC, TOPICS } from '../topics'
import type { TopicId } from '../types'

export function TopicTag({ id, long = false }: { id: TopicId; long?: boolean }) {
  const t = TOPIC[id]
  return (
    <span className="ttag" style={{ ['--tc' as string]: t.color }}>
      {long ? t.fr : t.code}
    </span>
  )
}

export function Bar({ value, color, label }: { value: number; color?: string; label?: string }) {
  const v = Math.max(0, Math.min(1, value))
  return (
    <div className="bar" role="progressbar" aria-valuenow={Math.round(v * 100)} aria-label={label}>
      <span style={{ width: `${v * 100}%`, background: color }} />
    </div>
  )
}

export function TopicPicker({
  value,
  onChange,
  counts,
  allLabel = 'Tous',
}: {
  value: TopicId | 'all'
  onChange: (t: TopicId | 'all') => void
  counts?: Partial<Record<TopicId | 'all', number>>
  allLabel?: string
}) {
  return (
    <div className="chips" role="tablist">
      <button className={`chip ${value === 'all' ? 'on' : ''}`} onClick={() => onChange('all')}>
        {allLabel}
        {counts?.all !== undefined && <small>{counts.all}</small>}
      </button>
      {TOPICS.map((t) => (
        <button
          key={t.id}
          className={`chip ${value === t.id ? 'on' : ''}`}
          style={{ ['--tc' as string]: t.color }}
          onClick={() => onChange(t.id)}
          title={t.name}
        >
          <i className="dot" />
          {t.code}
          {counts?.[t.id] !== undefined && <small>{counts[t.id]}</small>}
        </button>
      ))}
    </div>
  )
}

export function PageHead({ kicker, title, children }: { kicker?: string; title: string; children?: ReactNode }) {
  return (
    <header className="page-head">
      {kicker && <p className="kicker">{kicker}</p>}
      <h1>{title}</h1>
      {children && <div className="lede">{children}</div>}
    </header>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>
}
