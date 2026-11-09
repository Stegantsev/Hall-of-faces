<script setup lang="ts">
import { LEVELS } from '../data/model'
import { useGame } from '../game/useGame'
import { useI18n, type MessageKey } from '../i18n/useI18n'
import { assetUrl } from '../assets'

const { t } = useI18n()
const { start } = useGame()

// Absolute URL: a relative url() inside a CSS variable resolves against the built
// stylesheet in assets/, not against the page, and would miss the image.
const backdrop = `url('${new URL(assetUrl('backgrounds/hall-of-faces.jpg'), document.baseURI).href}')`
</script>

<template>
  <section class="start" :style="{ '--start-bg': backdrop }">
    <header>
      <p class="eyebrow">{{ t('app.subtitle') }}</p>
      <h1>{{ t('app.title') }}</h1>
      <p class="rules">{{ t('start.rules') }}</p>
    </header>

    <h2 class="choose">{{ t('start.choose') }}</h2>
    <div class="levels">
      <button
        v-for="(level, i) in LEVELS"
        :key="level"
        type="button"
        class="level"
        @click="start(level)"
      >
        <span class="level__rank" aria-hidden="true">{{ '♦'.repeat(i + 1) }}</span>
        <span class="level__name">{{ t(`level.${level}` as MessageKey) }}</span>
        <span class="level__desc">{{ t(`level.${level}.desc` as MessageKey) }}</span>
      </button>
    </div>

    <a class="credits-link" href="#/credits">{{ t('start.credits') }}</a>
  </section>
</template>

<style scoped>
.start {
  display: flex;
  flex-direction: column;
  gap: 24px;
  text-align: center;

  /* Full-screen "hall of faces" backdrop, shaded so the title and buttons stay readable. */
  &::before {
    content: '';
    position: fixed;
    inset: 0;
    z-index: -1;
    background:
      linear-gradient(to bottom, rgb(19 16 13 / var(--shade-top)), rgb(19 16 13 / var(--shade-mid)) 55%, rgb(19 16 13 / 0.85)),
      var(--start-bg) center 30% / cover no-repeat;

    /* Phones see only the dark middle of the picture, so they get a lighter shade than wide screens. */
    --shade-top: 0.25;
    --shade-mid: 0.5;

    @media (min-width: 780px) {
      --shade-top: 0.45;
      --shade-mid: 0.7;
    }
  }
}

.eyebrow {
  margin-top: 0;
}

h1 {
  font-size: clamp(40px, 11vw, 60px);
  color: var(--gold);
  margin-top: 4px;
}

.rules {
  margin: 12px 0 0;
  color: var(--muted);
}

.choose {
  font-size: 24px;
  margin-top: 8px;
}

.levels {
  display: grid;
  gap: 12px;
}

.level {
  display: grid;
  grid-template-columns: 56px 1fr;
  grid-template-areas: 'rank name' 'rank desc';
  align-items: center;
  column-gap: 12px;
  padding: 16px;
  text-align: left;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  transition: border-color 0.15s, background 0.15s;

  &:hover {
    border-color: var(--gold);
    background: var(--surface-2);
  }
}

.level__rank {
  grid-area: rank;
  color: var(--gold);
  font-size: 18px;
  text-align: center;
  letter-spacing: -2px;
}

.level__name {
  grid-area: name;
  font-family: var(--font-display);
  font-size: 24px;
}

/* A quiet text link under the levels. */
.credits-link {
  align-self: center;
  margin-top: -8px;
  padding: 0 12px;
  color: var(--muted);
  font-size: 16px;
  line-height: 1.2;
}

/* Short phones (iPhone SE): tighten the spacing so all three levels fit on one screen. */
@media (max-height: 700px) {
  .start {
    gap: 16px;
  }

  /* Small enough that the longest titles (es "Salón de los Rostros", mk) stay on one line at 375px wide,
     with room to spare for Safari's slightly wider glyphs. */
  h1 {
    font-size: 34px;
  }

  /* One line in every language (ru and mk wrap at the full size). */
  .rules {
    margin-top: 8px;
    font-size: 15px;
  }

  /* A narrower rank column gives the descriptions room, so longer languages (es, pt-BR, mk) wrap less. */
  .level {
    grid-template-columns: 36px 1fr;
    column-gap: 8px;
    padding: 12px;
  }

  .level__rank {
    font-size: 16px;
  }
}

.level__desc {
  grid-area: desc;
  color: var(--muted);
  font-size: 17px;
}

/* iPhone SE in Safari with its toolbars (~550px tall) and small Androids: compact everything one step further. */
@media (max-height: 660px) {
  .start {
    gap: 10px;
    margin-top: -6px;
  }

  .levels {
    gap: 8px;
  }

  .choose {
    font-size: 22px;
    margin-top: 4px;
  }

  .level {
    padding: 8px 12px;
  }

  .level__name {
    font-size: 22px;
    line-height: 1.2;
  }

  .level__desc {
    font-size: 16px;
    line-height: 1.25;
  }
}
</style>
