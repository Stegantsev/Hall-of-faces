<script setup lang="ts">
// Each platform's own Share icon: Apple devices (iPadOS says "Macintosh" too) know the box
// with an arrow, Android and the rest know Material's three linked dots.
const isApple = /iP(hone|od|ad)|Macintosh/.test(navigator.userAgent)
</script>

<template>
  <svg v-if="isApple" class="icon apple" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 3v12M7.5 7.5 12 3l4.5 4.5M8 10H6v11h12V10h-2" />
  </svg>
  <svg v-else class="icon" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
  </svg>
</template>

<style scoped>
/* Takes the colour of the text around it. */
.icon {
  flex: none;
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.apple {
  margin-top: -2px; /* the arrow makes the box top-heavy */
}
</style>
