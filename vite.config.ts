import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import { isBaseLang, LANGS, type Lang } from './src/i18n/langs'

const BG = '#13100d' // --bg in src/styles/tokens.css

const read = (rel: string) => JSON.parse(readFileSync(join(import.meta.dirname, rel), 'utf8'))

/** The app's title and subtitle in a language, with English for anything not translated yet. */
function appTexts(lang: Lang) {
  const en = read('src/i18n/en.json')
  const own = isBaseLang(lang) ? read(`src/i18n/${lang}.json`) : read(`src/i18n/locales/${lang}.json`).ui
  return { title: own['app.title'] || en['app.title'], subtitle: own['app.subtitle'] || en['app.subtitle'] }
}

function manifest(lang: Lang): string {
  const { title, subtitle } = appTexts(lang)
  return JSON.stringify({
    name: title,
    short_name: title,
    description: subtitle,
    lang,
    // Relative to the manifest, which sits next to index.html: works under any Pages path.
    id: './',
    start_url: './',
    scope: './',
    display: 'standalone',
    orientation: 'portrait',
    background_color: BG,
    theme_color: BG,
    icons: [
      { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      // The whole picture with the mask well inside the central circle, so any launcher shape crops it safely.
      { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  })
}

/**
 * One web app manifest per language (manifest-<lang>.webmanifest), so the home-screen icon is
 * named in the language the game was installed in. src/pwa.ts points the page at the current one.
 */
function webManifests(): Plugin {
  return {
    name: 'web-manifests',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const lang = req.url?.match(/\/manifest-([\w-]+)\.webmanifest$/)?.[1]
        const l = LANGS.find((x) => x === lang)
        if (!l) return next()
        res.setHeader('Content-Type', 'application/manifest+json')
        res.end(manifest(l))
      })
    },
    generateBundle() {
      for (const l of LANGS) this.emitFile({ type: 'asset', fileName: `manifest-${l}.webmanifest`, source: manifest(l) })
    },
  }
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]!)

/** The deployed address (og:url in index.html), since link previews need absolute URLs. */
function siteUrl(): string {
  const html = readFileSync(join(import.meta.dirname, 'index.html'), 'utf8')
  return html.match(/<meta property="og:url" content="([^"]+)"/)![1]
}

/** og:locale for each language. */
const OG_LOCALES: Record<Lang, string> = {
  de: 'de_DE',
  en: 'en_US',
  es: 'es_ES',
  fr: 'fr_FR',
  it: 'it_IT',
  mk: 'mk_MK',
  pl: 'pl_PL',
  'pt-BR': 'pt_BR',
  ru: 'ru_RU',
  sr: 'sr_RS',
}

type Character = { id: string; name: { ru: string; en: string } }

/** A character's name in a language, with English if it isn't translated yet. */
function nameIn(lang: Lang, c: Character): string {
  if (isBaseLang(lang)) return c.name[lang]
  return read(`src/i18n/locales/${lang}.json`).data[`character.${c.id}.name`]?.text || c.name.en
}

/** A UI string in a language, with English if it isn't translated yet. */
function uiText(lang: Lang, key: string, params: Record<string, string> = {}): string {
  const own = isBaseLang(lang) ? read(`src/i18n/${lang}.json`) : read(`src/i18n/locales/${lang}.json`).ui
  const text: string = own[key] || read('src/i18n/en.json')[key]
  return text.replace(/\{(\w+)\}/g, (_, k: string) => params[k] ?? '')
}

type StubPage = {
  lang: Lang
  /** The page's own path under the site, for og:url ("ru/", "r/ru/<id>/"). */
  path: string
  title: string
  description: string
  /** Picture path under the site, and what it shows. */
  image: string
  imageAlt: string
}

/**
 * A page that exists only for link previews: tags in one language, and a script that sends
 * a person on to the game in that language (?lang=, picked up by src/i18n/useI18n.ts).
 */
function stubPage({ lang, path, title, description, image, imageAlt }: StubPage): string {
  const site = siteUrl()
  const game = escapeHtml(uiText(lang, 'app.title'))
  const back = `${'../'.repeat(path.split('/').filter(Boolean).length)}?lang=${lang}`
  // The redirect is JS only: crawlers don't run it and read the tags; a meta refresh some would follow.
  return `<!doctype html>
<html lang="${lang}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${game}" />
    <meta property="og:url" content="${site}${path}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:image" content="${site}${image}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${escapeHtml(imageAlt)}" />
    <meta property="og:locale" content="${OG_LOCALES[lang]}" />
    <meta name="twitter:card" content="summary_large_image" />
    <script>location.replace('${back}' + location.hash)</script>
  </head>
  <body style="background: ${BG}">
    <a href="${back}" style="color: #d1a94f">${game}</a>
  </body>
</html>
`
}

/** A shared result's page: the character's name and picture in that language. */
function resultPage(lang: Lang, c: Character): string {
  const name = nameIn(lang, c)
  return stubPage({
    lang,
    path: `r/${lang}/${c.id}/`,
    // The same words the result screen shares, so the preview matches the message.
    title: uiText(lang, 'share.result', { name }),
    description: uiText(lang, 'share.text'),
    image: `og/${lang}/${c.id}.jpg`,
    imageAlt: name,
  })
}

/** The game shared from the start screen: its name and tagline in that language. */
function langPage(lang: Lang): string {
  const { title } = appTexts(lang)
  return stubPage({
    lang,
    path: `${lang}/`,
    title,
    description: uiText(lang, 'share.text'),
    image: 'og-image.jpg',
    imageAlt: title,
  })
}

/**
 * One page per language (<lang>/index.html), so the game's link previews in the language it
 * was shared in; the plain address previews in English (index.html).
 */
function langPages(): Plugin {
  return {
    name: 'lang-pages',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const lang = req.url?.match(/^\/([\w-]+)\/?(?:\?.*)?$/)?.[1]
        const l = LANGS.find((x) => x === lang)
        if (!l) return next()
        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        res.end(langPage(l))
      })
    },
    generateBundle() {
      for (const l of LANGS) this.emitFile({ type: 'asset', fileName: `${l}/index.html`, source: langPage(l) })
    },
  }
}

/**
 * One page per ladder step and language (r/<lang>/<id>/index.html), so a shared result's link
 * previews with the verdict's name and picture (public/og/<lang>/<id>.jpg, made by
 * scripts/og-images.py) in the language it was shared in.
 */
function resultPages(): Plugin {
  const page = (lang: Lang, id: string) => {
    const characters: Character[] = read('src/data/characters.json')
    const c = characters.find((x) => x.id === id)
    return c && resultPage(lang, c)
  }
  const all = () => {
    const ladder: { characterId: string }[] = read('src/data/results.json')
    return LANGS.flatMap((lang) => ladder.map(({ characterId: id }) => ({ lang, id })))
  }
  return {
    name: 'result-pages',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const [, lang, id] = req.url?.match(/\/r\/([\w-]+)\/([\w-]+)\/?(?:\?.*)?$/) ?? []
        const l = LANGS.find((x) => x === lang)
        const html = l && all().some((p) => p.lang === l && p.id === id) && page(l, id)
        if (!html) return next()
        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        res.end(html)
      })
    },
    generateBundle() {
      for (const { lang, id } of all())
        this.emitFile({ type: 'asset', fileName: `r/${lang}/${id}/index.html`, source: page(lang, id)! })
    },
  }
}

/** Folders under public/ whose pictures the installed game keeps for offline play. */
const OFFLINE_DIRS = ['portraits', 'sigils', 'backgrounds']

/** Every offline picture with a short hash of its bytes: { "portraits/x.webp": "3f9a…" }. */
function mediaList(): string {
  const list: Record<string, string> = {}
  for (const dir of OFFLINE_DIRS) {
    for (const name of readdirSync(join(import.meta.dirname, 'public', dir)).sort()) {
      if (name.startsWith('.')) continue
      const bytes = readFileSync(join(import.meta.dirname, 'public', dir, name))
      list[`${dir}/${name}`] = createHash('sha1').update(bytes).digest('hex').slice(0, 12)
    }
  }
  return JSON.stringify(list)
}

/**
 * media.json: the list src/offline.ts downloads in the installed app. The hashes tell it which
 * pictures changed in a deploy, so only those are fetched again.
 */
function offlineMedia(): Plugin {
  return {
    name: 'offline-media',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.match(/\/media\.json(\?.*)?$/)) return next()
        res.setHeader('Content-Type', 'application/json')
        res.end(mediaList())
      })
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'media.json', source: mediaList() })
    },
  }
}

// Relative base so the build works under any Pages path.
export default defineConfig({
  base: './',
  plugins: [vue(), webManifests(), langPages(), resultPages(), offlineMedia()],
})
