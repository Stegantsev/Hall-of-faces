<script setup lang="ts">
import { computed } from 'vue'
import { assetUrl } from '../assets'
import { characterById } from '../data'
import { allPortraits } from '../data/model'
import { useGame } from '../game/useGame'
import { useI18n } from '../i18n/useI18n'
import PortraitFrame from './PortraitFrame.vue'
import ShareButton from './ShareButton.vue'

const { t, tr, link, lang } = useI18n()
const { state, verdict, byId, restart, toMenu } = useGame()

// Ladder characters may come from any level, so look them up in the whole DB.
const hero = computed(() => characterById.get(verdict.value.characterId))
const caption = computed(() => {
  const step = verdict.value
  return step.fixedCaption ?? step.captions[Math.floor(state.captionSeed * step.captions.length)]
})
// The shared link opens the verdict's own page in the current language (r/<lang>/<id>/, built
// by vite.config.ts), whose preview shows this character's portrait and name in that language.
const shareText = computed(() =>
  `${t('share.result', { name: hero.value ? tr(hero.value.name) : verdict.value.characterId })} ${t('share.text')}`,
)

const met = computed(() =>
  state.questions.map((q) => {
    const c = byId.get(q.answerId)!
    return { c, portrait: allPortraits(c)[q.portraitIndex] }
  }),
)
</script>

<template>
  <section class="result">
    <ShareButton :path="`r/${lang}/${verdict.characterId}/`" :text="shareText" />
    <div class="stage">
      <p class="eyebrow you-are">{{ t('result.youAre') }}</p>
      <h1>{{ hero ? tr(hero.name) : verdict.characterId }}</h1>
      <div class="hero-area">
        <PortraitFrame v-if="hero" class="hero" :src="hero.portrait" :alt="tr(hero.name)" />
      </div>
      <p class="caption">{{ tr(caption) }}</p>

      <div class="actions">
        <button type="button" class="btn btn--primary" @click="restart">{{ t('result.again') }}</button>
        <button type="button" class="btn" @click="toMenu">{{ t('result.menu') }}</button>
      </div>
    </div>

    <h2 class="met-title">{{ t('result.met') }}</h2>
    <ul class="met">
      <li v-for="{ c, portrait } in met" :key="c.id">
        <a :href="link(c.wiki)" target="_blank" rel="noopener">
          <img :src="assetUrl(portrait.src)" :alt="tr(c.name)" loading="lazy" />
          <span>{{ tr(c.name) }}</span>
        </a>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.result {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  text-align: center;
}

/* The verdict fits one screen like the question card; the list of met characters scrolls below. */
.stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  height: calc(100dvh - 24px);
  max-height: 900px;

  & > * {
    flex: none;
  }
}

/* Sits on the language switch row, centred between equal side paddings. */
.you-are {
  display: flex;
  align-items: center;
  min-height: 42px;
  margin: 0;
  padding-inline: 100px;
}

h1 {
  margin-top: -16px;
  font-size: clamp(30px, 9vw, 52px);
  color: var(--gold);
}

/* A size container, so the portrait can fit both its width and its height. */
.stage > .hero-area {
  flex: 1 1 auto;
  min-height: 160px;
  /* No taller than the portrait at full width (page width or 360px, ratio 425/601), so on tall
     screens the spare height goes around the whole verdict instead of between its parts. */
  max-height: calc(min(100vw - 32px, 360px) * 601 / 425);
  width: 100%;
  container-type: size;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero {
  width: min(100cqw, 100cqh * var(--portrait-ratio), 360px);
  animation: rise 0.6s ease-out;
}

.caption {
  margin: 0;
  font-size: 22px;
  line-height: 1.25;
  font-style: italic;
  max-width: 28ch;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-top: 10px;
}

/* On phones the buttons sit at the bottom, and the verdict is centred in the space above them. */
@media (max-width: 600px) {
  .you-are {
    margin-top: auto;
  }

  /* Padding keeps some air above the buttons when no spare height is left for the auto margin. */
  .actions {
    margin-top: auto;
    padding-top: 10px;
  }
}

.met-title {
  font-size: 22px;
  margin-top: 24px;
  color: var(--muted);
}

.met {
  list-style: none;
  margin: 0;
  padding: 0;
  width: 100%;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;

  @media (max-width: 480px) {
    grid-template-columns: repeat(3, 1fr);
  }

  & a {
    display: grid;
    gap: 4px;
    color: var(--text);
    text-decoration: none;
    font-size: 15px;
    line-height: 1.15;

    &:hover {
      color: var(--gold);
    }
  }

  & img {
    width: 100%;
    aspect-ratio: var(--portrait-ratio);
    object-fit: cover;
    border: 1px solid var(--border);
    border-radius: 6px;
  }
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.98);
  }
}
</style>
