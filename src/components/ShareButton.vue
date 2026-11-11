<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from '../i18n/useI18n'

const props = defineProps<{
  /** Page to share, relative to the game's address (a result's "r/<lang>/<id>/"); the game itself by default. */
  path?: string
  /** Message beside the link; the game's tagline by default. */
  text?: string
}>()

const { t } = useI18n()
const copied = ref(false)
// Each platform's own Share icon: Apple devices (iPadOS says "Macintosh" too) know the box
// with an arrow, Android and the rest know Material's three linked dots.
const isApple = /iP(hone|od|ad)|Macintosh/.test(navigator.userAgent)
let resetTimer: ReturnType<typeof setTimeout> | undefined

// The game's own address without the route, so a friend lands on the start screen.
function shareUrl() {
  return location.origin + location.pathname + (props.path ?? '')
}

async function onClick() {
  const url = shareUrl()
  const data: ShareData = { title: t('app.title'), text: props.text ?? t('share.text'), url }

  // Phones, Safari and Chromium on Windows/macOS open the system share sheet.
  if (navigator.share && (navigator.canShare?.(data) ?? true)) {
    try {
      await navigator.share(data)
    } catch {
      // Closing the sheet rejects with AbortError: nothing to do.
    }
    return
  }

  // Elsewhere (Firefox, Chromium on Linux) copy the link and say so beside the button.
  try {
    await navigator.clipboard.writeText(url)
    copied.value = true
    clearTimeout(resetTimer)
    resetTimer = setTimeout(() => (copied.value = false), 2000)
  } catch {
    window.prompt(t('share.button'), url)
  }
}
</script>

<template>
  <!-- Round twin of the language pill in the opposite corner. -->
  <div class="share">
    <button type="button" :aria-label="t('share.button')" :title="t('share.button')" @click="onClick">
      <svg v-if="isApple" class="apple" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3v12M7.5 7.5 12 3l4.5 4.5M8 10H6v11h12V10h-2" />
      </svg>
      <svg v-else viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
      </svg>
    </button>
    <span class="toast" role="status">{{ copied ? t('share.copied') : '' }}</span>
  </div>
</template>

<style scoped>
.share {
  position: fixed;
  top: 12px;
  left: 12px;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 8px;
}

button {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: color-mix(in srgb, var(--surface) 90%, transparent);
  backdrop-filter: blur(6px);
  cursor: pointer;

  &:hover {
    border-color: var(--gold);
  }

  &:focus-visible {
    outline: 2px solid var(--gold);
    outline-offset: 2px;
  }
}

svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: var(--gold);
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.apple {
  margin-top: -2px; /* the arrow makes the box top-heavy */
}

/* Shown over the backdrop and the subtitle, so it gets the pill's background. */
.toast {
  padding: 6px 12px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: color-mix(in srgb, var(--surface) 90%, transparent);
  backdrop-filter: blur(6px);
  font-size: 15px;
  color: var(--text);

  &:empty {
    display: none;
  }
}
</style>
