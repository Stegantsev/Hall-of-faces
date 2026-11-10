<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { assetUrl } from '../assets'
import { characterById, characters } from '../data'
import CharacterDrawer from './CharacterDrawer.vue'
import { COLUMNS, EMPTY, NON_EMPTY, applyTable, columnByKey, optionsFor, type Filters, type Sort } from './columns'

const STORAGE_KEY = 'got-admin-table'
const defaultVisible = () => COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key)

interface Saved {
  visible: string[]
  sort: Sort | null
  filters: Filters
  search: string
}

function readSaved(): Partial<Saved> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Partial<Saved>
  } catch {
    return {}
  }
}

const saved = readSaved()
const visible = ref<string[]>((saved.visible ?? defaultVisible()).filter((k) => columnByKey.has(k)))
const sort = ref<Sort | null>(saved.sort ?? { key: 'name.ru', dir: 'asc' })
const filters = reactive<Filters>({ ...saved.filters })
const search = ref(saved.search ?? '')
const preview = ref<string | null>(null)

watch(
  [visible, sort, filters, search],
  () => {
    const data: Saved = { visible: visible.value, sort: sort.value, filters: { ...filters }, search: search.value }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      // Storage may be unavailable; the table just won't remember its state.
    }
  },
  { deep: true },
)

// Keep the original column order whatever order the checkboxes were ticked in.
const shown = computed(() => COLUMNS.filter((c) => visible.value.includes(c.key)))
const rows = computed(() => applyTable(characters, { search: search.value, filters, sort: sort.value }))
const activeFilters = computed(() => Object.values(filters).filter((f) => f?.trim()).length + (search.value.trim() ? 1 : 0))

const enumOptions = computed(() => {
  const out: Record<string, { value: string; count: number }[]> = {}
  for (const col of COLUMNS) {
    if (col.kind !== 'enum') continue
    out[col.key] = optionsFor(col, characters).map((value) => ({
      value,
      count: characters.filter((c) => String(col.get(c) ?? '') === value).length,
    }))
  }
  return out
})

function toggleSort(key: string) {
  const s = sort.value
  if (!s || s.key !== key) sort.value = { key, dir: 'asc' }
  else if (s.dir === 'asc') sort.value = { key, dir: 'desc' }
  else sort.value = null
}

function resetFilters() {
  for (const k of Object.keys(filters)) delete filters[k]
  search.value = ''
}

function setAllColumns(on: boolean) {
  visible.value = on ? COLUMNS.map((c) => c.key) : ['id']
}

const openId = ref<string | null>(null)
const opened = computed(() => (openId.value ? characterById.get(openId.value) : undefined))
// Position within the current filtered view; the card stays open even if filters hide its row.
const openIndex = computed(() => rows.value.findIndex((c) => c.id === openId.value))

function step(delta: number) {
  const list = rows.value
  if (!list.length) return
  const i = openIndex.value
  const next = i < 0 ? 0 : (i + delta + list.length) % list.length
  openId.value = list[next].id
  document.getElementById(`row-${openId.value}`)?.scrollIntoView({ block: 'nearest' })
}

const ariaSort = (key: string) =>
  sort.value?.key === key ? (sort.value.dir === 'asc' ? 'ascending' : 'descending') : 'none'
</script>

<template>
  <div class="admin">
    <header class="bar">
      <a class="back" href="#/">← К игре</a>
      <h1>Персонажи</h1>
      <span class="count">{{ rows.length }} из {{ characters.length }}</span>

      <input v-model="search" class="search" type="search" name="search" placeholder="Поиск по всем полям…" aria-label="Поиск" />

      <button v-if="activeFilters" type="button" class="chip" @click="resetFilters">
        Сбросить фильтры ({{ activeFilters }})
      </button>

      <details class="picker">
        <summary class="chip">Колонки: {{ shown.length }}/{{ COLUMNS.length }}</summary>
        <div class="picker-menu">
          <div class="picker-actions">
            <button type="button" @click="setAllColumns(true)">Все</button>
            <button type="button" @click="visible = defaultVisible()">По умолчанию</button>
            <button type="button" @click="setAllColumns(false)">Минимум</button>
          </div>
          <label v-for="col in COLUMNS" :key="col.key">
            <input v-model="visible" type="checkbox" name="columns" :value="col.key" />
            {{ col.label }}
          </label>
        </div>
      </details>
    </header>

    <div class="scroll">
      <table>
        <thead>
          <tr>
            <th v-for="col in shown" :key="col.key" :class="col.kind" :aria-sort="ariaSort(col.key)">
              <button v-if="col.kind !== 'image'" type="button" class="sort" @click="toggleSort(col.key)">
                {{ col.label }}
                <span class="arrow">{{
                  sort?.key === col.key ? (sort.dir === 'asc' ? '▲' : '▼') : ''
                }}</span>
              </button>
              <template v-else>{{ col.label }}</template>
            </th>
          </tr>
          <tr class="filters">
            <th v-for="col in shown" :key="col.key" :class="col.kind">
              <select v-if="col.kind === 'enum'" v-model="filters[col.key]" :name="`filter-${col.key}`" :aria-label="`Фильтр: ${col.label}`">
                <option :value="undefined">все</option>
                <option :value="NON_EMPTY">заполнено</option>
                <option :value="EMPTY">пусто</option>
                <option v-for="o in enumOptions[col.key]" :key="o.value" :value="o.value">
                  {{ o.value }} ({{ o.count }})
                </option>
              </select>
              <input
                v-else-if="col.kind !== 'image'"
                v-model="filters[col.key]"
                type="text"
                :name="`filter-${col.key}`"
                :placeholder="col.kind === 'number' ? '>2, <=1, 3' : 'содержит…'"
                :aria-label="`Фильтр: ${col.label}`"
                :title="`${EMPTY} — пусто, ${NON_EMPTY} — заполнено`"
              />
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in rows" :id="`row-${c.id}`" :key="c.id" :class="{ current: c.id === openId }">
            <td v-for="col in shown" :key="col.key" :class="col.kind">
              <button v-if="col.key === 'id'" type="button" class="open" @click="openId = c.id">{{ c.id }}</button>
              <button v-else-if="col.kind === 'image'" type="button" class="thumb" @click="preview = c.portrait">
                <img :src="assetUrl(c.portrait)" :alt="c.name.ru" loading="lazy" decoding="async" />
              </button>
              <a v-else-if="col.kind === 'link'" :href="String(col.get(c))" target="_blank" rel="noopener">
                {{ decodeURI(String(col.get(c))).replace(/^https:\/\/[^/]+\/(index\.php\/|wiki\/)?/, '') }}
              </a>
              <template v-else>{{ col.get(c) ?? '' }}</template>
            </td>
          </tr>
          <tr v-if="!rows.length">
            <td :colspan="shown.length" class="empty">Ничего не найдено</td>
          </tr>
        </tbody>
      </table>
    </div>

    <CharacterDrawer
      v-if="opened"
      :character="opened"
      :position="openIndex < 0 ? 'скрыт фильтром' : `${openIndex + 1} из ${rows.length}`"
      @close="openId = null"
      @step="step"
    />

    <div v-if="preview" class="overlay" @click="preview = null">
      <img :src="assetUrl(preview)" alt="" />
    </div>
  </div>
</template>

<style scoped>
.admin {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  font-family: system-ui, sans-serif;
  font-size: 14px;
  line-height: 1.35;
}

.bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);

  & h1 {
    font-size: 24px;
  }
}

.back {
  text-decoration: none;
}

.count {
  color: var(--muted);
}

.search {
  flex: 1 1 220px;
  max-width: 360px;
}

input,
select {
  min-height: 32px;
  padding: 4px 8px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--surface);
  color: var(--text);
  font: inherit;
}

.chip {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 4px 12px;
  border: 1px solid var(--gold-soft);
  border-radius: 999px;
  background: var(--surface-2);
  cursor: pointer;
  list-style: none;

  &::-webkit-details-marker {
    display: none;
  }
}

.picker {
  position: relative;
}

.picker-menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 20;
  display: grid;
  gap: 2px;
  min-width: 220px;
  max-height: 70vh;
  overflow: auto;
  padding: 8px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  box-shadow: 0 12px 40px rgb(0 0 0 / 0.5);

  & label {
    display: flex;
    gap: 8px;
    align-items: center;
    padding: 2px 4px;
    cursor: pointer;
    white-space: nowrap;
  }

  & input {
    min-height: 0;
  }
}

.picker-actions {
  display: flex;
  gap: 4px;
  margin-bottom: 6px;

  & button {
    flex: 1;
    padding: 4px 6px;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: var(--surface-2);
    font-size: 12px;
  }
}

.scroll {
  flex: 1;
  overflow: auto;
}

table {
  border-collapse: separate;
  border-spacing: 0;
  min-width: 100%;
}

th,
td {
  padding: 6px 10px;
  border-bottom: 1px solid var(--border);
  text-align: left;
  vertical-align: top;
}

td.text {
  min-width: 140px;
  max-width: 360px;
}

td.number,
th.number {
  text-align: right;
}

td.link {
  white-space: nowrap;
}

thead th {
  position: sticky;
  z-index: 1;
  background: var(--surface);
  white-space: nowrap;
}

thead tr:first-child th {
  top: 0;
}

thead tr.filters th {
  top: 33px;
  padding-top: 0;

  & input,
  & select {
    width: 100%;
    min-width: 80px;
  }

  &.number input {
    min-width: 60px;
  }
}

.sort {
  display: inline-flex;
  gap: 4px;
  padding: 2px 0;
  border: 0;
  background: none;
  font-weight: 600;

  &:hover {
    color: var(--gold);
  }
}

.arrow {
  min-width: 1em;
  color: var(--gold);
}

tbody tr:hover td,
tbody tr.current td {
  background: var(--surface-2);
}

tbody tr.current td:first-child {
  box-shadow: inset 3px 0 0 var(--gold);
}

.open {
  padding: 0;
  border: 0;
  background: none;
  color: var(--gold);
  text-align: left;
  text-decoration: underline;
  text-underline-offset: 3px;

  &:hover {
    color: var(--text);
  }
}

.thumb {
  padding: 0;
  border: 0;
  background: none;

  & img {
    width: 40px;
    aspect-ratio: var(--portrait-ratio);
    object-fit: cover;
    border-radius: 4px;
  }
}

.empty {
  padding: 32px;
  color: var(--muted);
  text-align: center;
}

.overlay {
  position: fixed;
  inset: 0;
  z-index: 30;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgb(0 0 0 / 0.8);
  cursor: zoom-out;

  & img {
    max-height: 100%;
    border-radius: var(--radius);
  }
}
</style>
