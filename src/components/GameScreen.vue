<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { allPortraits } from '../data/model'
import { HINTS_PER_GAME } from '../game/engine'
import { useGame } from '../game/useGame'
import { useI18n } from '../i18n/useI18n'
import HintBar from './HintBar.vue'
import HintPanel from './HintPanel.vue'
import PortraitFrame from './PortraitFrame.vue'
import RevealCard from './RevealCard.vue'

const { t, tr } = useI18n()
const { state, question, turn, answer, byId, pick, next } = useGame()

const revealed = computed(() => state.phase === 'reveal')
const correct = computed(() => turn.value.pickedId === question.value.answerId)
const portrait = computed(() => allPortraits(answer.value!)[question.value.portraitIndex])
const isLast = computed(() => state.index === state.questions.length - 1)

const revealEl = ref<HTMLElement>()
const panelOpen = ref(false)

// Matches --portrait-ratio and the hint row height plus the gap above it in the styles below.
const PORTRAIT_RATIO = 425 / 601
const HINT_ROW_SPACE = 54

// On tall screens the portrait is limited by width and leaves spare height. When the hint row
// fits there, the hints move off the portrait into a labelled row under it.
const areaEl = ref<HTMLElement>()
const roomy = ref(false)
const observer = new ResizeObserver(([entry]) => {
  const { width, height } = entry.contentRect
  roomy.value = height - Math.min(width, height * PORTRAIT_RATIO) / PORTRAIT_RATIO >= HINT_ROW_SPACE
})
onMounted(() => observer.observe(areaEl.value!))
onBeforeUnmount(() => observer.disconnect())

async function choose(id: string) {
  pick(id)
  await nextTick()
  revealEl.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function optionState(id: string) {
  if (!revealed.value) return turn.value.hidden.includes(id) ? 'hidden' : ''
  if (id === question.value.answerId) return 'good'
  if (id === turn.value.pickedId) return 'bad'
  return 'dim'
}

function goNext() {
  next()
  window.scrollTo({ top: 0 })
}
</script>

<template>
  <section class="game">
    <div class="stage">
      <div class="top">
        <span class="eyebrow" :aria-label="t('game.progress', { n: state.index + 1, total: state.questions.length })">
          {{ state.index + 1 }}/{{ state.questions.length }}
        </span>
        <div class="bar" aria-hidden="true">
          <span :style="{ width: `${((state.index + (revealed ? 1 : 0)) / state.questions.length) * 100}%` }" />
        </div>
        <span class="pips" :aria-label="`${t('game.hintsLeft')}: ${state.hintsLeft}`">
          <span v-for="i in HINTS_PER_GAME" :key="i" class="pip" :class="{ used: i > state.hintsLeft }" />
        </span>
      </div>

      <div ref="areaEl" class="portrait-area" :class="{ roomy }">
        <div class="portrait-box">
          <PortraitFrame
            class="portrait"
            :src="portrait.src"
            :alt="revealed ? tr(answer!.name) : t('game.who')"
            :state="revealed ? (correct ? 'good' : 'bad') : undefined"
          />
          <template v-if="!revealed">
            <HintBar v-if="!roomy" class="hint-bar" @show="panelOpen = true" />
            <HintPanel v-model:open="panelOpen" />
          </template>
        </div>
        <HintBar v-if="!revealed && roomy" row class="hint-row" @show="panelOpen = true" />
      </div>

      <div class="options">
        <button
          v-for="id in question.options"
          :key="id"
          type="button"
          class="option"
          :class="optionState(id)"
          :disabled="revealed || turn.hidden.includes(id)"
          @click="choose(id)"
        >
          {{ tr(byId.get(id)!.name) }}
        </button>
      </div>
    </div>

    <div v-if="revealed" ref="revealEl" class="reveal">
      <p class="verdict" :class="correct ? 'good' : 'bad'">{{ correct ? t('reveal.correct') : t('reveal.wrong') }}</p>
      <RevealCard :character="answer!" :portrait-index="question.portraitIndex" />
      <button type="button" class="btn btn--primary next" @click="goNext">
        {{ isLast ? t('reveal.finish') : t('reveal.next') }} →
      </button>
    </div>
  </section>
</template>

<style scoped>
.game {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* The question fits one screen: the portrait takes whatever height the rest leaves. */
.stage {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: calc(100dvh - 24px);
  max-height: 900px;
}

/* Leaves room for the fixed language switch on the right, until the screen is wide enough
   for the switch to sit beside the page column instead of over it. */
.top {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: none;
  min-height: 42px;
  padding-right: 100px;

  @media (min-width: 780px) {
    padding-right: 0;
  }
}

.pips {
  display: flex;
  gap: 5px;
}

.pip {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--gold);
  box-shadow: 0 0 8px color-mix(in srgb, var(--gold) 60%, transparent);

  &.used {
    background: transparent;
    box-shadow: inset 0 0 0 1px var(--gold-soft);
  }
}

.bar {
  flex: 1;
  height: 3px;
  border-radius: 2px;
  background: var(--surface-2);
  overflow: hidden;

  & span {
    display: block;
    height: 100%;
    background: var(--gold);
    transition: width 0.3s ease;
  }
}

/* A size container, so the portrait can fit both its width and its height. */
.portrait-area {
  flex: 1 1 auto;
  min-height: 160px;
  container-type: size;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  --hint-row-space: 0px;

  &.roomy {
    --hint-row-space: 54px;
  }
}

/* Overlay hints sit on the portrait itself, not on the spare space around it. */
.portrait-box {
  position: relative;
  width: min(100cqw, (100cqh - var(--hint-row-space)) * var(--portrait-ratio));
}

.hint-row {
  width: 100%;
}

.hint-bar {
  position: absolute;
  top: 8px;
  right: 6px;
  z-index: 2;
}

.options {
  flex: none;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-auto-rows: 1fr;
  gap: 8px;
}

.option {
  min-height: 50px;
  padding: 4px 8px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  font-size: 17px;
  line-height: 1.1;
  transition: border-color 0.15s, background 0.15s, opacity 0.2s;

  &:hover:not(:disabled) {
    border-color: var(--gold);
    background: var(--surface-2);
  }

  &.hidden {
    opacity: 0.15;
    text-decoration: line-through;
  }

  &.good {
    border-color: var(--good);
    background: var(--good-bg);
  }

  &.bad {
    border-color: var(--bad);
    background: var(--bad-bg);
  }

  &.dim {
    opacity: 0.45;
  }

  &:disabled {
    cursor: default;
  }
}

.reveal {
  display: grid;
  gap: 16px;
  scroll-margin-top: 12px;
}

.verdict {
  margin: 0;
  text-align: center;
  font-family: var(--font-display);
  font-size: 30px;

  &.good {
    color: var(--good);
  }

  &.bad {
    color: var(--bad);
  }
}

/* Stays at the bottom of the screen while the long reveal card scrolls under it. */
.next {
  position: sticky;
  bottom: 12px;
  z-index: 5;
  width: 100%;
  box-shadow: 0 0 0 6px var(--bg), 0 -8px 24px rgb(0 0 0 / 0.6);
}
</style>
