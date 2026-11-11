import { readFileSync } from 'node:fs'
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
      // A full-bleed picture with the mask in the middle, so any launcher shape crops it safely.
      { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
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

/**
 * A shared result's page in one language: preview tags with the character's name and picture
 * in that language, and a script that sends a person on to the game.
 */
function resultPage(lang: Lang, c: Character): string {
  const site = siteUrl()
  const name = nameIn(lang, c)
  // The same words the result screen shares, so the preview matches the message.
  const title = escapeHtml(uiText(lang, 'share.result', { name }))
  const description = escapeHtml(uiText(lang, 'share.text'))
  const game = escapeHtml(uiText(lang, 'app.title'))
  // The redirect is JS only: crawlers don't run it and read the tags; a meta refresh some would follow.
  return `<!doctype html>
<html lang="${lang}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${game}" />
    <meta property="og:url" content="${site}r/${lang}/${c.id}/" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${site}og/${lang}/${c.id}.jpg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${escapeHtml(name)}" />
    <meta property="og:locale" content="${OG_LOCALES[lang]}" />
    <meta name="twitter:card" content="summary_large_image" />
    <script>location.replace('../../../')</script>
  </head>
  <body style="background: #13100d">
    <a href="../../../" style="color: #d1a94f">${game}</a>
  </body>
</html>
`
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

// Relative base so the build works under any Pages path.
export default defineConfig({
  base: './',
  plugins: [vue(), webManifests(), resultPages()],
})
