import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import { isBaseLang, LANGS, type Lang } from './src/i18n/langs'

const BG = '#13100d' // --bg in src/styles/tokens.css

/** The app's title and subtitle in a language, with English for anything not translated yet. */
function appTexts(lang: Lang) {
  const read = (rel: string) => JSON.parse(readFileSync(join(import.meta.dirname, rel), 'utf8'))
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

// Relative base so the build works under any Pages path.
export default defineConfig({
  base: './',
  plugins: [vue(), webManifests()],
})
