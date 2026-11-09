import { computed, ref, watch } from 'vue'
import { useI18n } from './i18n/useI18n'

/** Chromium's install prompt event; not in the DOM typings. */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const isStandalone = () =>
  matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true

/** iPhone, iPod, and iPad (which says "Macintosh" but has a touch screen). */
const isIos =
  /iP(hone|od|ad)/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1)

/** Phones and tablets: a "home screen" means nothing on a desktop. */
const isTouch = matchMedia('(pointer: coarse)').matches

const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null)
const installed = ref(isStandalone())

/**
 * Called once from main.ts, before the app mounts, so the install prompt event isn't missed.
 * Registers the service worker (production only) and keeps the manifest link in the game's language.
 */
export function initPwa() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault() // Ours is the button on the start screen, not the browser's mini-infobar.
    deferredPrompt.value = e as BeforeInstallPromptEvent
  })
  window.addEventListener('appinstalled', () => {
    installed.value = true
    deferredPrompt.value = null
  })

  const link = document.createElement('link')
  link.rel = 'manifest'
  document.head.append(link)
  const { lang } = useI18n()
  watch(lang, (l) => (link.href = `${import.meta.env.BASE_URL}manifest-${l}.webmanifest`), { immediate: true })

  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
        // No offline mode (e.g. private browsing); the game itself works without it.
      })
    })
  }
}

/**
 * The "add to home screen" button: Chromium (Android) opens its own install dialog,
 * iOS has no such API, so the game shows how to do it from the Share menu instead.
 */
export function useInstall() {
  const mode = computed<'prompt' | 'ios' | null>(() => {
    if (installed.value || !isTouch) return null
    if (deferredPrompt.value) return 'prompt'
    return isIos ? 'ios' : null
  })

  /** Opens the browser's install dialog; the event can be used only once. */
  async function prompt() {
    const e = deferredPrompt.value
    if (!e) return
    deferredPrompt.value = null
    await e.prompt()
    const { outcome } = await e.userChoice
    if (outcome === 'accepted') installed.value = true
  }

  return { mode, prompt }
}
