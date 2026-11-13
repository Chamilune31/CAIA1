import { useEffect, useState } from 'react'
import { Blocks, slug } from '../components/Rich'
import { Empty, PageHead, TopicPicker, TopicTag } from '../components/ui'
import { FICHES, LESSONS, QUESTIONS } from '../content'
import { go, href } from '../lib/router'
import { markRead, useProgress } from '../lib/store'
import { TOPIC, TOPICS, isTopic } from '../topics'
import type { Fiche, TopicId } from '../types'

export default function Notes({ topic, noteId }: { topic?: string; noteId?: string }) {
  if (noteId) return <Reader id={noteId} />
  return <List t={topic && isTopic(topic) ? topic : 'all'} />
}

export function NoteList({ notes }: { notes: Fiche[] }) {
  const p = useProgress()
  return (
    <ul className="note-list">
      {notes.map((f) => (
        <li key={f.id} style={{ ['--tc' as string]: TOPIC[f.topic].color }}>
          <a href={href(`/note/${f.id}`)}>
            <span className={`state ${p.read[f.id] ? 'read' : ''}`} aria-label={p.read[f.id] ? 'Read' : 'Not read yet'} />
            <span>
              <span className="t">{f.title}</span>
              <br />
              <span className="s">{f.subtitle}</span>
            </span>
            <span className="s">{f.minutes} min</span>
          </a>
        </li>
      ))}
    </ul>
  )
}

function List({ t }: { t: TopicId | 'all' }) {
  const p = useProgress()
  const topics = t === 'all' ? TOPICS : [TOPIC[t]]
  const counts = Object.fromEntries([['all', FICHES.length], ...TOPICS.map((tp) => [tp.id, FICHES.filter((f) => f.topic === tp.id).length])])
  return (
    <div className="stack">
      <PageHead title="Study notes">Concise notes for every topic, with the key points and exam traps called out.</PageHead>
      <TopicPicker value={t} onChange={(x) => go(x === 'all' ? '/notes' : `/notes/${x}`)} counts={counts} />
      {topics.map((tp) => {
        const list = FICHES.filter((f) => f.topic === tp.id)
        const read = list.filter((f) => p.read[f.id]).length
        const lessons = LESSONS.filter((l) => l.topic === tp.id)
        return (
          <section key={tp.id} className="topic-section" style={{ ['--tc' as string]: tp.color }}>
            <header>
              <h2>
                <a href={href(`/topic/${tp.id}`)}>{tp.name}</a>
              </h2>
              <span className="muted small">
                {read} of {list.length} read, {tp.weight[0]}–{tp.weight[1]}% of the exam
              </span>
            </header>
            {list.length ? <NoteList notes={list} /> : <Empty>No notes for this topic yet.</Empty>}
            {lessons.length > 0 && (
              <ul className="note-list">
                {lessons.map((l) => (
                  <li key={l.id}>
                    <a href={href(`/courses/${l.id}`)}>
                      <span className="pill">Mine</span>
                      <span className="t">{l.title}</span>
                      <span className="s">from my course</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )
      })}
    </div>
  )
}

function Reader({ id }: { id: string }) {
  const p = useProgress()
  const f = FICHES.find((x) => x.id === id)
  const [scroll, setScroll] = useState(0)

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [id])
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      setScroll(max > 0 ? Math.min(1, window.scrollY / max) : 1)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [id])

  if (!f) return <Empty>This note does not exist. <a href={href('/notes')}>See all notes</a></Empty>
  const siblings = FICHES.filter((x) => x.topic === f.topic)
  const si = siblings.indexOf(f)
  const prev = siblings[si - 1]
  const next = siblings[si + 1]
  const nq = QUESTIONS.filter((q) => q.topic === f.topic).length
  const headings = f.blocks.filter((b) => b.t === 'h').map((b) => (b as { text: string }).text)
  const isRead = !!p.read[f.id]

  return (
    <div className="reader-layout" style={{ ['--tc' as string]: TOPIC[f.topic].color }}>
      <div className="read-progress" style={{ width: `${scroll * 100}%` }} aria-hidden="true" />
      <article className="stack reader">
        <a href={href(`/topic/${f.topic}`)} className="crumb">
          ← {TOPIC[f.topic].name}
        </a>
        <header className="page-head">
          <h1>{f.title}</h1>
          <p className="subtitle">{f.subtitle}</p>
          <p className="muted small">
            <TopicTag id={f.topic} long /> &nbsp;{f.minutes} min read{isRead ? ', read' : ''}
          </p>
        </header>
        <Blocks blocks={f.blocks} />
        <div className="reader-foot">
          <button className={`btn ${isRead ? '' : 'primary'}`} onClick={() => markRead(f.id)} disabled={isRead}>
            {isRead ? 'Marked as read' : 'Mark as read'}
          </button>
          <a className="btn" href={href(`/quiz?topic=${f.topic}&n=10`)}>
            Practise 10 questions
          </a>
          <a className="btn ghost" href={href(`/flashcards?topic=${f.topic}`)}>
            Flashcards
          </a>
        </div>
        <p className="muted small">{nq} practice questions available for this topic.</p>
        <nav className="pager-row" aria-label="More notes in this topic">
          {prev && (
            <a href={href(`/note/${prev.id}`)} className="pager">
              <small>Previous</small>
              <b>{prev.title}</b>
            </a>
          )}
          {next && (
            <a href={href(`/note/${next.id}`)} className="pager next">
              <small>Next</small>
              <b>{next.title}</b>
            </a>
          )}
        </nav>
      </article>
      {headings.length > 1 && (
        <aside className="toc" aria-label="On this page">
          <p>On this page</p>
          {headings.map((h) => (
            <a key={h} href={`#${slug(h)}`} onClick={(e) => {
              e.preventDefault()
              document.getElementById(slug(h))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}>
              {h}
            </a>
          ))}
        </aside>
      )}
    </div>
  )
}
