// Validates the character DB, houses and the results ladder.
// Usage: pnpm validate            (real DB)
//        pnpm validate --sample   (test fixtures)
import { existsSync, readFileSync } from 'node:fs'
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

const byLevel = LEVELS.map((l) => `${l}=${characters.filter((c) => c.level === l).length}`).join(', ')
console.log(`Data: ${useSample ? 'SAMPLE' : 'real'} · ${characters.length} characters (${byLevel}) · ${houses.length} houses · ${ladder.length} ladder steps`)
for (const w of warnings) console.warn(`warn: ${w}`)
if (errors.length) {
  for (const e of errors) console.error(`error: ${e}`)
  console.error(`\n${errors.length} error(s)`)
  process.exit(1)
}
console.log('OK')
