import { useEffect, useState } from 'react'
import { PageHead } from '../components/ui'
import { hasToken, onSync, syncNow, syncState, testConnection } from '../lib/github'
import { emptyProgress, getProgress, mergeProgress, replaceProgress, updateSettings, useSettings } from '../lib/store'

export default function Settings() {
  const s = useSettings()
  const [token, setToken] = useState(s.token)
  const [msg, setMsg] = useState('')
  const [sync, setSync] = useState(syncState())
  const [armed, setArmed] = useState(false)
  useEffect(() => onSync(setSync), [])

  const saveToken = async () => {
    updateSettings({ token: token.trim() })
    if (!token.trim()) return setMsg('Token removed from this browser.')
    setMsg('Checking the token…')
    try {
      const name = await testConnection()
      setMsg(`Connected to ${name}. Syncing…`)
      await syncNow()
      setMsg(`Connected to ${name}. Progress synced.`)
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e))
    }
  }

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(getProgress(), null, 1)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `caia1-progress-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
  }
  const importJson = async (f: File | undefined) => {
    if (!f) return
    try {
      const data = JSON.parse(await f.text())
      replaceProgress(mergeProgress(getProgress(), { ...emptyProgress(), ...data }))
      setMsg('Backup imported and merged with your current progress.')
    } catch {
      setMsg('That file could not be read. Choose a progress file exported from this site.')
    }
  }

  const statusLabel = { off: 'Off', idle: 'Ready', syncing: 'Syncing…', ok: 'Up to date', error: 'Error' }[sync.status]

  return (
    <div className="stack narrow">
      <PageHead title="Settings" />

      <section className="card stack">
        <h2>Exam</h2>
        <div className="field">
          <label htmlFor="ed">Exam date</label>
          <input id="ed" type="date" value={s.examDate} onChange={(e) => e.target.value && updateSettings({ examDate: e.target.value, onboarded: true })} style={{ maxWidth: 220 }} />
          <p className="hint">CAIA windows run in March and September. The study plan updates automatically.</p>
        </div>
        <div className="field">
          <label htmlFor="dg">Daily goal (items)</label>
          <input id="dg" type="number" min={5} max={300} value={s.dailyGoal} onChange={(e) => updateSettings({ dailyGoal: Math.max(5, +e.target.value || 30) })} style={{ maxWidth: 120 }} />
        </div>
        <div className="field">
          <span className="field-label">Appearance</span>
          <div className="seg" role="group" aria-label="Appearance">
            {(['auto', 'light', 'dark'] as const).map((t) => (
              <button key={t} className={s.theme === t ? 'on' : ''} onClick={() => updateSettings({ theme: t })}>
                {{ auto: 'Match device', light: 'Light', dark: 'Dark' }[t]}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="card stack">
        <h2>Sync across devices</h2>
        <p className="small">
          Your progress is always saved in this browser. With a GitHub token it is also saved to <code>progres/progression.json</code> in the repository and merged across your computer and phone without losing anything. The token also lets you upload course material from the site, and lets Claude target new content at your weak spots.
        </p>
        <details>
          <summary>How to create the token (2 minutes)</summary>
          <ol className="small">
            <li>
              On github.com: Settings → Developer settings → Personal access tokens → <b>Fine-grained tokens</b> → Generate new token.
            </li>
            <li>
              Repository access: <b>Only select repositories</b> → <code>{s.repo}</code>.
            </li>
            <li>
              Permissions → Repository → <b>Contents: Read and write</b>. Nothing else.
            </li>
            <li>Copy the token and paste it below. It stays in this browser only.</li>
          </ol>
        </details>
        <div className="field">
          <label htmlFor="repo">Repository</label>
          <input id="repo" value={s.repo} onChange={(e) => updateSettings({ repo: e.target.value.trim() })} />
        </div>
        <div className="field">
          <label htmlFor="tk">Token</label>
          <input id="tk" type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="github_pat_…" autoComplete="off" />
        </div>
        <div className="row wrap">
          <button className="btn primary" onClick={saveToken}>
            Save and test
          </button>
          <button className="btn" disabled={!hasToken()} onClick={() => syncNow()}>
            Sync now
          </button>
          <label className="check">
            <input type="checkbox" checked={s.autoSync} onChange={(e) => updateSettings({ autoSync: e.target.checked })} /> Sync automatically
          </label>
        </div>
        <p className="small muted" role="status">
          Status: {statusLabel}
          {sync.at ? ` (${new Date(sync.at).toLocaleTimeString('en-GB')})` : ''}
          {sync.error ? `. ${sync.error}` : ''}
        </p>
        {msg && (
          <p className="small" role="status">
            {msg}
          </p>
        )}
      </section>

      <section className="card stack">
        <h2>Backup</h2>
        <div className="row wrap">
          <button className="btn" onClick={exportJson}>
            Export progress
          </button>
          <label className="btn">
            Import a backup
            <input type="file" accept="application/json" hidden onChange={(e) => importJson(e.target.files?.[0])} />
          </label>
          <button
            className="btn danger"
            onClick={() => {
              if (!armed) {
                setArmed(true)
                setTimeout(() => setArmed(false), 4000)
                return
              }
              replaceProgress({ ...emptyProgress(), updatedAt: Date.now() })
              setArmed(false)
              setMsg('Progress in this browser has been reset.')
            }}
          >
            {armed ? 'Click again to reset' : 'Reset progress'}
          </button>
        </div>
        <p className="hint">Reset only clears this browser. If sync is on, the copy on GitHub is merged back at the next sync.</p>
      </section>
    </div>
  )
}
