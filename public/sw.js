// Service worker: lets the installed game start and play offline.
// - The page itself is network-first, so a new deploy shows up on the next launch.
// - Hashed build files (assets/) never change: cache-first.
// - Portraits, sigils, icons and fonts: served from the cache and refreshed in the background.
// Nothing is precached: pictures are kept as the player meets them.

const PAGES = 'pages-v1'
const ASSETS = 'assets-v1'
const MEDIA = 'media-v1'
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com']

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  const keep = [PAGES, ASSETS, MEDIA]
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !keep.includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  const own = url.origin === self.location.origin
  if (!own && !FONT_HOSTS.includes(url.host)) return

  if (req.mode === 'navigate') event.respondWith(networkFirst(req))
  else if (own && url.pathname.includes('/assets/')) event.respondWith(cacheFirst(req))
  else event.respondWith(staleWhileRevalidate(req, event))
})

async function networkFirst(req) {
  const cache = await caches.open(PAGES)
  try {
    const res = await fetch(req)
    if (res.ok) cache.put(req, res.clone())
    return res
  } catch {
    // Offline: the hash routes (#/credits) all load the same page.
    return (await cache.match(req, { ignoreSearch: true })) ?? (await cache.match(self.registration.scope)) ?? Response.error()
  }
}

async function cacheFirst(req) {
  const cache = await caches.open(ASSETS)
  const hit = await cache.match(req)
  if (hit) return hit
  const res = await fetch(req)
  if (res.ok) cache.put(req, res.clone())
  return res
}

async function staleWhileRevalidate(req, event) {
  const cache = await caches.open(MEDIA)
  const hit = await cache.match(req)
  const update = fetch(req).then((res) => {
    // Opaque (status 0) responses come from cross-origin font CSS loaded without CORS.
    if (res.ok || res.type === 'opaque') cache.put(req, res.clone())
    return res
  })
  if (hit) {
    event.waitUntil(update.catch(() => {}))
    return hit
  }
  return update
}
