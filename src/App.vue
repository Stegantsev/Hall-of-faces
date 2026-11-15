<script setup lang="ts">
import { defineAsyncComponent, onBeforeUnmount, ref } from 'vue'
import LangSwitch from './components/LangSwitch.vue'
import StartScreen from './components/StartScreen.vue'
import GameScreen from './components/GameScreen.vue'
import ResultScreen from './components/ResultScreen.vue'
import CreditsPage from './components/CreditsPage.vue'
import AdminLoadError from './admin/AdminLoadError.vue'
import { useGame } from './game/useGame'

/** sessionStorage: set while a reload for a missing admin chunk is under way, so it's tried only once. */
const ADMIN_RELOAD_KEY = 'admin-chunk-reload'

/** sessionStorage that may be blocked: reads as "already tried", so a blocked store never loops. */
const reloadTried = () => {
  try {
    return sessionStorage.getItem(ADMIN_RELOAD_KEY) !== null
  } catch {
    return true
  }
}
const markReload = (on: boolean) => {
  try {
    if (on) sessionStorage.setItem(ADMIN_RELOAD_KEY, '1')
    else sessionStorage.removeItem(ADMIN_RELOAD_KEY)
  } catch {
    // Storage blocked: nothing to remember.
  }
}

// Loaded on demand so the admin table stays out of the game bundle. A page opened before a deploy
// asks for a chunk name that no longer exists: reloading once fetches the new page and its chunks.
// If that doesn't help (offline), the error screen offers a retry instead of a blank page.
const AdminPage = defineAsyncComponent({
  loader: () =>
    import('./admin/AdminPage.vue').then((m) => {
      markReload(false)
      return m
    }),
  errorComponent: AdminLoadError,
  onError(error, _retry, fail) {
    console.error(error)
    if (navigator.onLine && !reloadTried()) {
      markReload(true)
      location.reload()
    } else {
      markReload(false)
      fail()
    }
  },
})

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
