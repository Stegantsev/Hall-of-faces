<script setup lang="ts">
import { computed } from 'vue'
import { assetUrl } from '../assets'
import { houseById } from '../data'
import { extraSigils } from '../data/model'
import { HINT_ICONS } from '../game/engine'
import { useGame } from '../game/useGame'
import { useI18n } from '../i18n/useI18n'
import SigilRow from './SigilRow.vue'

const { t, tr } = useI18n()
const { turn, answer, byId } = useGame()

const house = computed(() => (answer.value?.house ? houseById.get(answer.value.house) : undefined))
// houses.json may lack an image while the character's own infobox has one.
const houseImage = computed(
  () => house.value?.sigil.image ?? answer.value?.sigils?.find((s) => s.kind === 'house' && s.house === answer.value?.house)?.image,
)
const otherSigils = computed(() => (answer.value ? extraSigils(answer.value) : []))
const serves = computed(() => {
  const id = answer.value?.serves
  if (!id) return ''
  return tr(houseById.get(id)?.name ?? byId.get(id)?.name)
})
const open = defineModel<boolean>('open', { required: true })

const shown = computed(() => turn.value.hints.filter((k) => k !== 'fifty'))
const fact = computed(() => (turn.value.factIndex !== null ? answer.value?.facts[turn.value.factIndex] : undefined))
const hasContent = computed(() => turn.value.hints.includes('house') || Boolean(fact.value))
</script>

<template>
  <button v-if="hasContent && !open" type="button" class="chip" @click="open = true">
    <span v-for="k in shown" :key="k" aria-hidden="true">{{ HINT_ICONS[k] }}</span>
    {{ t('hint.show') }}
    <span class="chevron" aria-hidden="true">▴</span>
  </button>
  <div v-else-if="hasContent" class="panel">
    <button type="button" class="collapse" :aria-label="t('hint.hide')" @click="open = false">▾</button>
    <div v-if="turn.hints.includes('house') && answer" class="house">
      <img v-if="houseImage" class="sigil" :src="assetUrl(houseImage)" alt="" />
      <div>
        <p v-if="house" class="house__name">{{ tr(house.name) }}</p>
        <p v-if="house?.words" class="house__words">«{{ tr(house.words) }}»</p>
        <p v-if="serves" class="meta">{{ t('hint.serves') }}: {{ serves }}</p>
        <p v-if="answer.castle" class="meta">{{ t('hint.castle') }}: {{ tr(answer.castle) }}</p>
      </div>
    </div>
    <SigilRow v-if="turn.hints.includes('house') && otherSigils.length" :sigils="otherSigils" />
    <p v-if="fact" class="fact">📜 {{ tr(fact) }}</p>
  </div>
</template>

<style scoped>
.panel {
  position: absolute;
  inset: auto 8px 8px;
  z-index: 1;
  max-height: calc(100% - 16px);
  overflow-y: auto;
  display: grid;
  gap: 10px;
  padding: 10px 40px 12px 12px;
  border: 1px solid var(--gold-soft);
  border-radius: var(--radius);
  background: color-mix(in srgb, var(--surface) 95%, transparent);
  animation: appear 0.25s ease-out;

  & p {
    margin: 0;
  }
}

.collapse {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--muted);
  font-size: 24px;
  line-height: 1;
}

.chip {
  position: absolute;
  left: 8px;
  bottom: 8px;
  z-index: 1;
  display: flex;
  gap: 6px;
  align-items: center;
  min-height: 36px;
  padding: 4px 12px;
  border: 1px solid var(--gold-soft);
  border-radius: 999px;
  background: color-mix(in srgb, var(--surface) 92%, transparent);
  font-size: 16px;
  animation: appear 0.2s ease-out;
}

.chevron {
  color: var(--muted);
}

.house {
  display: flex;
  gap: 14px;
  align-items: center;
}

.sigil {
  width: 56px;
  height: 64px;
  object-fit: contain;
  flex: none;
}

.house__name {
  font-family: var(--font-display);
  font-size: 20px;
}

.house__words {
  font-style: italic;
  color: var(--gold);
}

.meta {
  color: var(--muted);
  font-size: 16px;
}

.fact {
  font-size: 17px;
  line-height: 1.3;
}

@keyframes appear {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
}
</style>
