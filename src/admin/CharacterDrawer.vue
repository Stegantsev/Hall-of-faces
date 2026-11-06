<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import PortraitFrame from '../components/PortraitFrame.vue'
import RevealCard from '../components/RevealCard.vue'
import type { Character } from '../data/schema'
import { LANGS, useI18n } from '../i18n/useI18n'

defineProps<{ character: Character; position: string }>()
const emit = defineEmits<{ close: []; step: [delta: number] }>()

const { lang, setLang, tr } = useI18n()

function onKey(e: KeyboardEvent) {
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return
  if (e.key === 'Escape') emit('close')
  else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') emit('step', -1)
  else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') emit('step', 1)
  else return
  e.preventDefault()
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="backdrop" @click.self="emit('close')">
    <aside class="drawer" role="dialog" aria-modal="true" :aria-label="tr(character.name)">
      <header class="top">
        <code>{{ character.id }}</code>
        <span class="meta">{{ character.level }} · {{ position }}</span>
        <div class="lang" role="group" aria-label="Language">
          <button
            v-for="l in LANGS"
            :key="l"
            type="button"
            :class="{ active: l === lang }"
            :aria-pressed="l === lang"
            @click="setLang(l)"
          >
            {{ l.toUpperCase() }}
          </button>
        </div>
        <button type="button" title="Предыдущий (←)" @click="emit('step', -1)">←</button>
        <button type="button" title="Следующий (→)" @click="emit('step', 1)">→</button>
        <button type="button" title="Закрыть (Esc)" @click="emit('close')">✕</button>
      </header>

      <div class="body">
        <PortraitFrame class="portrait" :src="character.portrait" :alt="tr(character.name)" />
        <RevealCard :character="character" :portrait-index="0" />
        <details class="raw">
          <summary>JSON</summary>
          <pre>{{ JSON.stringify(character, null, 2) }}</pre>
        </details>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 25;
  background: rgb(0 0 0 / 0.55);
}

.drawer {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  width: min(560px, 100%);
  background: var(--bg);
  border-left: 1px solid var(--border);
  box-shadow: -12px 0 40px rgb(0 0 0 / 0.5);
  font-family: var(--font-body);
  font-size: 19px;
}

.top {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--border);
  font-family: system-ui, sans-serif;
  font-size: 14px;

  & > button {
    min-width: 32px;
    min-height: 32px;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: var(--surface-2);
  }
}

.meta {
  flex: 1;
  color: var(--muted);
}

.lang {
  display: flex;
  padding: 2px;
  border: 1px solid var(--border);
  border-radius: 999px;

  & button {
    padding: 2px 10px;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: var(--muted);

    &.active {
      background: var(--gold);
      color: #1a140c;
    }
  }
}

.body {
  display: grid;
  gap: 16px;
  padding: 16px;
  overflow-y: auto;
}

.portrait {
  width: min(280px, 70%);
  justify-self: center;
}

.raw {
  font-family: system-ui, sans-serif;
  font-size: 13px;

  & summary {
    cursor: pointer;
    color: var(--muted);
  }

  & pre {
    overflow-x: auto;
    padding: 12px;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: var(--surface);
  }
}
</style>
