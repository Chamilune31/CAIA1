import { useState } from 'react'
import { Practice } from '../components/Quiz'
import { Blocks, Rich } from '../components/Rich'
import { Empty, PageHead, TopicTag } from '../components/ui'
import { LESSONS } from '../content'
import { hasToken, uploadCourse, uploadText } from '../lib/github'
import { href } from '../lib/router'
import { useSettings } from '../lib/store'
import { TOPIC, TOPICS } from '../topics'

export default function Cours({ id }: { id?: string }) {
  if (id) return <LessonView id={id} />
  return <CoursList />
}

function CoursList() {
  useSettings()
  return (
    <div className="stack">
      <PageHead kicker="Apprendre" title="Mes cours">
        Dépose tes supports (PDF, Word, notes) : Claude les transforme en leçons avec des QCM, en corrigeant au passage les erreurs éventuelles. Les leçons restent ici de façon permanente.
      </PageHead>
      {TOPICS.map((t) => {
        const ls = LESSONS.filter((l) => l.topic === t.id)
        if (!ls.length) return null
        return (
          <section key={t.id} className="topic-section" style={{ ['--tc' as string]: t.color }}>
            <h2>
              <TopicTag id={t.id} /> {t.fr}
            </h2>
            <div className="fiche-grid">
              {ls.map((l) => (
                <a key={l.id} href={href(`/cours/${l.id}`)} className="card fiche-tile lesson">
                  <h3>{l.title}</h3>
                  <p className="muted small">
                    {l.source} · {new Date(l.added).toLocaleDateString('fr-FR')}
                  </p>
                </a>
              ))}
            </div>
          </section>
        )
      })}
      {!LESSONS.length && <Empty>Aucune leçon pour l’instant. Envoie un premier support ci-dessous, ou colle tes notes dans la conversation avec Claude.</Empty>}
      <Upload />
    </div>
  )
}

function Upload() {
  const [status, setStatus] = useState<string>('')
  const [busy, setBusy] = useState(false)
  const [notes, setNotes] = useState('')
  const [title, setTitle] = useState('')
  if (!hasToken())
    return (
      <section className="card">
        <h2>Envoyer un support</h2>
        <p className="muted">
          Pour envoyer des fichiers depuis le site, ajoute ton jeton GitHub dans les <a href={href('/reglages')}>réglages</a>. Sinon, glisse-les directement dans le dossier <code>cours/</code> du dépôt, ou joins-les dans la conversation avec Claude.
        </p>
      </section>
    )

  const send = async (files: FileList | null) => {
    if (!files?.length) return
    setBusy(true)
    try {
      const paths = []
      for (const f of Array.from(files)) {
        if (f.size > 25e6) throw new Error(`${f.name} dépasse 25 Mo.`)
        setStatus(`Envoi de ${f.name}…`)
        paths.push(await uploadCourse(f))
      }
      setStatus(`✓ Envoyé : ${paths.join(', ')}. La leçon apparaîtra après le prochain passage de Claude.`)
    } catch (e) {
      setStatus(`Erreur : ${e instanceof Error ? e.message : e}`)
    } finally {
      setBusy(false)
    }
  }

  const sendNotes = async () => {
    setBusy(true)
    try {
      const slug = (title || 'notes').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50)
      const path = `cours/${new Date().toISOString().slice(0, 10)}-${slug}.md`
      await uploadText(path, `# ${title || 'Notes'}\n\n${notes}\n`, `Cours : notes « ${title || 'sans titre'} »`)
      setStatus(`✓ Notes envoyées dans ${path}.`)
      setNotes('')
      setTitle('')
    } catch (e) {
      setStatus(`Erreur : ${e instanceof Error ? e.message : e}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card stack">
      <h2>Envoyer un support</h2>
      <label className="drop">
        <input type="file" multiple accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.md,.png,.jpg" onChange={(e) => send(e.target.files)} disabled={busy} />
        <span>Choisir des fichiers (PDF, Word, PowerPoint, images)</span>
      </label>
      <div className="field">
        <label htmlFor="nt">Ou coller des notes</label>
        <input id="nt" placeholder="Titre (ex. Hedge funds – séance 3)" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea rows={6} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Tes notes de cours…" />
        <button className="btn" disabled={busy || !notes.trim()} onClick={sendNotes}>
          Envoyer les notes
        </button>
      </div>
      {status && <p className="small">{status}</p>}
    </section>
  )
}

function LessonView({ id }: { id: string }) {
  const l = LESSONS.find((x) => x.id === id)
  const [quiz, setQuiz] = useState(false)
  if (!l) return <Empty>Leçon introuvable.</Empty>
  return (
    <article className="stack narrow reader" style={{ ['--tc' as string]: TOPIC[l.topic].color }}>
      <a href={href('/cours')} className="back">
        ← Mes cours
      </a>
      <header className="page-head">
        <p className="kicker">
          <TopicTag id={l.topic} /> Source : {l.source}
        </p>
        <h1>{l.title}</h1>
      </header>
      <Blocks blocks={l.blocks} />
      {l.fixes && l.fixes.length > 0 && (
        <aside className="callout trap">
          <b>À corriger dans les notes d’origine</b>
          <ul>
            {l.fixes.map((f, i) => (
              <li key={i}>
                <Rich text={f} />
              </li>
            ))}
          </ul>
        </aside>
      )}
      {l.questions && l.questions.length > 0 && (quiz ? <Practice questions={l.questions} onDone={() => setQuiz(false)} /> : <button className="btn primary" onClick={() => setQuiz(true)}>S’entraîner sur cette leçon ({l.questions.length} QCM)</button>)}
    </article>
  )
}
