import type { Character, House, I18nText, LadderStep } from './schema'

/**
 * Every translatable text in the game data under a stable path, e.g.
 * "character.jon-snow.fact.2" or "house.stark.words". Locale files for languages
 * beyond ru/en are keyed by these paths.
 */
export function* textPaths(
  characters: readonly Character[],
  houses: readonly House[],
  ladder: readonly LadderStep[],
): Generator<[path: string, text: I18nText]> {
  for (const c of characters) {
    const p = `character.${c.id}`
    yield [`${p}.name`, c.name]
    if (c.nickname) yield [`${p}.nickname`, c.nickname]
    if (c.title) yield [`${p}.title`, c.title]
    if (c.castle) yield [`${p}.castle`, c.castle]
    for (const [i, f] of c.facts.entries()) yield [`${p}.fact.${i}`, f]
    for (const [i, extra] of (c.extraPortraits ?? []).entries())
      if (extra.caption) yield [`${p}.portrait.${i}.caption`, extra.caption]
  }
  for (const h of houses) {
    const p = `house.${h.id}`
    yield [`${p}.name`, h.name]
    if (h.words) yield [`${p}.words`, h.words]
    if (h.seat) yield [`${p}.seat`, h.seat]
    if (h.sigil.description) yield [`${p}.sigil`, h.sigil.description]
  }
  for (const step of ladder) {
    const p = `result.${step.score}`
    for (const [i, cap] of step.captions.entries()) yield [`${p}.caption.${i}`, cap]
    if (step.fixedCaption) yield [`${p}.fixedCaption`, step.fixedCaption]
  }
}

/** One translated data text: the English source it was made from, and the translation. */
export interface LocaleEntry {
  en: string
  text: string
}

/** A locale file for a language beyond ru/en: src/i18n/locales/<lang>.json */
export interface LocaleFile {
  ui: Record<string, string>
  data: Record<string, LocaleEntry>
}
