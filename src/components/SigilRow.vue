<script setup lang="ts">
import { assetUrl } from '../assets'
import { houseById } from '../data'
import type { Sigil } from '../data/schema'
import { useI18n, type MessageKey } from '../i18n/useI18n'

defineProps<{ sigils: Sigil[] }>()

const { t, tr } = useI18n()

const label = (s: Sigil) => {
  const house = s.house ? houseById.get(s.house) : undefined
  return house ? tr(house.name) : t(`sigil.${s.kind}` as MessageKey)
}
</script>

<template>
  <ul class="sigils">
    <li v-for="s in sigils" :key="s.image">
      <img :src="assetUrl(s.image)" :alt="label(s)" loading="lazy" />
      <span>{{ label(s) }}</span>
    </li>
  </ul>
</template>

<style scoped>
.sigils {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;

  & li {
    display: grid;
    justify-items: center;
    gap: 2px;
    width: 72px;
    text-align: center;
    font-size: 14px;
    line-height: 1.1;
    color: var(--muted);
  }

  & img {
    width: 44px;
    height: 50px;
    object-fit: contain;
  }
}
</style>
