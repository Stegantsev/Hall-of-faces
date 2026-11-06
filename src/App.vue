<script setup lang="ts">
import { defineAsyncComponent, onBeforeUnmount, ref } from 'vue'
import LangSwitch from './components/LangSwitch.vue'
import StartScreen from './components/StartScreen.vue'
import GameScreen from './components/GameScreen.vue'
import ResultScreen from './components/ResultScreen.vue'
import CreditsPage from './components/CreditsPage.vue'
import { useGame } from './game/useGame'

// Loaded on demand so the admin table stays out of the game bundle.
const AdminPage = defineAsyncComponent(() => import('./admin/AdminPage.vue'))

const { state } = useGame()

const route = ref(location.hash)
const onHashChange = () => (route.value = location.hash)
window.addEventListener('hashchange', onHashChange)
onBeforeUnmount(() => window.removeEventListener('hashchange', onHashChange))
</script>

<template>
  <AdminPage v-if="route === '#/admin'" />
  <template v-else>
    <LangSwitch />
    <main class="page" :class="{ 'page--fit': state.phase !== 'start' && route !== '#/credits' }">
      <CreditsPage v-if="route === '#/credits'" />
      <StartScreen v-else-if="state.phase === 'start'" />
      <GameScreen v-else-if="state.phase === 'question' || state.phase === 'reveal'" :key="state.index" />
      <ResultScreen v-else />
    </main>
  </template>
</template>

<style scoped>
.page {
  width: 100%;
  max-width: var(--page-width);
  margin: 0 auto;
  padding: 64px 16px 48px;

  /* Short phones (iPhone SE): keep the start screen on one screen. */
  @media (max-height: 700px) {
    padding-bottom: 16px;
  }

  /* Screens that fit one viewport put their first row beside the language switch, not below it. */
  &.page--fit {
    padding-top: 12px;
    padding-bottom: 12px;
  }
}
</style>
