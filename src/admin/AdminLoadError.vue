<script setup lang="ts">
// Shown when the admin chunk can't be fetched even after a reload (most likely offline).
const retry = () => location.reload()
</script>

<template>
  <div class="load-error" role="alert">
    <p>Не удалось загрузить админку. Проверь подключение к интернету.</p>
    <div class="actions">
      <button type="button" @click="retry">Повторить</button>
      <a href="#/">← К игре</a>
    </div>
  </div>
</template>

<style scoped>
.load-error {
  max-width: var(--page-width);
  margin: 0 auto;
  padding: 64px 16px;
  color: var(--text);
  text-align: center;
}

.actions {
  display: flex;
  gap: var(--gap);
  justify-content: center;
  align-items: center;
  margin-top: var(--gap);
}

button {
  padding: 8px 16px;
  border: 1px solid var(--gold-soft);
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--gold);
  font: inherit;
}

a {
  color: var(--gold);
  text-decoration: none;
}
</style>
