<script setup lang="ts">
const route = useRoute()
const announcement = ref('')

watch(
  () => route.fullPath,
  () => {
    announcement.value = document.title || route.path
  },
  { immediate: true },
)
</script>

<template>
  <div
    aria-live="polite"
    aria-atomic="true"
    class="sr-only"
  >
    {{ announcement }}
  </div>
</template>
