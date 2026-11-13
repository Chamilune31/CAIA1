import { useEffect, useMemo, useRef, useState } from 'react'
import { PageHead, TopicTag } from '../components/ui'
import { CARDS, FICHES, FORMULAS, LESSONS, QUESTIONS } from '../content'
import { GENERATORS } from '../lib/calc'
import { href } from '../lib/router'
import type { Block, TopicId } from '../types'

type Hit = { kind: string; title: string; snippet: string; to: string; topic: TopicId; score: number }

const blockText = (b: Block) =>
  'text' in b ? b.text : 'items' in b ? b.items.join(' ') : 'lines' in b ? b.lines.join(' ') : 'rows' in b ? [...b.head, ...b.rows.flat()].join(' ') : ''

const clean = (s: string) => s.replace(/\*\*|`|\$[^$]*\$/g, '').replace(/\s+/g, ' ').trim()

function snippetAround(text: string, terms: string[]) {
  const t = clean(text)
  const i = terms.map((w) => t.toLowerCase().indexOf(w)).filter((x) => x >= 0).sort((a, b) => a - b)[0] ?? 0
  const start = Math.max(0, i - 60)
  return (start ? '…' : '') + t.slice(start, start + 180) + (start + 180 < t.length ? '…' : '')
}

function Highlight({ text, terms }: { text: string; terms: string[] }) {
  if (!terms.length) return <>{text}</>
  const re = new RegExp(`(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi')
  return (
    <>
      {text.split(re).map((part, i) => (i % 2 === 1 ? <mark key={i}>{part}</mark> : <span key={i}>{part}</span>))}
    </>
  )
}

export default function Search({ q: initial }: { q?: string }) {
  const [q, setQ] = useState(initial ?? '')
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => {
    input.current?.focus()
  }, [])

  const terms = q.toLowerCase().split(/\s+/).filter((w) => w.length > 1)
  const hits = useMemo(() => {
    if (!terms.length) return []
    const out: Hit[] = []
    const score = (title: string, body: string) => {
      const T = title.toLowerCase()
      const B = body.toLowerCase()
      if (!terms.every((w) => T.includes(w) || B.includes(w))) return 0
      return terms.reduce((a, w) => a + (T.includes(w) ? 5 : 0) + (B.includes(w) ? 1 : 0), 0)
    }
    for (const f of FICHES) {
      const body = f.subtitle + '. ' + f.blocks.map(blockText).join(' ')
      const s = score(f.title, body)
      if (s) out.push({ kind: 'Note', title: f.title, snippet: snippetAround(body, terms), to: `/note/${f.id}`, topic: f.topic, score: s + 2 })
    }
    for (const c of CARDS) {
      const s = score(c.front, c.back)
      if (s) out.push({ kind: 'Glossary', title: c.front, snippet: clean(c.back), to: `/flashcards?topic=${c.topic}`, topic: c.topic, score: s + 1 })
    }
    for (const f of FORMULAS) {
      const s = score(f.name, `${f.vars ?? ''} ${f.note ?? ''}`)
      const gen = GENERATORS.find((g) => g.id === f.id)
      if (s) out.push({ kind: 'Formula', title: f.name, snippet: clean(f.vars ?? f.note ?? (gen ? 'Formula, with a calculation drill' : 'Formula')), to: gen ? `/calc/${gen.id}` : `/formulas?topic=${f.topic}`, topic: f.topic, score: s + 1 })
    }
    for (const l of LESSONS) {
      const body = l.blocks.map(blockText).join(' ')
      const s = score(l.title, body)
      if (s) out.push({ kind: 'My course', title: l.title, snippet: snippetAround(body, terms), to: `/courses/${l.id}`, topic: l.topic, score: s + 2 })
    }
    const tagsSeen = new Set<string>()
    for (const qq of QUESTIONS) {
      const key = qq.topic + '|' + qq.tag
      if (tagsSeen.has(key)) continue
      const s = score(qq.tag, '')
      if (s) {
        tagsSeen.add(key)
        const n = QUESTIONS.filter((x) => x.topic === qq.topic && x.tag === qq.tag).length
        out.push({ kind: 'Practice', title: qq.tag, snippet: `${n} question${n > 1 ? 's' : ''} on this subtopic`, to: `/quiz?topic=${qq.topic}&tag=${encodeURIComponent(qq.tag)}&n=10`, topic: qq.topic, score: s })
      }
    }
    return out.sort((a, b) => b.score - a.score).slice(0, 40)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  return (
    <div className="stack narrow">
      <PageHead title="Search" />
      <input
        ref={input}
        className="search-big"
        type="search"
        placeholder="Search notes, terms, formulas, subtopics"
        value={q}
        onChange={(e) => {
          setQ(e.target.value)
          history.replaceState(null, '', `#/search?q=${encodeURIComponent(e.target.value)}`)
        }}
        aria-label="Search"
      />
      {terms.length > 0 && <p className="muted small">{hits.length ? `${hits.length} results` : `Nothing found for “${q}”. Try a shorter or different term.`}</p>}
      {!terms.length && <p className="muted">Try “contango”, “high-water mark”, “Sortino” or “fulcrum”.</p>}
      <ul className="results">
        {hits.map((h) => (
          <li key={h.kind + h.to + h.title}>
            <a href={href(h.to)}>
              <span className="kind">{h.kind}</span>
              <span>
                <span className="t">
                  <Highlight text={h.title} terms={terms} />
                </span>{' '}
                <TopicTag id={h.topic} />
                <br />
                <span className="s">
                  <Highlight text={h.snippet} terms={terms} />
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
