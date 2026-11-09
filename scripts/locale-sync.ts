// Creates or updates a locale file for a language beyond ru/en, then reports progress.
// Usage: pnpm locale:sync mk
//
// src/i18n/locales/<lang>.json gets every UI key and every data text path (see
// src/data/textPaths.ts). New entries come with an empty "text" for a translator to
// fill; paths that no longer exist in the data are dropped. Existing translations are
// never touched: a stale one (its "en" no longer matches the data) keeps its old "en",
// so the game shows English for it until it is retranslated and "en" is updated.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { charactersFile, housesFile, ladderFile } from '../src/data/schema'
import { textPaths, type LocaleEntry, type LocaleFile } from '../src/data/textPaths'
import { isBaseLang, isLang } from '../src/i18n/langs'

const root = join(import.meta.dirname, '..')
const readJson = (rel: string): unknown => JSON.parse(readFileSync(join(root, rel), 'utf8'))

const lang = process.argv[2]
if (!isLang(lang) || isBaseLang(lang)) {
  console.error(`usage: pnpm locale:sync <lang>, where <lang> is in LANGS (src/i18n/langs.ts) and is not ru/en`)
  process.exit(1)
}

const characters = charactersFile.parse(readJson('src/data/characters.json'))
const houses = housesFile.parse(readJson('src/data/houses.json'))
const ladder = ladderFile.parse(readJson('src/data/results.json'))
const enUi = readJson('src/i18n/en.json') as Record<string, string>

const rel = `src/i18n/locales/${lang}.json`
const path = join(root, rel)
const old: LocaleFile = existsSync(path) ? (readJson(rel) as LocaleFile) : { ui: {}, data: {} }

const ui: Record<string, string> = {}
for (const key of Object.keys(enUi)) ui[key] = old.ui?.[key] ?? ''

const data: Record<string, LocaleEntry> = {}
let stale = 0
for (const [p, text] of textPaths(characters, houses, ladder)) {
  const prev = old.data?.[p]
  // Untranslated entries just follow the current English; translated ones keep theirs (see above).
  data[p] = prev?.text ? prev : { en: text.en, text: '' }
  if (prev?.text && prev.en !== text.en) stale++
}
const dropped = Object.keys(old.data ?? {}).filter((p) => !(p in data)).length

mkdirSync(dirname(path), { recursive: true })
writeFileSync(path, JSON.stringify({ ui, data }, null, 2) + '\n')

const uiDone = Object.values(ui).filter(Boolean).length
const dataDone = Object.values(data).filter((e) => e.text).length
console.log(`${rel}`)
console.log(`  ui:   ${uiDone}/${Object.keys(ui).length} translated`)
console.log(`  data: ${dataDone}/${Object.keys(data).length} translated, ${stale} stale, ${dropped} dropped`)
