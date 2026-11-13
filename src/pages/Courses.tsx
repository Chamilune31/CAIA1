import { useState } from 'react'
import { Practice } from '../components/Quiz'
import { Blocks, Rich } from '../components/Rich'
import { Empty, fmtDate, PageHead, TopicTag } from '../components/ui'
import { LESSONS } from '../content'
import { hasToken, uploadCourse, uploadText } from '../lib/github'
import { href } from '../lib/router'
import { useSettings } from '../lib/store'
import { TOPIC, TOPICS } from '../topics'

export default function Courses({ id }: { id?: string }) {
  if (id) return <LessonView id={id} />
  return <CourseList />
}

function CourseList() {
  useSettings()
  return (
    <div className="stack">
      <PageHead title="My courses">Upload your own course material (PDF, Word, slides or notes). Claude turns it into lessons with practice questions and points out anything in the material that looks wrong. Lessons stay here permanently.</PageHead>
      {TOPICS.map((t) => {
        const ls = LESSONS.filter((l) => l.topic === t.id)
        if (!ls.length) return null
        return (
          <section key={t.id} className="topic-section" style={{ ['--tc' as string]: t.color }}>
            <h2>{t.name}</h2>
            <ul className="note-list">
              {ls.map((l) => (
                <li key={l.id}>
                  <a href={href(`/courses/${l.id}`)}>
                    <span className="pill">Mine</span>
                    <span>
                      <span className="t">{l.title}</span>
                      <br />
                      <span className="s">{l.source}</span>
                    </span>
                    <span className="s">{fmtDate(l.added)}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
      {!LESSONS.length && <Empty>No lessons yet. Upload your first file below, or paste your notes into a conversation with Claude.</Empty>}
      <Upload />
      <p className="muted small">The repository is public: anything uploaded here can be seen by anyone. Avoid uploading copyrighted CAIA curriculum files; your own notes are fine.</p>
    </div>
  )
}

function Upload() {
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const [notes, setNotes] = useState('')
  const [title, setTitle] = useState('')
  if (!hasToken())
    return (
      <section className="card stack tight">
        <h2>Upload material</h2>
        <p className="muted">
          To upload from the site, add your GitHub token in <a href={href('/settings')}>Settings</a>. You can also drop files into the <code>cours/</code> folder of the repository, or attach them in a conversation with Claude.
        </p>
      </section>
    )

  const send = async (files: FileList | null) => {
    if (!files?.length) return
    setBusy(true)
    try {
      const paths = []
      for (const f of Array.from(files)) {
        if (f.size > 25e6) throw new Error(`${f.name} is larger than 25 MB.`)
        setStatus(`Uploading ${f.name}…`)
        paths.push(await uploadCourse(f))
      }
      setStatus(`Uploaded ${paths.join(', ')}. The lesson will appear after Claude’s next pass.`)
    } catch (e) {
      setStatus(`Upload failed: ${e instanceof Error ? e.message : e}`)
    } finally {
      setBusy(false)
    }
  }

  const sendNotes = async () => {
    setBusy(true)
    try {
      const sl = (title || 'notes').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50)
      const path = `cours/${new Date().toISOString().slice(0, 10)}-${sl}.md`
      await uploadText(path, `# ${title || 'Notes'}\n\n${notes}\n`, `Course notes: ${title || 'untitled'}`)
      setStatus(`Notes uploaded to ${path}.`)
      setNotes('')
      setTitle('')
    } catch (e) {
      setStatus(`Upload failed: ${e instanceof Error ? e.message : e}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card stack">
      <h2>Upload material</h2>
      <label className="drop">
        <input type="file" multiple accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.md,.png,.jpg" onChange={(e) => send(e.target.files)} disabled={busy} />
        <span>Choose files: PDF, Word, PowerPoint or images</span>
      </label>
      <div className="field">
        <label htmlFor="nt-title">Or paste notes</label>
        <input id="nt-title" placeholder="Title, e.g. Hedge funds, class 3" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea rows={6} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Your course notes…" aria-label="Notes" />
        <div>
          <button className="btn" disabled={busy || !notes.trim()} onClick={sendNotes}>
            Upload notes
          </button>
        </div>
      </div>
      {status && (
        <p className="small" role="status">
          {status}
        </p>
      )}
    </section>
  )
}

function LessonView({ id }: { id: string }) {
  const l = LESSONS.find((x) => x.id === id)
  const [quiz, setQuiz] = useState(false)
  if (!l) return <Empty>This lesson does not exist.</Empty>
  return (
    <article className="stack narrow reader" style={{ ['--tc' as string]: TOPIC[l.topic].color }}>
      <a href={href('/courses')} className="crumb">
        ← My courses
      </a>
      <header className="page-head">
        <h1>{l.title}</h1>
        <p className="muted small">
          <TopicTag id={l.topic} long /> &nbsp;From {l.source}
        </p>
      </header>
      <Blocks blocks={l.blocks} />
      {l.fixes && l.fixes.length > 0 && (
        <aside className="callout trap">
          <b>Corrections to the original material</b>
          <ul>
            {l.fixes.map((f, i) => (
              <li key={i}>
                <Rich text={f} />
              </li>
            ))}
          </ul>
        </aside>
      )}
      {l.questions && l.questions.length > 0 &&
        (quiz ? (
          <Practice questions={l.questions} onDone={() => setQuiz(false)} />
        ) : (
          <div>
            <button className="btn primary" onClick={() => setQuiz(true)}>
              Practise this lesson ({l.questions.length} questions)
            </button>
          </div>
        ))}
    </article>
  )
}
