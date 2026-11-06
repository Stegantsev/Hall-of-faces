import { describe, expect, it } from 'vitest'
import type { Character } from '../data/schema'
import { EMPTY, NON_EMPTY, applyTable, columnByKey, matches } from './columns'

const make = (id: string, extra: Partial<Character> = {}): Character => ({
  id,
  level: 'show',
  race: 'northman',
  name: { ru: id, en: id },
  gender: 'm',
  facts: [{ ru: 'факт', en: 'fact' }],
  portrait: `portraits/${id}.jpg`,
  wiki: { ru: 'https://7kingdoms.ru/wiki/x', en: 'https://awoiaf.westeros.org/index.php/X' },
  ...extra,
})

const list = [
  make('arya', { house: 'stark', gender: 'f', name: { ru: 'Арья', en: 'Arya' } }),
  make('bronn', { level: 'book', name: { ru: 'Бронн', en: 'Bronn' }, facts: [1, 2, 3].map(() => ({ ru: 'ф', en: 'f' })) }),
  make('ghost', { race: 'direwolf', gender: '-', name: { ru: 'Призрак', en: 'Ghost' }, house: 'stark' }),
]
const col = (key: string) => columnByKey.get(key)!
const ids = (cs: Character[]) => cs.map((c) => c.id)

describe('matches', () => {
  it('matches text by case-insensitive substring', () => {
    expect(matches(col('name.en'), list[0], 'ry')).toBe(true)
    expect(matches(col('name.en'), list[0], 'RY')).toBe(true)
    expect(matches(col('name.en'), list[0], 'zz')).toBe(false)
  })

  it('matches enums exactly', () => {
    expect(matches(col('house'), list[0], 'stark')).toBe(true)
    expect(matches(col('house'), list[0], 'star')).toBe(false)
  })

  it('supports emptiness markers', () => {
    expect(matches(col('house'), list[1], EMPTY)).toBe(true)
    expect(matches(col('house'), list[1], NON_EMPTY)).toBe(false)
    expect(matches(col('house'), list[0], NON_EMPTY)).toBe(true)
  })

  it('supports numeric comparisons', () => {
    expect(matches(col('facts'), list[1], '3')).toBe(true)
    expect(matches(col('facts'), list[1], '>2')).toBe(true)
    expect(matches(col('facts'), list[1], '<= 2')).toBe(false)
    expect(matches(col('facts'), list[0], '<2')).toBe(true)
  })
})

describe('applyTable', () => {
  it('combines search and column filters', () => {
    expect(ids(applyTable(list, { search: 'stark', filters: {}, sort: null }))).toEqual(['arya', 'ghost'])
    expect(ids(applyTable(list, { search: 'stark', filters: { gender: 'f' }, sort: null }))).toEqual(['arya'])
  })

  it('ignores a filter reset to "all"', () => {
    expect(ids(applyTable(list, { search: 'stark', filters: { gender: undefined }, sort: null }))).toEqual(['arya', 'ghost'])
  })

  it('sorts both ways and keeps empty values last', () => {
    const asc = applyTable(list, { search: '', filters: {}, sort: { key: 'house', dir: 'asc' } })
    const desc = applyTable(list, { search: '', filters: {}, sort: { key: 'house', dir: 'desc' } })
    expect(asc.at(-1)!.id).toBe('bronn')
    expect(desc.at(-1)!.id).toBe('bronn')
    expect(ids(applyTable(list, { search: '', filters: {}, sort: { key: 'name.ru', dir: 'desc' } }))).toEqual([
      'ghost',
      'bronn',
      'arya',
    ])
  })

  it('sorts numbers numerically', () => {
    const rows = applyTable(list, { search: '', filters: {}, sort: { key: 'facts', dir: 'desc' } })
    expect(rows[0].id).toBe('bronn')
  })
})
