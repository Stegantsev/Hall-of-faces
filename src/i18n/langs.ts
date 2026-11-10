import type { I18nText } from '../data/schema'

export const LANGS = ['en', 'ru', 'mk', 'es', 'pt-BR', 'de', 'fr', 'it', 'pl'] as const
export type Lang = (typeof LANGS)[number]

/** Languages written straight into the game data as `{ ru, en }`; the rest live in locales/<lang>.json. */
export type BaseLang = keyof I18nText
export const BASE_LANGS: readonly BaseLang[] = ['ru', 'en']

/** Each language's name in that language, for the switcher. */
export const LANG_NAMES: Record<Lang, string> = {
  en: 'English',
  ru: 'Русский',
  mk: 'Македонски',
  es: 'Español',
  'pt-BR': 'Português (Brasil)',
  de: 'Deutsch',
  fr: 'Français',
  it: 'Italiano',
  pl: 'Polski',
}

export function isLang(v: unknown): v is Lang {
  return (LANGS as readonly unknown[]).includes(v)
}

export function isBaseLang(v: Lang): v is BaseLang {
  return (BASE_LANGS as readonly string[]).includes(v)
}

/** Fan wikis the game links to, by host: the full name (Credits), a short one for buttons, the home page. */
export const WIKIS: Record<string, { name: string; short?: string; home: string }> = {
  '7kingdoms.ru': { name: '7kingdoms.ru', home: 'https://7kingdoms.ru' },
  'awoiaf.westeros.org': { name: 'A Wiki of Ice and Fire', short: 'AWOIAF', home: 'https://awoiaf.westeros.org' },
  'hieloyfuego.fandom.com': { name: 'Hielo y Fuego', home: 'https://hieloyfuego.fandom.com' },
  'wiki.geloefogo.com': { name: 'Gelo e Fogo', home: 'https://wiki.geloefogo.com' },
  'iltronodispade.fandom.com': { name: 'Il Trono di Spade Wiki', home: 'https://iltronodispade.fandom.com/it/wiki/' },
  'gameofthrones.fandom.com': { name: 'Gra o tron Wiki', home: 'https://gameofthrones.fandom.com/pl/wiki/' },
  'eisundfeuer.fandom.com': { name: 'Das Lied von Eis und Feuer Wiki', short: 'Eis und Feuer Wiki', home: 'https://eisundfeuer.fandom.com/de/wiki/' },
}

/**
 * A language's own wiki, if it has one: character links for it live in src/i18n/wiki/<lang>.json
 * (characters without a page there link to the English wiki).
 */
export const LANG_WIKI: Partial<Record<Lang, string>> = {
  es: 'hieloyfuego.fandom.com',
  'pt-BR': 'wiki.geloefogo.com',
  de: 'eisundfeuer.fandom.com',
  it: 'iltronodispade.fandom.com',
  pl: 'gameofthrones.fandom.com',
}

/** The wiki's short name for a link, e.g. "AWOIAF" or "Hielo y Fuego"; the bare host for unknown sites. */
export function wikiName(url: string): string {
  const host = new URL(url).host
  const w = WIKIS[host]
  return w ? (w.short ?? w.name) : host
}
