import { useEffect, type ReactNode } from 'react'
import { href } from '../lib/router'
import { TOPIC, TOPICS } from '../topics'
import type { TopicId } from '../types'

export function TopicTag({ id, long = false, link = false }: { id: TopicId; long?: boolean; link?: boolean }) {
  const t = TOPIC[id]
  const style = { ['--tc' as string]: t.color }
  const label = long ? t.short : t.code
  return link ? (
    <a className="ttag" style={style} href={href(`/topic/${id}`)} title={t.name}>
      {label}
    </a>
  ) : (
    <span className="ttag" style={style} title={t.name}>
      {label}
    </span>
  )
}

export function Bar({ value, color, label }: { value: number; color?: string; label?: string }) {
  const v = Math.max(0, Math.min(1, value))
  return (
    <div className="bar" role="progressbar" aria-valuenow={Math.round(v * 100)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <span style={{ width: `${v * 100}%`, background: color }} />
    </div>
  )
}

/** Circular progress (daily goal). */
export function Ring({ value, label }: { value: number; label: string }) {
  const r = 38
  const c = 2 * Math.PI * r
  const v = Math.max(0, Math.min(1, value))
  return (
    <svg className="ring" viewBox="0 0 92 92" role="img" aria-label={label}>
      <circle className="track" cx="46" cy="46" r={r} />
      <circle className="fill" cx="46" cy="46" r={r} strokeDasharray={c} strokeDashoffset={c * (1 - v)} transform="rotate(-90 46 46)" />
      <text x="46" y="46">{Math.round(v * 100)}%</text>
    </svg>
  )
}

export function TopicPicker({
  value,
  onChange,
  counts,
  allLabel = 'All topics',
}: {
  value: TopicId | 'all'
  onChange: (t: TopicId | 'all') => void
  counts?: Partial<Record<TopicId | 'all', number>>
  allLabel?: string
}) {
  return (
    <div className="chips" role="group" aria-label="Filter by topic">
      <button className={`chip ${value === 'all' ? 'on' : ''}`} aria-pressed={value === 'all'} onClick={() => onChange('all')}>
        {allLabel}
        {counts?.all !== undefined && <small>{counts.all}</small>}
      </button>
      {TOPICS.map((t) => (
        <button
          key={t.id}
          className={`chip ${value === t.id ? 'on' : ''}`}
          style={{ ['--tc' as string]: t.color }}
          aria-pressed={value === t.id}
          onClick={() => onChange(t.id)}
          title={t.name}
        >
          <i className="dot" />
          {t.short}
          {counts?.[t.id] !== undefined && <small>{counts[t.id]}</small>}
        </button>
      ))}
    </div>
  )
}

export function PageHead({ back, title, children }: { back?: { to: string; label: string }; title: string; children?: ReactNode }) {
  return (
    <header className="page-head">
      {back && (
        <a className="crumb" href={href(back.to)}>
          ← {back.label}
        </a>
      )}
      <h1>{title}</h1>
      {children && <div className="lede">{children}</div>}
    </header>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>
}

export function Modal({ children, onClose, label }: { children: ReactNode; onClose: () => void; label: string }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={label} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

export const plural = (n: number, one: string, many = one + 's') => `${n} ${n === 1 ? one : many}`
export const fmtDate = (d: Date | number | string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }) =>
  new Date(d).toLocaleDateString('en-GB', opts)
