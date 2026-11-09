<script setup lang="ts">
import { computed } from 'vue'
import { assetUrl } from '../assets'
import { houseById } from '../data'
import { allPortraits, extraSigils } from '../data/model'
import type { Character } from '../data/schema'
import { useGame } from '../game/useGame'
import { useI18n, type MessageKey } from '../i18n/useI18n'
import SigilRow from './SigilRow.vue'

const props = defineProps<{ character: Character; portraitIndex: number }>()

const { t, tr, link, wikiName } = useI18n()
const { byId } = useGame()

const house = computed(() => (props.character.house ? houseById.get(props.character.house) : undefined))
const houseImage = computed(
  () => house.value?.sigil.image ?? props.character.sigils?.find((s) => s.kind === 'house' && s.house === props.character.house)?.image,
)
const serves = computed(() => {
  const id = props.character.serves
  return id ? tr(houseById.get(id)?.name ?? byId.get(id)?.name) : ''
})
const otherSigils = computed(() => extraSigils(props.character))
// The portrait shown in the question is already on screen; offer the rest as a gallery.
const otherPortraits = computed(() => allPortraits(props.character).filter((_, i) => i !== props.portraitIndex))
</script>

<template>
  <article class="card">
    <header>
      <h3>{{ tr(character.name) }}</h3>
      <p v-if="character.nickname" class="nickname">«{{ tr(character.nickname) }}»</p>
    </header>

    <dl class="facts-grid">
      <template v-if="character.title">
        <dt>{{ t('reveal.title') }}</dt>
        <dd>{{ tr(character.title) }}</dd>
      </template>
      <dt>{{ t('reveal.race') }}</dt>
      <dd>{{ t(`race.${character.race}` as MessageKey) }}</dd>
      <template v-if="house">
        <dt>{{ t('reveal.house') }}</dt>
        <dd class="house">
          <img v-if="houseImage" :src="assetUrl(houseImage)" alt="" />
          <span>
            {{ tr(house.name) }}
            <em v-if="house.words">«{{ tr(house.words) }}»</em>
          </span>
        </dd>
      </template>
      <template v-if="serves">
        <dt>{{ t('reveal.serves') }}</dt>
        <dd>{{ serves }}</dd>
      </template>
      <template v-if="character.castle">
        <dt>{{ t('reveal.castle') }}</dt>
        <dd>{{ tr(character.castle) }}</dd>
      </template>
    </dl>

    <section v-if="otherSigils.length">
      <h4 class="eyebrow">{{ t('reveal.sigils') }}</h4>
      <SigilRow :sigils="otherSigils" />
    </section>

    <section>
      <h4 class="eyebrow">{{ t('reveal.facts') }}</h4>
      <ul class="facts">
        <li v-for="(fact, i) in character.facts" :key="i">{{ tr(fact) }}</li>
      </ul>
    </section>

    <div v-if="otherPortraits.length" class="gallery">
      <figure v-for="p in otherPortraits" :key="p.src">
        <a :href="assetUrl(p.src)" target="_blank" rel="noopener">
          <img :src="assetUrl(p.src)" :alt="tr(character.name)" loading="lazy" />
        </a>
        <figcaption v-if="p.caption">{{ tr(p.caption) }}</figcaption>
      </figure>
    </div>

    <a class="wiki" :href="link(character.wiki)" target="_blank" rel="noopener">{{ t('reveal.wiki', { site: wikiName(link(character.wiki)) }) }} ↗</a>
  </article>
</template>

<style scoped>
.card {
  display: grid;
  gap: 16px;
  padding: 20px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
}

h3 {
  font-size: 32px;
  color: var(--gold);
}

.nickname {
  margin: 4px 0 0;
  font-style: italic;
  color: var(--muted);
}

.facts-grid {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 6px 16px;
  margin: 0;

  & dt {
    color: var(--muted);
    font-size: 17px;
    padding-top: 1px;
  }

  & dd {
    margin: 0;
  }
}

.house {
  display: flex;
  gap: 10px;
  align-items: center;

  & img {
    width: 32px;
    height: 36px;
    object-fit: contain;
    flex: none;
  }

  & em {
    display: block;
    color: var(--gold);
    font-size: 17px;
  }
}

h4 {
  margin: 0 0 6px;
  font-weight: 500;
}

.facts {
  margin: 0;
  padding-left: 20px;
  display: grid;
  gap: 6px;

  & li::marker {
    color: var(--gold);
  }
}

.gallery {
  display: flex;
  gap: 10px;
  overflow-x: auto;

  & figure {
    margin: 0;
    flex: none;
    width: 96px;
  }

  & img {
    width: 96px;
    aspect-ratio: var(--portrait-ratio);
    object-fit: cover;
    border: 1px solid var(--border);
    border-radius: 6px;
  }

  & figcaption {
    font-size: 14px;
    color: var(--muted);
    margin-top: 4px;
  }
}

.wiki {
  justify-self: start;
}

@media (max-width: 420px) {
  .facts-grid {
    grid-template-columns: 1fr;
    gap: 0;

    & dd {
      margin-bottom: 8px;
    }
  }
}
</style>
