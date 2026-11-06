// Runtime constants and helpers, kept apart from schema.ts so the app bundle doesn't pull in zod.
import type { Character, Portrait, Race, Sigil } from './schema'

export const LEVELS = ['show', 'book', 'fanfic'] as const

export const HUMAN_RACES = [
  'northman',
  'ironborn',
  'andal',
  'valyrian',
  'dornish',
  'free_folk',
  'first_men',
  'dothraki',
  'free_cities',
  'ghiscari',
  'summer_islander',
  'other_essos',
] as const

export const NON_HUMAN_RACES = [
  'direwolf',
  'dragon',
  'giant',
  'child_of_the_forest',
  'other',
  'animal',
] as const

export const RACES = [...HUMAN_RACES, ...NON_HUMAN_RACES] as const

export const isNonHuman = (race: Race): boolean =>
  (NON_HUMAN_RACES as readonly string[]).includes(race)

export const allPortraits = (c: Character): Portrait[] => [{ src: c.portrait }, ...(c.extraPortraits ?? [])]

/** Coats of arms other than the primary house one (personal, orders, other houses). */
export const extraSigils = (c: Character): Sigil[] =>
  (c.sigils ?? []).filter((s) => !(s.kind === 'house' && s.house === c.house))
