<script setup lang="ts">
import { LANG_NAMES, LANGS, useI18n, type Lang } from '../i18n/useI18n'

const { lang, setLang } = useI18n()

function onChange(e: Event) {
  setLang((e.target as HTMLSelectElement).value as Lang)
}
</script>

<template>
  <!-- A native select stretched invisibly over the pill: the OS picker opens on tap
       (good on phones and for screen readers), while the pill shows only the language code. -->
  <label class="lang">
    <span class="face" aria-hidden="true">
      <span class="code">{{ lang.toUpperCase() }}</span>
      <span class="caret">▾</span>
    </span>
    <select :value="lang" aria-label="Language" @change="onChange">
      <option v-for="l in LANGS" :key="l" :value="l" :lang="l">{{ LANG_NAMES[l] }}</option>
    </select>
  </label>
</template>

<style scoped>
.lang {
  position: fixed;
  top: 12px;
  right: 12px;
  z-index: 10;
  display: block;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: color-mix(in srgb, var(--surface) 90%, transparent);
  backdrop-filter: blur(6px);

  &:focus-within {
    outline: 2px solid var(--gold);
    outline-offset: 2px;
  }

  & .face {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 44px;
    min-height: 42px;
    padding: 0 14px;
    color: var(--muted);
  }

  & .code {
    font-family: var(--font-display);
    font-size: 16px;
    letter-spacing: 0.05em;
    color: var(--gold);
  }

  & .caret {
    font-size: 12px;
  }

  & select {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
    font-size: 16px; /* keeps iOS from zooming in on focus */
  }
}
</style>
