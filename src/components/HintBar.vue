<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { HINT_ICONS, HINT_KINDS, type HintKind } from '../game/engine'
import { useGame } from '../game/useGame'
import { useI18n, type MessageKey } from '../i18n/useI18n'

/** A labelled row under the portrait instead of icons on top of it. */
const props = defineProps<{ row?: boolean }>()
const emit = defineEmits<{ show: [] }>()

const { t } = useI18n()
const { state, turn, isHintAvailable, useHint } = useGame()

const EXPAND_MS = 5000

// With a mouse a hover shows the label, so a click takes the hint at once. On touch screens
// the first tap only shows the label and the second one takes the hint.
const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches
// The first card always shows the labels, so the buttons are learned before they turn into icons.
const labelled = props.row || state.index === 0

const expanded = ref<HintKind | null>(null)
let timer: ReturnType<typeof setTimeout> | undefined

const isUsed = (kind: HintKind) => turn.value.hints.includes(kind)
const label = (kind: HintKind) => t(`hint.${kind}` as MessageKey)

function collapse() {
  clearTimeout(timer)
  expanded.value = null
}

function expand(kind: HintKind) {
  clearTimeout(timer)
  expanded.value = kind
  timer = setTimeout(collapse, EXPAND_MS)
}

function onClick(kind: HintKind) {
  if (isUsed(kind)) {
    if (kind !== 'fifty') emit('show')
    if (!canHover && !labelled) expand(kind)
    return
  }
  if (canHover || labelled || expanded.value === kind) {
    collapse()
    useHint(kind)
    if (kind !== 'fifty') emit('show')
  } else {
    expand(kind)
  }
}

const root = ref<HTMLElement>()
const onPointerDown = (e: PointerEvent) => {
  if (!root.value?.contains(e.target as Node)) collapse()
}
onMounted(() => document.addEventListener('pointerdown', onPointerDown))
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onPointerDown)
  clearTimeout(timer)
})
</script>

<template>
  <div ref="root" class="hints" :class="{ hover: canHover, 'hints--row': row }">
    <button
      v-for="kind in HINT_KINDS"
      :key="kind"
      type="button"
      class="hint"
      :class="{
        open: labelled || expanded === kind,
        armed: expanded === kind && !isUsed(kind),
        used: isUsed(kind),
      }"
      :disabled="!isUsed(kind) && !isHintAvailable(kind)"
      :aria-label="label(kind)"
      @click="onClick(kind)"
    >
      <span class="hint__label">{{ expanded === kind && !isUsed(kind) ? t('hint.use', { name: label(kind) }) : label(kind) }}</span>
      <span class="hint__icon" aria-hidden="true">{{ isUsed(kind) ? '✓' : HINT_ICONS[kind] }}</span>
    </button>
  </div>
</template>

<style scoped>
.hints {
  display: grid;
  gap: 8px;
  justify-items: end;
}

.hint {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  height: 44px;
  min-width: 44px;
  padding: 0;
  border: 1px solid var(--gold-soft);
  border-radius: 999px;
  background: color-mix(in srgb, var(--bg) 88%, transparent);
  font-size: 17px;
  white-space: nowrap;
  overflow: hidden;
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none;
  user-select: none;
  transition: background 0.25s ease, border-color 0.25s ease, color 0.25s ease, opacity 0.2s;

  &:disabled {
    opacity: 0.35;
  }

  &.used {
    border-color: var(--gold);
    background: color-mix(in srgb, var(--gold) 30%, var(--bg));
  }

  &.armed {
    border-color: var(--gold);
    background: var(--gold);
    color: #1a140c;
  }
}

.hint__icon {
  flex: none;
  width: 42px;
  text-align: center;
  font-size: 19px;
  color: var(--gold);

  .armed & {
    color: inherit;
  }
}

.hint__label {
  max-width: 0;
  opacity: 0;
  transition: max-width 0.25s ease, opacity 0.2s ease, padding 0.25s ease;
}

/* Icons on the portrait unfold into labelled buttons; the row has its labels always shown. */
.hints:not(.hints--row) {
  & .hint.open .hint__label,
  & .hint:focus-visible .hint__label,
  &.hover .hint:hover:not(:disabled) .hint__label {
    max-width: 240px;
    opacity: 1;
    padding-left: 16px;
  }
}

.hints--row {
  grid-template-columns: repeat(3, 1fr);

  & .hint {
    justify-content: center;
    gap: 7px;
    width: 100%;
    padding: 0 4px;
    border-style: dashed;
    border-radius: var(--radius);
    background: transparent;
    font-size: 15px;
    line-height: 1.05;
    text-align: left;
    text-wrap: balance;
    white-space: normal;

    &.used {
      border-style: solid;
      background: color-mix(in srgb, var(--gold) 15%, transparent);
    }

    @media (hover: hover) and (pointer: fine) {
      &:hover:not(:disabled) {
        border-style: solid;
        border-color: var(--gold);
      }
    }
  }

  /* Icon first, label after it. */
  & .hint__icon {
    order: -1;
    width: auto;
    font-size: 16px;
  }

  & .hint__label {
    max-width: none;
    opacity: 1;
    padding: 0;
  }
}
</style>
