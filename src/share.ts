import { ref } from 'vue'
import { useI18n } from './i18n/useI18n'

/**
 * Shares a page of the game: the system share sheet where there is one, otherwise the link is
 * copied and `copied` is true for two seconds, so the button can say so.
 */
export function useShare() {
  const { t, lang } = useI18n()
  const copied = ref(false)
  let resetTimer: ReturnType<typeof setTimeout> | undefined

  /**
   * @param path Page to share, relative to the game's address (a result's "r/<lang>/<id>/"); by
   *   default the game's own page in the current language (<lang>/), so the link previews in the
   *   sender's language and opens the game in it.
   * @param text Message beside the link; the game's tagline by default.
   */
  async function share(path?: string, text?: string) {
    const url = location.origin + location.pathname + (path ?? `${lang.value}/`)
    const data: ShareData = { title: t('app.title'), text: text ?? t('share.text'), url }

    // Phones, Safari and Chromium on Windows/macOS open the system share sheet.
    if (navigator.share && (navigator.canShare?.(data) ?? true)) {
      try {
        await navigator.share(data)
      } catch {
        // Closing the sheet rejects with AbortError: nothing to do.
      }
      return
    }

    // Elsewhere (Firefox, Chromium on Linux) copy the link.
    try {
      await navigator.clipboard.writeText(url)
      copied.value = true
      clearTimeout(resetTimer)
      resetTimer = setTimeout(() => (copied.value = false), 2000)
    } catch {
      window.prompt(t('share.button'), url)
    }
  }

  return { share, copied }
}
