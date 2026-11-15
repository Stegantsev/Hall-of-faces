import { ref } from 'vue'
import { assetUrl } from './assets'

/** The service worker's picture cache (MEDIA in public/sw.js): the game reads pictures from it offline. */
const MEDIA_CACHE = 'media-v1'
/** localStorage: { path: hash } of the copies already in the cache, from media.json. */
const SAVED_KEY = 'offline-media'
const PARALLEL = 4

/** Progress for the credits page; null outside the installed app. */
export const offlineProgress = ref<{ done: number; total: number } | null>(null)

let running = false

const absolute = (path: string) => new URL(assetUrl(path), location.href).href

function readSaved(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(SAVED_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function writeSaved(saved: Record<string, string>) {
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify(saved))
  } catch {
    // Storage full or blocked: the next launch checks the cache again.
  }
}

/**
 * Quietly downloads every portrait, sigil and backdrop (media.json) into the picture cache, so
 * the installed game plays fully offline. Already saved, unchanged pictures are skipped; an
 * interrupted download carries on from where it stopped on the next launch or reconnect.
 */
export async function saveAllMedia() {
  if (running || !('caches' in window)) return
  running = true
  try {
    // Ask the browser not to evict the pictures when the phone runs low on space.
    navigator.storage?.persist?.().catch(() => {})

    const list: Record<string, string> = await (await fetch(assetUrl('media.json'), { cache: 'no-cache' })).json()
    const cache = await caches.open(MEDIA_CACHE)
    const paths = Object.keys(list)
    const known = new Set(paths.map(absolute))

    // Drop pictures no longer in the game (renamed, removed, or the old JPEG portraits).
    for (const req of await cache.keys()) {
      const url = new URL(req.url)
      const ours = url.origin === location.origin && /\/(portraits|sigils|backgrounds)\//.test(url.pathname)
      if (ours && !known.has(url.href)) await cache.delete(req)
    }

    const saved = readSaved()
    for (const p of Object.keys(saved)) if (!(p in list)) delete saved[p]
    const todo: string[] = []
    for (const p of paths) {
      if (saved[p] !== list[p] || !(await cache.match(absolute(p)))) todo.push(p)
    }

    let done = paths.length - todo.length
    offlineProgress.value = { done, total: paths.length }

    const next = todo[Symbol.iterator]()
    let failed = false
    async function worker() {
      for (const p of next) {
        if (failed) return
        const url = absolute(p)
        try {
          // A changed picture: drop the old copy, or the service worker would answer with it.
          await cache.delete(url)
          const res = await fetch(url, { cache: 'no-cache' })
          if (!res.ok) throw new Error(`${res.status} ${p}`)
          await cache.put(url, res)
        } catch (e) {
          failed = true // The other workers stop too, so a retry never overlaps this run.
          throw e
        }
        saved[p] = list[p]
        offlineProgress.value = { done: ++done, total: paths.length }
        if (done % 25 === 0) writeSaved(saved)
      }
    }
    try {
      await Promise.allSettled(Array.from({ length: PARALLEL }, worker))
    } finally {
      writeSaved(saved)
    }
    if (failed) throw new Error('Download interrupted')
  } catch {
    // Offline or a failed request: try again when the connection is back.
    window.addEventListener('online', () => void saveAllMedia(), { once: true })
  } finally {
    running = false
  }
}
