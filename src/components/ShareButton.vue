<script setup lang="ts">
import { useI18n } from '../i18n/useI18n'
import { useShare } from '../share'
import ShareIcon from './ShareIcon.vue'

// Shares the game itself from the start screen; the result screen has its own wide button.
const { t } = useI18n()
const { share, copied } = useShare()
</script>

<template>
  <!-- Round twin of the language pill in the opposite corner. -->
  <div class="share">
    <button type="button" class="round-btn" :aria-label="t('share.button')" :title="t('share.button')" @click="share()">
      <ShareIcon />
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
