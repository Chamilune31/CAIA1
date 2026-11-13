import { useSyncExternalStore } from 'react'

const sub = (cb: () => void) => {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}
const snap = () => window.location.hash

export const useRoute = () => {
  const hash = useSyncExternalStore(sub, snap)
  const raw = hash.replace(/^#\/?/, '')
  const [path, qs = ''] = raw.split('?')
  const parts = path.split('/').filter(Boolean).map(decodeURIComponent)
  const query = Object.fromEntries(new URLSearchParams(qs))
  return { parts, query, path: '/' + parts.join('/') }
}

export const go = (to: string) => {
  window.location.hash = to.startsWith('#') ? to : '#' + to
  window.scrollTo({ top: 0 })
}

export const href = (to: string) => '#' + to
