<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from '../i18n/useI18n'

/** A bubble pointing at the hints, with the rest of the screen shaded. Any tap dismisses it. */
const props = defineProps<{ root: HTMLElement }>()
const emit = defineEmits<{ done: [] }>()

const { t } = useI18n()

// Space between a hint and the edge of its cut-out in the shade (any wider and the portrait shows
// through as a bright ring), and between the bubble and the hints.
const PAD = 1
const GAP = 14
const SIDE_WIDTH = 176

const bubbleEl = ref<HTMLElement>()
const shadePath = ref('')
const size = ref({ w: 0, h: 0 })
// Beside the hints when they sit on the portrait, above them when they form a row under it.
const placement = ref<'side' | 'above'>('side')
const bubbleStyle = ref<Record<string, string>>({})

function roundedRect(r: DOMRect, radius: number) {
  const x = r.left - PAD
  const y = r.top - PAD
  const w = r.width + PAD * 2
  const h = r.height + PAD * 2
  const k = Math.min(radius + PAD, h / 2, w / 2)
  return (
    `M${x + k},${y}h${w - 2 * k}a${k},${k} 0 0 1 ${k},${k}v${h - 2 * k}` +
    `a${k},${k} 0 0 1 -${k},${k}h-${w - 2 * k}a${k},${k} 0 0 1 -${k},-${k}` +
    `v-${h - 2 * k}a${k},${k} 0 0 1 ${k},-${k}z`
  )
}

function layout() {
  const bar = props.root.querySelector('.hints')
  const hints = [...props.root.querySelectorAll<HTMLElement>('.hints .hint:not(:disabled)')]
  if (!bar || !hints.length) return emit('done')

  const w = window.innerWidth
  const h = window.innerHeight
  size.value = { w, h }
  // The shade is one path: the whole screen with a cut-out, shaped like the button, around each available hint.
  shadePath.value =
    `M0,0H${w}V${h}H0z` +
    hints.map((el) => roundedRect(el.getBoundingClientRect(), parseFloat(getComputedStyle(el).borderTopLeftRadius))).join('')

  const barRect = bar.getBoundingClientRect()
  const first = hints[0].getBoundingClientRect()
  const bubbleHeight = bubbleEl.value?.offsetHeight ?? 0
  if (bar.classList.contains('hints--row')) {
    placement.value = 'above'
    bubbleStyle.value = { left: '50%', transform: 'translateX(-50%)', top: `${barRect.top - bubbleHeight - GAP}px` }
  } else {
    placement.value = 'side'
    // Its arrow, near the top, points at the middle of the first hint that can be taken.
    bubbleStyle.value = {
      width: `${SIDE_WIDTH}px`,
      left: `${Math.max(8, barRect.left - SIDE_WIDTH - GAP)}px`,
      top: `${first.top + first.height / 2 - 25}px`,
    }
  }
}

// Taps pass through the shade: a tap on a hint takes it, and any tap at all closes the bubble.
const dismiss = () => emit('done')

onMounted(() => {
  document.documentElement.classList.add('hint-nudge-open')
  layout()
  // Once more with the bubble's real height, which the row placement needs.
  requestAnimationFrame(layout)
  window.addEventListener('resize', layout)
  document.addEventListener('pointerdown', dismiss, true)
  document.addEventListener('keydown', dismiss, true)
})
onBeforeUnmount(() => {
  document.documentElement.classList.remove('hint-nudge-open')
  window.removeEventListener('resize', layout)
  document.removeEventListener('pointerdown', dismiss, true)
  document.removeEventListener('keydown', dismiss, true)
})
</script>

<template>
  <div class="nudge">
    <svg class="shade" :width="size.w" :height="size.h" aria-hidden="true">
      <path fill-rule="evenodd" :d="shadePath" />
    </svg>
    <p ref="bubbleEl" class="bubble" :class="`bubble--${placement}`" :style="bubbleStyle" role="status">
      {{ t('nudge.lead') }} <b>{{ t('nudge.count') }}</b>
    </p>
    <!-- Any tap closes the nudge already; the cross on the shade just shows that it can be closed. -->
    <button type="button" class="close" :aria-label="t('nudge.close')" @click="dismiss">
      <svg width="20" height="20" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.nudge {
  position: fixed;
  inset: 0;
  z-index: 40;
  pointer-events: none;
}

.shade {
  position: absolute;
  inset: 0;

  & path {
    fill: rgb(10 8 6 / 0.72);
  }
}

.bubble {
  position: absolute;
  max-width: min(300px, calc(100vw - 32px));
  width: max-content;
  margin: 0;
  padding: 10px 12px;
  border: 1px solid var(--gold);
  border-radius: 12px;
  background: var(--surface);
  box-shadow: 0 6px 24px rgb(0 0 0 / 0.55);
  font-size: 16px;
  line-height: 1.25;

  & b {
    color: var(--gold);
    font-weight: 600;
  }

  /* The arrow: a rotated square with two of its borders showing. */
  &::after {
    content: '';
    position: absolute;
    width: 12px;
    height: 12px;
    background: inherit;
    transform: rotate(45deg);
  }
}

/* A bare gold cross in the top right corner of the shade, over the dimmed language switch,
   with a finger-sized tap area around it. */
.close {
  position: absolute;
  top: 12px;
  right: 12px;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--gold);
  cursor: pointer;
  pointer-events: auto;
  -webkit-tap-highlight-color: transparent;

  &:focus-visible {
    outline: 2px solid var(--gold);
    outline-offset: 2px;
    border-radius: 999px;
  }
}

.bubble--side::after {
  top: 18px;
  right: -7px;
  border-top: 1px solid var(--gold);
  border-right: 1px solid var(--gold);
}

.bubble--above {
  text-align: center;

  &::after {
    bottom: -7px;
    left: 50%;
    margin-left: -6px;
    border-bottom: 1px solid var(--gold);
    border-right: 1px solid var(--gold);
  }
}
</style>

<style>
/* The cross takes the language switch's corner, so the switch steps aside while the nudge is open. */
.lang {
  transition: opacity 0.3s ease;
}

.hint-nudge-open .lang {
  opacity: 0;
  pointer-events: none;
}
</style>
