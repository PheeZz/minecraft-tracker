<script setup lang="ts"></script>

<template>
  <section class="placeholder">
    <h1 class="placeholder__title">Селекция деревьев</h1>
    <p class="placeholder__hint">Трекер деревьев появится здесь (Этапы 2–5).</p>
  </section>
</template>

<style scoped>
.placeholder {
  display: grid;
  place-content: center;
  height: 100%;
  text-align: center;
  gap: 8px;
}
.placeholder__title {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 28px;
  color: var(--leaf);
  margin: 0;
}
.placeholder__hint {
  color: var(--muted);
  margin: 0;
}
</style>
