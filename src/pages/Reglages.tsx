import { useEffect, useState } from 'react'
import { PageHead } from '../components/ui'
import { hasToken, onSync, syncNow, syncState, testConnection } from '../lib/github'
import { emptyProgress, getProgress, mergeProgress, replaceProgress, updateSettings, useSettings } from '../lib/store'

export default function Reglages() {
  const s = useSettings()
  const [token, setToken] = useState(s.token)
  const [msg, setMsg] = useState('')
  const [sync, setSync] = useState(syncState())
  const [armed, setArmed] = useState(false)
  useEffect(() => onSync(setSync), [])

  const saveToken = async () => {
    updateSettings({ token: token.trim() })
    if (!token.trim()) return setMsg('Jeton supprimé de ce navigateur.')
    setMsg('Vérification…')
    try {
      const name = await testConnection()
      setMsg(`✓ Connecté à ${name}. Synchronisation…`)
      await syncNow()
      setMsg(`✓ Connecté à ${name}. Progression synchronisée.`)
    } catch (e) {
      setMsg(`✗ ${e instanceof Error ? e.message : e}`)
    }
  }

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(getProgress(), null, 1)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `caia1-progression-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
  }
  const importJson = async (f: File | undefined) => {
    if (!f) return
    try {
      const data = JSON.parse(await f.text())
      replaceProgress(mergeProgress(getProgress(), { ...emptyProgress(), ...data }))
      setMsg('✓ Sauvegarde importée et fusionnée.')
    } catch {
      setMsg('✗ Fichier illisible.')
    }
  }

  return (
    <div className="stack narrow">
      <PageHead kicker="Mon suivi" title="Réglages" />

      <section className="card stack">
        <h2>Examen</h2>
        <div className="field">
          <label htmlFor="ed">Date de l’examen</label>
          <input id="ed" type="date" value={s.examDate} onChange={(e) => e.target.value && updateSettings({ examDate: e.target.value })} />
          <p className="muted small">Fenêtres CAIA : mars et septembre. Le planning se recalcule automatiquement.</p>
        </div>
        <div className="field">
          <label htmlFor="dg">Objectif quotidien (exercices)</label>
          <input id="dg" type="number" min={5} max={300} value={s.dailyGoal} onChange={(e) => updateSettings({ dailyGoal: Math.max(5, +e.target.value || 30) })} />
        </div>
        <div className="field">
          <label>Thème</label>
          <div className="seg">
            {(['auto', 'light', 'dark'] as const).map((t) => (
              <button key={t} className={s.theme === t ? 'on' : ''} onClick={() => updateSettings({ theme: t })}>
                {{ auto: 'Auto', light: 'Clair', dark: 'Sombre' }[t]}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="card stack">
        <h2>Synchronisation GitHub</h2>
        <p className="small">
          Avec un jeton, ta progression est enregistrée dans <code>progres/progression.json</code> du dépôt (fusion sans perte entre ordinateur et téléphone), et tu peux envoyer tes cours depuis le site. Claude lit ce fichier pour cibler le nouveau contenu sur tes points faibles.
        </p>
        <details>
          <summary>Créer le jeton (2 minutes)</summary>
          <ol className="small">
            <li>
              github.com → Settings → Developer settings → Personal access tokens → <b>Fine-grained tokens</b> → Generate new token.
            </li>
            <li>
              Repository access : <b>Only select repositories</b> → <code>{s.repo}</code>.
            </li>
            <li>
              Permissions → Repository → <b>Contents : Read and write</b>. Rien d’autre.
            </li>
            <li>Copie le jeton et colle-le ci-dessous. Il reste uniquement dans ce navigateur.</li>
          </ol>
        </details>
        <div className="field">
          <label htmlFor="repo">Dépôt</label>
          <input id="repo" value={s.repo} onChange={(e) => updateSettings({ repo: e.target.value.trim() })} />
        </div>
        <div className="field">
          <label htmlFor="tk">Jeton</label>
          <input id="tk" type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="github_pat_…" autoComplete="off" />
        </div>
        <div className="row wrap">
          <button className="btn primary" onClick={saveToken}>
            Enregistrer et tester
          </button>
          <button className="btn" disabled={!hasToken()} onClick={() => syncNow()}>
            Synchroniser maintenant
          </button>
          <label className="check">
            <input type="checkbox" checked={s.autoSync} onChange={(e) => updateSettings({ autoSync: e.target.checked })} /> Synchro automatique
          </label>
        </div>
        <p className="small muted">
          État : {{ off: 'désactivée', idle: 'prête', syncing: 'en cours…', ok: 'à jour', error: 'erreur' }[sync.status]}
          {sync.at ? ` (${new Date(sync.at).toLocaleTimeString('fr-FR')})` : ''}
          {sync.error ? ` — ${sync.error}` : ''}
        </p>
        {msg && <p className="small">{msg}</p>}
      </section>

      <section className="card stack">
        <h2>Sauvegarde</h2>
        <div className="row wrap">
          <button className="btn" onClick={exportJson}>
            Exporter ma progression
          </button>
          <label className="btn">
            Importer…
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
              setMsg('Progression locale remise à zéro.')
            }}
          >
            {armed ? 'Confirmer la remise à zéro' : 'Tout remettre à zéro'}
          </button>
        </div>
        <p className="muted small">La remise à zéro n’efface que ce navigateur ; la copie GitHub sera refusionnée à la prochaine synchro.</p>
      </section>
    </div>
  )
}
