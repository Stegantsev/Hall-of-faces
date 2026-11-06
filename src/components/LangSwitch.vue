<script setup lang="ts">
import { LANGS, useI18n } from '../i18n/useI18n'

const { lang, setLang } = useI18n()
</script>

<template>
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
</template>

<style scoped>
.lang {
  position: fixed;
  top: 12px;
  right: 12px;
  z-index: 10;
  display: flex;
  padding: 3px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: color-mix(in srgb, var(--surface) 90%, transparent);
  backdrop-filter: blur(6px);

  & button {
    min-width: 44px;
    min-height: 36px;
    padding: 0 10px;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: var(--muted);
    font-family: var(--font-display);
    font-size: 16px;
    letter-spacing: 0.05em;

    &.active {
      background: var(--gold);
      color: #1a140c;
    }
  }
}
</style>
