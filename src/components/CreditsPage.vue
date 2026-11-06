<script setup lang="ts">
import { version } from '../../package.json'
import { useI18n } from '../i18n/useI18n'

const { t } = useI18n()

// Hidden admin entrance, like Android's "tap build number" developer mode:
// seven quick taps on the version open the admin table.
const TAPS_TO_ADMIN = 7
const MAX_TAP_GAP_MS = 1500
let taps = 0
let lastTap = 0

function onVersionTap() {
  const now = Date.now()
  taps = now - lastTap > MAX_TAP_GAP_MS ? 1 : taps + 1
  lastTap = now
  if (taps >= TAPS_TO_ADMIN) {
    taps = 0
    location.hash = '#/admin'
  }
}
</script>

<template>
  <article class="credits">
    <a class="back" href="#/">← {{ t('credits.back') }}</a>

    <header>
      <p class="eyebrow">{{ t('app.subtitle') }}</p>
      <h1>{{ t('app.title') }}</h1>
    </header>

    <section>
      <h2>{{ t('credits.about') }}</h2>
      <p v-for="(para, i) in t('credits.aboutText').split('\n\n')" :key="i">{{ para }}</p>
    </section>

    <section>
      <h2>{{ t('credits.art') }}</h2>
      <p>
        {{ t('credits.artText') }}
        <a href="https://www.instagram.com/txemico/" target="_blank" rel="noopener">@txemico</a>
      </p>
      <p class="note">{{ t('credits.artRights') }}</p>
    </section>

    <section>
      <h2>{{ t('credits.sources') }}</h2>
      <p>{{ t('credits.sourcesText') }}</p>
      <ul>
        <li><a href="https://7kingdoms.ru" target="_blank" rel="noopener">7kingdoms.ru</a></li>
        <li>
          <a href="https://awoiaf.westeros.org" target="_blank" rel="noopener">A Wiki of Ice and Fire</a>
        </li>
      </ul>
    </section>

    <p class="note">{{ t('credits.disclaimer') }}</p>

    <footer>
      <span class="version" @click="onVersionTap">v{{ version }}</span>
    </footer>
  </article>
</template>

<style scoped>
.credits {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.back {
  align-self: flex-start;
  text-decoration: none;
}

header {
  text-align: center;
}

h1 {
  font-size: clamp(36px, 10vw, 52px);
  color: var(--gold);
  margin-top: 4px;
}

h2 {
  font-size: 24px;
  color: var(--gold);
}

p {
  margin: 8px 0 0;
}

ul {
  margin: 8px 0 0;
  padding-left: 20px;
}

.note {
  color: var(--muted);
  font-size: 16px;
}

footer {
  text-align: center;
}

.version {
  color: var(--muted);
  font-size: 15px;
  letter-spacing: 0.05em;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}
</style>
