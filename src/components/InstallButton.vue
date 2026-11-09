<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from '../i18n/useI18n'
import { useInstall } from '../pwa'

const { t } = useI18n()
const { mode, prompt } = useInstall()
const dialog = ref<HTMLDialogElement>()
// The text around the Share icon: "Tap Share {icon}. …" -> ["Tap Share", ". …"].
const step1 = computed(() => t('install.step1', { icon: '\n' }).split('\n'))

function onClick() {
  if (mode.value === 'prompt') prompt()
  else dialog.value?.showModal()
}

// A tap on the dimmed backdrop (the dialog element itself, outside its content) closes it.
function onDialogClick(e: MouseEvent) {
  if (e.target === dialog.value) dialog.value.close()
}
</script>

<template>
  <template v-if="mode">
    <button type="button" class="install" @click="onClick">{{ t('install.button') }}</button>

    <dialog v-if="mode === 'ios'" ref="dialog" class="hint" @click="onDialogClick">
      <div class="hint__body">
        <h2>{{ t('install.title') }}</h2>
        <ol>
          <!-- Safari's Share icon (a square with an arrow out of its top), where the text has {icon};
               no whitespace around it, or a space would show before the full stop. -->
          <li>{{ step1[0] }}<svg class="share" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7.5 7.5 12 3l4.5 4.5M8 10H6v11h12V10h-2" /></svg>{{ step1[1] }}</li>
          <li>{{ t('install.step2') }}</li>
          <li>{{ t('install.step3') }}</li>
        </ol>
        <form method="dialog">
          <button class="btn">{{ t('install.close') }}</button>
        </form>
      </div>
    </dialog>
  </template>
</template>

<style scoped>
/* Same quiet text-link look as "About" beside it. */
.install {
  padding: 0 12px;
  border: 0;
  background: none;
  color: var(--muted);
  font-family: var(--font-body);
  font-size: 16px;
  line-height: 1.2;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;

  &:hover {
    color: var(--text);
  }
}

.hint {
  max-width: min(400px, calc(100vw - 32px));
  padding: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--text);

  &::backdrop {
    background: rgb(0 0 0 / 0.6);
  }
}

.hint__body {
  padding: 20px;
  text-align: left;
}

h2 {
  margin: 0 0 12px;
  font-size: 24px;
  color: var(--gold);
}

ol {
  margin: 0;
  padding-left: 22px;
  font-size: 18px;
  line-height: 1.35;

  & li + li {
    margin-top: 8px;
  }
}

.share {
  display: inline-block;
  width: 20px;
  height: 20px;
  vertical-align: -3px;
  fill: none;
  stroke: var(--gold);
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

form {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
