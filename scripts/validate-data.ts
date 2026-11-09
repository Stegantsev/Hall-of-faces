// Validates the character DB, houses and the results ladder.
// Usage: pnpm validate            (real DB)
//        pnpm validate --sample   (test fixtures)
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { z } from 'zod'
import { LEVELS, allPortraits } from '../src/data/model'
import {
  charactersFile,
  housesFile,
  ladderFile,
  type Character,
  type House,
} from '../src/data/schema'
import { textPaths, type LocaleFile } from '../src/data/textPaths'
import { BASE_LANGS, LANG_WIKI, LANGS, type Lang } from '../src/i18n/langs'

const root = join(import.meta.dirname, '..')
const dataDir = join(root, 'src/data')
const publicDir = join(root, 'public')
const MIN_PER_LEVEL = 10
const MAX_SCORE = 30

const errors: string[] = []
const warnings: string[] = []

const useSample = process.argv.includes('--sample')
const charactersPath = join(dataDir, useSample ? 'characters.sample.json' : 'characters.json')
const housesPath = join(dataDir, useSample ? 'houses.sample.json' : 'houses.json')

function load<T>(path: string, schema: z.ZodType<T>): T | undefined {
  if (!existsSync(path)) {
    errors.push(`${path}: file not found`)
    return undefined
  }
  let raw: unknown
  try {
    raw = JSON.parse(readFileSync(path, 'utf8'))
  } catch (e) {
    errors.push(`${path}: invalid JSON (${(e as Error).message})`)
    return undefined
  }
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    for (const issue of parsed.error.issues.slice(0, 50)) {
      const at = issue.path.join('.')
      const index = typeof issue.path[0] === 'number' ? issue.path[0] : undefined
      const id = index !== undefined ? (raw as { id?: string }[])[index]?.id : undefined
      errors.push(`${path.replace(root + '/', '')}: ${id ? `[${id}] ` : ''}${at}: ${issue.message}`)
    }
    return undefined
  }
  return parsed.data
}

function checkFile(owner: string, rel: string) {
  if (!existsSync(join(publicDir, rel))) errors.push(`${owner}: missing file public/${rel}`)
}

function uniqueIds(kind: string, items: { id: string }[]) {
  const seen = new Set<string>()
  for (const { id } of items) {
    if (seen.has(id)) errors.push(`${kind}: duplicate id "${id}"`)
    seen.add(id)
  }
}

const characters: Character[] = load(charactersPath, charactersFile) ?? []
const houses: House[] = load(housesPath, housesFile) ?? []
const ladder = load(join(dataDir, 'results.json'), ladderFile) ?? []

uniqueIds('characters', characters)
uniqueIds('houses', houses)
const characterIds = new Set(characters.map((c) => c.id))
const houseIds = new Set(houses.map((h) => h.id))

for (const c of characters) {
  for (const p of allPortraits(c)) checkFile(c.id, p.src)
  for (const s of c.sigils ?? []) {
    checkFile(c.id, s.image)
    if (s.house && !houseIds.has(s.house)) errors.push(`${c.id}: sigil house "${s.house}" not in houses`)
  }
  if (c.house && !houseIds.has(c.house)) errors.push(`${c.id}: house "${c.house}" not in houses`)
  if (c.serves && !houseIds.has(c.serves) && !characterIds.has(c.serves))
    errors.push(`${c.id}: serves "${c.serves}" is neither a house nor a character`)
}
for (const h of houses) if (h.sigil.image) checkFile(`house ${h.id}`, h.sigil.image)

for (const level of LEVELS) {
  const n = characters.filter((c) => c.level === level).length
  if (n < MIN_PER_LEVEL) errors.push(`level "${level}": ${n} characters, need at least ${MIN_PER_LEVEL}`)
}

const scores = ladder.map((s) => s.score).sort((a, b) => a - b)
for (let s = 0; s <= MAX_SCORE; s++) {
  const n = scores.filter((x) => x === s).length
  if (n !== 1) errors.push(`results.json: score ${s} has ${n} steps, need exactly 1`)
}
for (const step of ladder)
  if (!characterIds.has(step.characterId))
    errors.push(`results.json: score ${step.score} → "${step.characterId}" not in characters`)

const referenced = new Set(
  characters.flatMap((c) => [c.house, c.serves, ...(c.sigils ?? []).map((s) => s.house)]).filter(Boolean),
)
for (const h of houses) if (!referenced.has(h.id)) warnings.push(`house "${h.id}" is not referenced by anyone`)

// Locale files for languages beyond ru/en (src/i18n/locales/<lang>.json, see pnpm locale:sync).
// Only checked against the real DB: their paths point at real character ids.
const localeNotes: string[] = []
if (!useSample) {
  const localesDir = join(root, 'src/i18n/locales')
  const files = existsSync(localesDir) ? readdirSync(localesDir).filter((f) => f.endsWith('.json')) : []
  const enUi = JSON.parse(readFileSync(join(root, 'src/i18n/en.json'), 'utf8')) as Record<string, string>
  const sourceEn = new Map([...textPaths(characters, houses, ladder)].map(([p, t]) => [p, t.en]))
  for (const l of LANGS)
    if (!(BASE_LANGS as readonly string[]).includes(l) && !files.includes(`${l}.json`))
      warnings.push(`lang "${l}": no src/i18n/locales/${l}.json, everything shows in English (run pnpm locale:sync ${l})`)
  for (const f of files) {
    const l = f.replace(/\.json$/, '')
    const at = `src/i18n/locales/${f}`
    if (!(LANGS as readonly string[]).includes(l)) errors.push(`${at}: "${l}" is not in LANGS (src/i18n/langs.ts)`)
    const file = JSON.parse(readFileSync(join(localesDir, f), 'utf8')) as LocaleFile
    for (const key of Object.keys(file.ui ?? {})) if (!(key in enUi)) errors.push(`${at}: ui key "${key}" not in en.json`)
    const stale: string[] = []
    for (const [p, e] of Object.entries(file.data ?? {})) {
      const en = sourceEn.get(p)
      if (en === undefined) errors.push(`${at}: "${p}" is not a data text (run pnpm locale:sync ${l})`)
      else if (e.text && e.en !== en) stale.push(p)
    }
    for (const p of stale.slice(0, 20)) warnings.push(`${at}: "${p}" was translated from an older English text`)
    if (stale.length > 20) warnings.push(`${at}: …and ${stale.length - 20} more stale translations`)
    const uiDone = Object.keys(enUi).filter((k) => file.ui?.[k]).length
    const dataDone = [...sourceEn.keys()].filter((p) => file.data?.[p]?.text && file.data[p].en === sourceEn.get(p)).length
    localeNotes.push(`${l}: ui ${uiDone}/${Object.keys(enUi).length}, data ${dataDone}/${sourceEn.size}`)
  }

  // Character links to a language's own wiki: src/i18n/wiki/<lang>.json, { "<character id>": "<url>" }.
  const wikiDir = join(root, 'src/i18n/wiki')
  const wikiFiles = existsSync(wikiDir) ? readdirSync(wikiDir).filter((f) => f.endsWith('.json')) : []
  for (const f of wikiFiles) {
    const l = f.replace(/\.json$/, '')
    const at = `src/i18n/wiki/${f}`
    const host = LANG_WIKI[l as Lang]
    if (!host) {
      errors.push(`${at}: "${l}" has no LANG_WIKI entry (src/i18n/langs.ts)`)
      continue
    }
    const links = JSON.parse(readFileSync(join(wikiDir, f), 'utf8')) as Record<string, string>
    for (const [id, url] of Object.entries(links)) {
      if (!characterIds.has(id)) errors.push(`${at}: "${id}" is not a character`)
      if (!url.startsWith(`https://${host}/`)) errors.push(`${at}: [${id}] ${url} is not on ${host}`)
    }
    const i = localeNotes.findIndex((n) => n.startsWith(`${l}:`))
    const note = `wiki ${Object.keys(links).length}/${characters.length}`
    if (i >= 0) localeNotes[i] += `, ${note}`
    else localeNotes.push(`${l}: ${note}`)
  }
}

const byLevel = LEVELS.map((l) => `${l}=${characters.filter((c) => c.level === l).length}`).join(', ')
console.log(`Data: ${useSample ? 'SAMPLE' : 'real'} · ${characters.length} characters (${byLevel}) · ${houses.length} houses · ${ladder.length} ladder steps`)
if (localeNotes.length) console.log(`Locales: ${localeNotes.join(' · ')}`)
for (const w of warnings) console.warn(`warn: ${w}`)
if (errors.length) {
  for (const e of errors) console.error(`error: ${e}`)
  console.error(`\n${errors.length} error(s)`)
  process.exit(1)
}
console.log('OK')
