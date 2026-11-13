import { getProgress, getSettings, mergeProgress, onLocalChange, replaceProgress, emptyProgress } from './store'
import type { Progress } from '../types'

const API = 'https://api.github.com'
export const PROGRESS_PATH = 'progres/progression.json'

const headers = () => ({
  Authorization: `Bearer ${getSettings().token}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
})

const url = (path: string) => `${API}/repos/${getSettings().repo}/contents/${path.split('/').map(encodeURIComponent).join('/')}`

export const hasToken = () => getSettings().token.trim().length > 0

const toB64 = (bytes: Uint8Array) => {
  let s = ''
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(s)
}
const textToB64 = (t: string) => toB64(new TextEncoder().encode(t))
const b64ToText = (b: string) => new TextDecoder().decode(Uint8Array.from(atob(b.replace(/\n/g, '')), (c) => c.charCodeAt(0)))

async function getFile(path: string): Promise<{ sha: string; text: string } | null> {
  const r = await fetch(url(path) + `?t=${Date.now()}`, { headers: headers(), cache: 'no-store' })
  if (r.status === 404) return null
  if (!r.ok) throw new Error(`GitHub ${r.status} : ${await r.text()}`)
  const j = await r.json()
  return { sha: j.sha, text: b64ToText(j.content ?? '') }
}

async function putFile(path: string, contentB64: string, message: string, sha?: string) {
  const r = await fetch(url(path), {
    method: 'PUT',
    headers: { ...headers(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, content: contentB64, sha }),
  })
  if (!r.ok) throw new Error(`GitHub ${r.status} : ${(await r.json().catch(() => ({}))).message ?? r.statusText}`)
  return r.json()
}

export async function testConnection() {
  const r = await fetch(`${API}/repos/${getSettings().repo}`, { headers: headers() })
  if (!r.ok) throw new Error(r.status === 404 ? 'Dépôt introuvable ou jeton sans accès.' : `Erreur ${r.status}`)
  const j = await r.json()
  if (!j.permissions?.push) throw new Error('Le jeton peut lire mais pas écrire (Contents: Read and write requis).')
  return j.full_name as string
}

/** Envoie un fichier (PDF, Word, notes) dans cours/ pour que Claude en fasse une leçon. */
export async function uploadCourse(file: File, folder = 'cours') {
  const safe = file.name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w.\-]+/g, '-')
  const path = `${folder}/${safe}`
  const existing = await getFile(path).catch(() => null)
  const bytes = new Uint8Array(await file.arrayBuffer())
  await putFile(path, toB64(bytes), `Cours : ajout de ${safe}`, existing?.sha)
  return path
}

export async function uploadText(path: string, text: string, message: string) {
  const existing = await getFile(path).catch(() => null)
  await putFile(path, textToB64(text), message, existing?.sha)
}

/* ---------- Synchronisation de la progression ---------- */
type SyncState = { status: 'off' | 'idle' | 'syncing' | 'ok' | 'error'; at?: number; error?: string }
let state: SyncState = { status: 'off' }
const subs = new Set<(s: SyncState) => void>()
const set = (s: SyncState) => {
  state = s
  subs.forEach((f) => f(s))
}
export const syncState = () => state
export const onSync = (f: (s: SyncState) => void) => {
  subs.add(f)
  return () => {
    subs.delete(f)
  }
}

let running: Promise<void> | null = null

export function syncNow(): Promise<void> {
  if (!hasToken()) {
    set({ status: 'off' })
    return Promise.resolve()
  }
  if (running) return running
  running = (async () => {
    set({ status: 'syncing' })
    try {
      for (let attempt = 0; attempt < 3; attempt++) {
        const remote = await getFile(PROGRESS_PATH)
        const remoteP: Progress = remote ? { ...emptyProgress(), ...JSON.parse(remote.text) } : emptyProgress()
        const merged = mergeProgress(getProgress(), remoteP)
        replaceProgress(merged)
        const text = JSON.stringify(merged, null, 1)
        if (remote && remote.text.trim() === text.trim()) break
        try {
          await putFile(PROGRESS_PATH, textToB64(text), 'Progression : synchronisation', remote?.sha)
          break
        } catch (e) {
          // conflit (un autre appareil vient d'écrire) : on relit et on refusionne
          if (attempt === 2 || !String(e).includes('409')) throw e
        }
      }
      set({ status: 'ok', at: Date.now() })
    } catch (e) {
      set({ status: 'error', error: e instanceof Error ? e.message : String(e), at: Date.now() })
    } finally {
      running = null
    }
  })()
  return running
}

let timer: number | undefined
export function startAutoSync() {
  if (hasToken()) set({ status: 'idle' })
  if (getSettings().autoSync) syncNow()
  onLocalChange(() => {
    if (!getSettings().autoSync || !hasToken()) return
    clearTimeout(timer)
    timer = window.setTimeout(syncNow, 8000)
  })
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && getSettings().autoSync && hasToken()) {
      clearTimeout(timer)
      syncNow()
    }
  })
}
