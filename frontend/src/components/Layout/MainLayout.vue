<template>
  <div class="main-layout">
    <slot /> <!-- Сюда будет вставляться контент страниц -->
  </div>
</template>

<style scoped>
.main-layout {
  min-height: 100vh;
  background: linear-gradient(135deg, #0c0c1d 0%, #1a1a3e 50%, #2d2d5a 100%);
  color: white;
}
</style>