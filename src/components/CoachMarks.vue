<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n, type MessageKey } from '../i18n/useI18n'

/** A short tour of the question card's controls, shown on the very first card a player ever sees. */
const props = defineProps<{ root: HTMLElement }>()
const emit = defineEmits<{ done: [] }>()

const { t } = useI18n()

// Each step lights up the elements its selector finds inside the game screen.
const STEPS = [
  { target: '.options', text: 'coach.answer' },
  { target: '.hint-bar, .hint-row', text: 'coach.hints' },
  // The row's children, not the row: its side padding is where the home and language buttons sit.
  { target: '.top > *', text: 'coach.progress' },
] as const

const PAD = 6
const GAP = 12

const step = ref(0)
const rect = ref<DOMRect | null>(null)
const tipEl = ref<HTMLElement>()
const primaryEl = ref<HTMLButtonElement>()
const tipHeight = ref(0)

const isLast = computed(() => step.value === STEPS.length - 1)

function measure() {
  const rects = [...props.root.querySelectorAll(STEPS[step.value].target)].map((el) => el.getBoundingClientRect())
  if (!rects.length) {
    rect.value = null
  } else {
    // One area around everything the step lights up.
    const left = Math.min(...rects.map((r) => r.left))
    const top = Math.min(...rects.map((r) => r.top))
    const right = Math.max(...rects.map((r) => r.right))
    const bottom = Math.max(...rects.map((r) => r.bottom))
    rect.value = new DOMRect(left, top, right - left, bottom - top)
  }
  tipHeight.value = tipEl.value?.offsetHeight ?? 0
}

const hole = computed(() => {
  const r = rect.value
  if (!r) return { display: 'none' }
  // Kept inside the screen, so the gold outline isn't cut off when the target touches its edge.
  const top = Math.max(2, r.top - PAD)
  const bottom = Math.min(window.innerHeight - 2, r.bottom + PAD)
  return {
    top: `${top}px`,
    left: `${r.left - PAD}px`,
    width: `${r.width + PAD * 2}px`,
    height: `${bottom - top}px`,
  }
})

// The tip goes on whichever side of the lit area has more room.
const tipStyle = computed(() => {
  const r = rect.value
  if (!r) return { top: '50%', transform: 'translateY(-50%)' }
  const below = r.bottom + PAD + GAP
  const above = r.top - PAD - GAP - tipHeight.value
  return window.innerHeight - r.bottom > r.top ? { top: `${below}px` } : { top: `${Math.max(8, above)}px` }
})

async function go(to: number) {
  step.value = to
  await nextTick()
  measure()
  // Measured once more after the tip has its new text, so its height is right.
  await nextTick()
  measure()
  primaryEl.value?.focus()
}

function finish() {
  emit('done')
}

const next = () => (isLast.value ? finish() : go(step.value + 1))

const onKey = (e: KeyboardEvent) => {
  if (e.key === 'Escape') finish()
}

const observer = new ResizeObserver(() => measure())
onMounted(() => {
  observer.observe(props.root)
  window.addEventListener('resize', measure)
  window.addEventListener('keydown', onKey)
  measure()
  primaryEl.value?.focus()
  // The portrait settles its size in the frame after mounting. Only measured again here:
  // a delayed frame (a background tab) must not send the player back to the first step.
  requestAnimationFrame(measure)
})
onBeforeUnmount(() => {
  observer.disconnect()
  window.removeEventListener('resize', measure)
  window.removeEventListener('keydown', onKey)
})
</script>

<template>
  <div class="coach" role="dialog" aria-modal="true" :aria-label="t('coach.title')" @click.self="next">
    <div class="hole" :style="hole" aria-hidden="true" />
    <div ref="tipEl" class="tip" :style="tipStyle">
      <p class="tip__text" aria-live="polite">{{ t(STEPS[step].text as MessageKey) }}</p>
      <div class="tip__row">
        <span class="tip__dots" aria-hidden="true">
          <span v-for="(_, i) in STEPS" :key="i" class="dot" :class="{ on: i === step }" />
        </span>
        <button v-if="!isLast" type="button" class="tip__skip" @click="finish">{{ t('coach.skip') }}</button>
        <button ref="primaryEl" type="button" class="btn btn--primary tip__next" @click="next">
          {{ isLast ? t('coach.done') : t('coach.next') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Covers the whole screen so nothing under it can be tapped while the tour is on. */
.coach {
  position: fixed;
  inset: 0;
  z-index: 50;
}

/* The lit area: everything outside it is darkened by its huge shadow. */
.hole {
  position: fixed;
  border-radius: var(--radius);
  box-shadow:
    0 0 0 2px var(--gold),
    0 0 0 100vmax rgb(10 8 6 / 0.85);
  pointer-events: none;
  transition: top 0.25s ease, left 0.25s ease, width 0.25s ease, height 0.25s ease;
}

.tip {
  position: fixed;
  left: 16px;
  right: 16px;
  max-width: 360px;
  margin-inline: auto;
  padding: 14px 16px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  box-shadow: 0 8px 32px rgb(0 0 0 / 0.6);
}

.tip__text {
  margin: 0 0 12px;
  font-size: 18px;
  line-height: 1.3;
}

.tip__row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tip__dots {
  display: flex;
  gap: 6px;
  margin-right: auto;
}

.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--gold-soft);

  &.on {
    background: var(--gold);
  }
}

.tip__skip {
  padding: 8px 4px;
  border: 0;
  background: none;
  color: var(--muted);
  font: inherit;
  font-size: 16px;
  cursor: pointer;
}

.tip__next {
  padding-block: 8px;
}
</style>
