import { ref, watch } from 'vue'
import { characters, houses, ladder } from '../data'
import type { I18nText } from '../data/schema'
import { textPaths, type LocaleFile } from '../data/textPaths'
import en from './en.json'
import { isBaseLang, isLang, LANG_WIKI, LANGS, WIKIS, wikiName, type BaseLang, type Lang } from './langs'
import ru from './ru.json'

export { LANG_NAMES, LANGS, type Lang } from './langs'

export type MessageKey = keyof typeof ru
type Dictionary = Record<MessageKey, string>

// Other languages live in locales/<lang>.json and are fetched only when picked.
// Anything missing there falls back to English.
const localeLoaders = import.meta.glob<LocaleFile>('./locales/*.json', { import: 'default' })
// Character pages on the language's own wiki: { "<character id>": "<url>" }.
const wikiLoaders = import.meta.glob<Record<string, string>>('./wiki/*.json', { import: 'default' })
const dictionaries: Partial<Record<Lang, Dictionary>> = { ru, en }
const dataTexts = new Map<Lang, WeakMap<I18nText, string>>()
type WikiUrls = Record<BaseLang, string>
const wikiLinks = new Map<Lang, WeakMap<WikiUrls, string>>()
const loading = new Map<Lang, Promise<void>>()

/** Exported for tests; the game goes through loadLang. */
export function applyLocale(l: Lang, file: LocaleFile, wiki: Record<string, string> = {}) {
  const ui = Object.fromEntries(Object.entries(file.ui).filter(([, v]) => v))
  dictionaries[l] = { ...en, ...ui }
  const texts = new WeakMap<I18nText, string>()
  for (const [path, text] of textPaths(characters, houses, ladder)) {
    const entry = file.data[path]
    // A translation made from an older English text is stale: show English until it is redone.
    if (entry?.text && entry.en === text.en) texts.set(text, entry.text)
  }
  dataTexts.set(l, texts)
  const links = new WeakMap<WikiUrls, string>()
  for (const c of characters) if (wiki[c.id]) links.set(c.wiki, wiki[c.id])
  wikiLinks.set(l, links)
}

/** Fetches a language's locale file once; ru and en are always there. */
export function loadLang(l: Lang): Promise<void> {
  if (dictionaries[l]) return Promise.resolve()
  let p = loading.get(l)
  if (!p) {
    const loadFile = localeLoaders[`./locales/${l}.json`]
    const loadWiki = wikiLoaders[`./wiki/${l}.json`]
    p = Promise.all([
      loadFile ? loadFile() : { ui: {}, data: {} },
      loadWiki ? loadWiki() : {},
    ]).then(([file, wiki]) => applyLocale(l, file, wiki))
    p.catch(() => loading.delete(l))
    loading.set(l, p)
  }
  return p
}

const STORAGE_KEY = 'got-guess-lang'

function readStored(): Lang | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return isLang(v) ? v : null
  } catch {
    return null
  }
}

/**
 * The first browser language we support, matched by exact tag ("pt-br"), by its base
 * language ("de-AT" -> "de"), or by a regional variant of it ("pt-PT" -> "pt-BR");
 * English if none match.
 */
export function detectLang(languages: readonly string[] = navigator.languages ?? [navigator.language]): Lang {
  const base = (tag: string) => tag.toLowerCase().split('-')[0]
  for (const raw of languages) {
    const tag = raw.toLowerCase()
    const match =
      LANGS.find((l) => l.toLowerCase() === tag) ??
      LANGS.find((l) => l.toLowerCase() === base(tag)) ??
      LANGS.find((l) => base(l) === base(tag))
    if (match) return match
  }
  return 'en'
}

const initial = readStored() ?? detectLang()
// Starts in English if the chosen language still has to be fetched; main.ts waits for it before mounting.
const lang = ref<Lang>(dictionaries[initial] ? initial : 'en')
export const i18nReady: Promise<void> = loadLang(initial).then(
  () => {
    lang.value = initial
  },
  () => {},
)

const dict = (l: Lang): Dictionary => dictionaries[l] ?? en

watch(
  lang,
  (v) => {
    document.documentElement.lang = v
    document.title = dict(v)['app.title']
  },
  { immediate: true },
)

async function setLang(v: Lang) {
  try {
    await loadLang(v)
  } catch {
    return // Offline and not cached yet: stay on the current language.
  }
  lang.value = v
  try {
    localStorage.setItem(STORAGE_KEY, v)
  } catch {
    // Storage may be unavailable (private mode); the choice just won't persist.
  }
}

export function useI18n() {
  const t = (key: MessageKey, params: Record<string, string | number> = {}) =>
    dict(lang.value)[key].replace(/\{(\w+)\}/g, (_, k: string) => String(params[k] ?? ''))
  const tr = (text: I18nText | undefined) => {
    if (!text) return ''
    const l = lang.value
    return isBaseLang(l) ? text[l] : (dataTexts.get(l)?.get(text) ?? text.en)
  }
  /** The character's wiki page in the current language: its own wiki if it has one, else the English wiki. */
  const link = (urls: WikiUrls) => {
    const l = lang.value
    return isBaseLang(l) ? urls[l] : (wikiLinks.get(l)?.get(urls) ?? urls.en)
  }
  /** Wikis to credit on the Credits page: the two the data comes from, plus the language's own. */
  const wikis = () => {
    const own = LANG_WIKI[lang.value]
    return [WIKIS['7kingdoms.ru'], WIKIS['awoiaf.westeros.org'], ...(own ? [WIKIS[own]] : [])]
  }
  return { lang, setLang, t, tr, link, wikiName, wikis }
}
