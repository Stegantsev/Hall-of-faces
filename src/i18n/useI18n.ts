import { ref, watch } from 'vue'
import type { I18nText } from '../data/schema'
import en from './en.json'
import ru from './ru.json'

export const LANGS = ['ru', 'en'] as const
export type Lang = (typeof LANGS)[number]
export type MessageKey = keyof typeof ru

const dictionaries: Record<Lang, Record<MessageKey, string>> = { ru, en }
const STORAGE_KEY = 'got-guess-lang'

function readStored(): Lang | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v === 'ru' || v === 'en' ? v : null
  } catch {
    return null
  }
}

/** Russian if any of the browser languages is Russian, English otherwise. */
export function detectLang(languages: readonly string[] = navigator.languages ?? [navigator.language]): Lang {
  return languages.some((l) => l.toLowerCase().startsWith('ru')) ? 'ru' : 'en'
}

const lang = ref<Lang>(readStored() ?? detectLang())

watch(
  lang,
  (v) => {
    document.documentElement.lang = v
    document.title = dictionaries[v]['app.title']
  },
  { immediate: true },
)

function setLang(v: Lang) {
  lang.value = v
  try {
    localStorage.setItem(STORAGE_KEY, v)
  } catch {
    // Storage may be unavailable (private mode); the choice just won't persist.
  }
}

export function useI18n() {
  const t = (key: MessageKey, params: Record<string, string | number> = {}) =>
    dictionaries[lang.value][key].replace(/\{(\w+)\}/g, (_, k: string) => String(params[k] ?? ''))
  const tr = (text: I18nText | undefined) => (text ? text[lang.value] : '')
  return { lang, setLang, t, tr }
}
