import type { Character } from '../data/schema'
import { RACES, LEVELS } from '../data/model'

export type ColumnKind = 'text' | 'enum' | 'number' | 'image' | 'link'

export interface Column {
  key: string
  label: string
  kind: ColumnKind
  /** Value used for display, sorting and filtering; undefined means "empty". */
  get: (c: Character) => string | number | undefined
  /** Fixed set of filter options for enum columns; derived from data when omitted. */
  options?: readonly string[]
  defaultVisible?: boolean
}

const join = (list: readonly string[] | undefined) => (list?.length ? list.join(', ') : undefined)

export const COLUMNS: Column[] = [
  { key: 'portrait', label: 'Портрет', kind: 'image', get: (c) => c.portrait, defaultVisible: true },
  { key: 'id', label: 'ID', kind: 'text', get: (c) => c.id, defaultVisible: true },
  { key: 'name.ru', label: 'Имя (RU)', kind: 'text', get: (c) => c.name.ru, defaultVisible: true },
  { key: 'name.en', label: 'Имя (EN)', kind: 'text', get: (c) => c.name.en, defaultVisible: true },
  { key: 'level', label: 'Уровень', kind: 'enum', get: (c) => c.level, options: LEVELS, defaultVisible: true },
  { key: 'race', label: 'Народ', kind: 'enum', get: (c) => c.race, options: RACES, defaultVisible: true },
  { key: 'gender', label: 'Пол', kind: 'enum', get: (c) => c.gender, options: ['m', 'f', '-'], defaultVisible: true },
  { key: 'house', label: 'Дом', kind: 'enum', get: (c) => c.house, defaultVisible: true },
  { key: 'serves', label: 'Служит', kind: 'enum', get: (c) => c.serves },
  { key: 'castle.ru', label: 'Замок (RU)', kind: 'text', get: (c) => c.castle?.ru },
  { key: 'castle.en', label: 'Замок (EN)', kind: 'text', get: (c) => c.castle?.en },
  { key: 'nickname.ru', label: 'Прозвища (RU)', kind: 'text', get: (c) => c.nickname?.ru },
  { key: 'nickname.en', label: 'Прозвища (EN)', kind: 'text', get: (c) => c.nickname?.en },
  { key: 'title.ru', label: 'Титул (RU)', kind: 'text', get: (c) => c.title?.ru },
  { key: 'title.en', label: 'Титул (EN)', kind: 'text', get: (c) => c.title?.en },
  { key: 'screen', label: 'Сериалы', kind: 'enum', get: (c) => join(c.screen) },
  { key: 'facts', label: 'Фактов', kind: 'number', get: (c) => c.facts.length, defaultVisible: true },
  { key: 'facts.ru', label: 'Факты (RU)', kind: 'text', get: (c) => c.facts.map((f) => f.ru).join(' · ') },
  { key: 'facts.en', label: 'Факты (EN)', kind: 'text', get: (c) => c.facts.map((f) => f.en).join(' · ') },
  { key: 'extraPortraits', label: 'Доп. портретов', kind: 'number', get: (c) => c.extraPortraits?.length ?? 0 },
  { key: 'sigils', label: 'Гербов', kind: 'number', get: (c) => c.sigils?.length ?? 0 },
  { key: 'sigilKinds', label: 'Виды гербов', kind: 'enum', get: (c) => join([...new Set(c.sigils?.map((s) => s.kind))]) },
  { key: 'wiki.ru', label: 'Вики (RU)', kind: 'link', get: (c) => c.wiki.ru },
  { key: 'wiki.en', label: 'Вики (EN)', kind: 'link', get: (c) => c.wiki.en },
]

export const columnByKey = new Map(COLUMNS.map((c) => [c.key, c]))

/** Filter value meaning "the field is empty". */
export const EMPTY = '∅'
/** Filter value meaning "the field has any value". */
export const NON_EMPTY = '*'

/** A filter reset to "all" in a <select> is `undefined`, not deleted. */
export type Filters = Record<string, string | undefined>
export interface Sort {
  key: string
  dir: 'asc' | 'desc'
}

const isEmpty = (v: string | number | undefined) => v === undefined || v === ''

/**
 * Text columns match by substring (case-insensitive), enum columns by exact value,
 * number columns accept "3", ">2", "<=1" and the like. `∅` / `*` test for emptiness.
 */
export function matches(col: Column, c: Character, filter: string): boolean {
  const f = filter.trim()
  if (!f) return true
  const v = col.get(c)
  if (f === EMPTY) return isEmpty(v)
  if (f === NON_EMPTY) return !isEmpty(v)
  if (isEmpty(v)) return false
  if (col.kind === 'enum') return String(v) === f
  if (col.kind === 'number') {
    const m = /^(<=|>=|<|>|=)?\s*(-?\d+)$/.exec(f)
    if (!m) return true
    const n = Number(v)
    const x = Number(m[2])
    switch (m[1]) {
      case '<': return n < x
      case '<=': return n <= x
      case '>': return n > x
      case '>=': return n >= x
      default: return n === x
    }
  }
  return String(v).toLowerCase().includes(f.toLowerCase())
}

const collator = new Intl.Collator(['ru', 'en'], { numeric: true, sensitivity: 'base' })

export function compare(col: Column, a: Character, b: Character): number {
  const va = col.get(a)
  const vb = col.get(b)
  // Empty values always go last, regardless of direction (handled by the caller).
  if (isEmpty(va) || isEmpty(vb)) return isEmpty(va) === isEmpty(vb) ? 0 : isEmpty(va) ? 1 : -1
  if (typeof va === 'number' && typeof vb === 'number') return va - vb
  return collator.compare(String(va), String(vb))
}

export function applyTable(
  list: readonly Character[],
  { search, filters, sort }: { search: string; filters: Filters; sort: Sort | null },
): Character[] {
  const q = search.trim().toLowerCase()
  const searchable = COLUMNS.filter((c) => c.kind === 'text' || c.kind === 'enum')
  const active = Object.entries(filters)
    .map(([key, f]) => [columnByKey.get(key), f] as const)
    .filter((e): e is readonly [Column, string] => !!e[0] && !!e[1]?.trim())

  const rows = list.filter(
    (c) =>
      (!q || searchable.some((col) => String(col.get(c) ?? '').toLowerCase().includes(q))) &&
      active.every(([col, f]) => matches(col, c, f)),
  )

  const sortCol = sort && columnByKey.get(sort.key)
  if (sortCol && sort) {
    const sign = sort.dir === 'asc' ? 1 : -1
    rows.sort((a, b) => {
      const ea = isEmpty(sortCol.get(a))
      const eb = isEmpty(sortCol.get(b))
      if (ea || eb) return compare(sortCol, a, b)
      return sign * compare(sortCol, a, b)
    })
  }
  return rows
}

/** Distinct non-empty values of a column, for enum filter dropdowns. */
export function optionsFor(col: Column, list: readonly Character[]): string[] {
  if (col.options) return [...col.options]
  const set = new Set<string>()
  for (const c of list) {
    const v = col.get(c)
    if (!isEmpty(v)) set.add(String(v))
  }
  return [...set].sort((a, b) => collator.compare(a, b))
}
