<script setup lang="ts">
import { useGame } from '../game/useGame'
import { useI18n } from '../i18n/useI18n'

// Back to the start screen from a game or its result, in the top-left corner where the start
// screen has its share button.
const { t } = useI18n()
const { toMenu } = useGame()
</script>

<template>
  <button type="button" class="round-btn home" :aria-label="t('nav.home')" :title="t('nav.home')" @click="toMenu">
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3.5 11 12 4l8.5 7M6 9.5V20h4.5v-5.5h3V20H18V9.5" />
    </svg>
  </button>
</template>

<style scoped>
.home {
  position: fixed;
  top: 12px;
  left: 12px;
  z-index: 10;
}

svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
