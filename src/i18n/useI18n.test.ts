import { describe, expect, it, vi } from 'vitest'

// useI18n sets the page lang and title at import time; tests run in Node, so give it a
// minimal stand-in. Vue must load first: it would mistake the stand-in for a real DOM.
await import('vue')
vi.stubGlobal('document', { documentElement: {}, title: '' })
vi.stubGlobal('navigator', { languages: ['en'], language: 'en' })

const { detectLang } = await import('./useI18n')
const { default: en } = await import('./en.json')

describe('detectLang', () => {
  it('takes the first browser language the game supports', () => {
    expect(detectLang(['en-US', 'ru'])).toBe('en')
    expect(detectLang(['ru-RU', 'en'])).toBe('ru')
  })

  it('skips unsupported languages and follows the user order', () => {
    expect(detectLang(['uk', 'ru', 'en'])).toBe('ru')
    expect(detectLang(['ja', 'en-GB', 'ru'])).toBe('en')
  })

  it('falls back to another regional variant of the same language', () => {
    expect(detectLang(['pt-BR'])).toBe('pt-BR')
    expect(detectLang(['pt-PT', 'en'])).toBe('pt-BR')
    expect(detectLang(['pt'])).toBe('pt-BR')
  })

  it('matches a regional tag by its base language', () => {
    expect(detectLang(['ru-UA'])).toBe('ru')
    expect(detectLang(['EN-au'])).toBe('en')
  })

  it('falls back to English', () => {
    expect(detectLang(['ja'])).toBe('en')
    expect(detectLang([])).toBe('en')
  })
})

describe('languages from locale files', async () => {
  const { applyLocale, useI18n } = await import('./useI18n')
  const { characters } = await import('../data')
  const jon = characters.find((c) => c.id === 'jon-snow')!

  it('shows translations, falling back to English for missing and stale ones', async () => {
    applyLocale('mk', {
      ui: { 'app.title': 'Сала на ликови', 'start.choose': '' },
      data: {
        'character.jon-snow.name': { en: jon.name.en, text: 'Џон Снег' },
        'character.jon-snow.fact.0': { en: 'an older English text', text: 'застарен превод' },
      },
    })
    const { setLang, t, tr, link } = useI18n()
    await setLang('mk')

    expect(t('app.title')).toBe('Сала на ликови')
    expect(t('start.choose')).toBe(en['start.choose'])
    expect(tr(jon.name)).toBe('Џон Снег')
    expect(tr(jon.facts[0])).toBe(jon.facts[0].en)
    expect(link(jon.wiki)).toBe(jon.wiki.en)

    await setLang('ru')
    expect(tr(jon.name)).toBe(jon.name.ru)
    expect(link(jon.wiki)).toBe(jon.wiki.ru)
  })

  it('links to the language own wiki when it has the page, to the English wiki otherwise', async () => {
    const page = 'https://hieloyfuego.fandom.com/wiki/Jon_Nieve'
    applyLocale('es', { ui: {}, data: {} }, { 'jon-snow': page })
    const arya = characters.find((c) => c.id === 'arya-stark')!
    const { setLang, link, wikiName } = useI18n()

    await setLang('es')
    expect(link(jon.wiki)).toBe(page)
    expect(wikiName(link(jon.wiki))).toBe('Hielo y Fuego')
    expect(link(arya.wiki)).toBe(arya.wiki.en)
    expect(wikiName(link(arya.wiki))).toBe('AWOIAF')

    await setLang('ru')
    expect(wikiName(link(jon.wiki))).toBe('7kingdoms.ru')
  })
})
