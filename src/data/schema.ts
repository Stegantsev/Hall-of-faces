import { z } from 'zod'

import { LEVELS, RACES } from './model'

export { LEVELS, RACES }

// Paths are relative to public/, without a leading slash: "portraits/arya-stark.jpg"
const assetPath = z
  .string()
  .regex(/^(portraits|sigils|placeholders)\/[^/].*\.(jpe?g|png|webp|gif|svg)$/i, 'asset path like "portraits/<id>.<ext>"')

const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'kebab-case latin slug')

export const i18nText = z.object({
  ru: z.string().min(1),
  en: z.string().min(1),
})

export const portraitSchema = z.object({
  src: assetPath,
  caption: i18nText.optional(),
})

export const sigilSchema = z.object({
  kind: z.enum(['house', 'personal', 'affiliation', 'unknown']),
  image: assetPath,
  house: slug.optional(),
})

export const characterSchema = z.object({
  id: slug,
  level: z.enum(LEVELS),
  race: z.enum(RACES),
  name: i18nText,
  nickname: i18nText.optional(),
  title: i18nText.optional(),
  gender: z.enum(['m', 'f', '-']),
  house: slug.optional(),
  serves: slug.optional(),
  castle: i18nText.optional(),
  facts: z.array(i18nText).min(1).max(10),
  // Main illustration; shown first.
  portrait: assetPath,
  // Other illustrations of the same character at different moments of their life.
  extraPortraits: z.array(portraitSchema).optional(),
  // All coats of arms from the infobox; `house` stays the primary one.
  sigils: z.array(sigilSchema).min(1).optional(),
  // TV series the character appeared in; not used by the game yet.
  screen: z.array(z.enum(['got', 'hotd'])).min(1).optional(),
  wiki: z.object({
    ru: z.string().startsWith('https://7kingdoms.ru/'),
    en: z.string().startsWith('https://awoiaf.westeros.org/'),
  }),
})

export const houseSchema = z.object({
  id: slug,
  name: i18nText,
  words: i18nText.optional(),
  sigil: z.object({
    description: i18nText.optional(),
    image: assetPath.optional(),
  }),
  seat: i18nText.optional(),
})

export const ladderStepSchema = z.object({
  score: z.number().int().min(0),
  characterId: slug,
  // One of these is picked at random; fixedCaption, if set, always wins.
  captions: z.array(i18nText).min(1),
  fixedCaption: i18nText.optional(),
})

export const charactersFile = z.array(characterSchema)
export const housesFile = z.array(houseSchema)
export const ladderFile = z.array(ladderStepSchema)

export type Level = (typeof LEVELS)[number]
export type Race = (typeof RACES)[number]
export type I18nText = z.infer<typeof i18nText>
export type Portrait = z.infer<typeof portraitSchema>
export type Sigil = z.infer<typeof sigilSchema>
export type Character = z.infer<typeof characterSchema>
export type House = z.infer<typeof houseSchema>
export type LadderStep = z.infer<typeof ladderStepSchema>
