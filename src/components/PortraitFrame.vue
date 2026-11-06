<script setup lang="ts">
import { assetUrl } from '../assets'

defineProps<{ src: string; alt: string; state?: 'good' | 'bad' }>()
</script>

<template>
  <figure class="frame" :class="state">
    <img :src="assetUrl(src)" :alt="alt" decoding="async" />
  </figure>
</template>

<style scoped>
.frame {
  margin: 0;
  aspect-ratio: var(--portrait-ratio);
  overflow: hidden;
  border: 1px solid var(--gold-soft);
  border-radius: var(--radius);
  background: #0c0a08;
  box-shadow: 0 12px 40px rgb(0 0 0 / 0.5);
  transition: border-color 0.2s, box-shadow 0.2s;

  & img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  &.good {
    border-color: var(--good);
    box-shadow: 0 0 0 2px var(--good), 0 12px 40px rgb(0 0 0 / 0.5);
  }

  &.bad {
    border-color: var(--bad);
    box-shadow: 0 0 0 2px var(--bad), 0 12px 40px rgb(0 0 0 / 0.5);
  }
}
</style>
