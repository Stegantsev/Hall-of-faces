import { createApp } from 'vue'
import App from './App.vue'
import { i18nReady } from './i18n/useI18n'
import { initPwa } from './pwa'
import './styles/tokens.css'
import './styles/base.css'

initPwa()

// A saved non-built-in language (e.g. mk) is fetched first, so the game never flashes in English.
i18nReady.then(() => createApp(App).mount('#app'))
