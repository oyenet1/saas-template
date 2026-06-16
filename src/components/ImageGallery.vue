<script setup lang="ts">
const props = defineProps<{
  images: string[]
  title: string
}>()

const currentIndex = ref(0)
const total = props.images.length
const currentImage = computed(() => props.images[currentIndex.value])

function prev() {
  currentIndex.value = (currentIndex.value - 1 + total) % total
}

function next() {
  currentIndex.value = (currentIndex.value + 1) % total
}

function goTo(index: number) {
  currentIndex.value = index
}
</script>

<template>
  <div>
    <div class="relative aspect-[16/9] rounded-xl overflow-hidden bg-elevated border border-default group">
      <img
        :src="currentImage"
        :alt="`${title} - Image ${currentIndex + 1}`"
        class="w-full h-full object-cover"
      />

      <button
        v-if="total > 1"
        type="button"
        class="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-default/80 backdrop-blur-sm text-default hover:bg-default opacity-0 group-hover:opacity-100 transition-opacity"
        @click="prev"
        aria-label="Previous image"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
      </button>

      <button
        v-if="total > 1"
        type="button"
        class="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-default/80 backdrop-blur-sm text-default hover:bg-default opacity-0 group-hover:opacity-100 transition-opacity"
        @click="next"
        aria-label="Next image"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
      </button>

      <div class="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-default/80 backdrop-blur-sm text-xs font-medium">
        {{ currentIndex + 1 }} / {{ total }}
      </div>
    </div>

    <div v-if="total > 1" class="flex gap-2 mt-3 overflow-x-auto pb-1">
      <button
        v-for="(image, index) in images"
        :key="image"
        type="button"
        class="shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-colors"
        :class="index === currentIndex ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100'"
        @click="goTo(index)"
      >
        <img :src="image" :alt="`${title} thumbnail ${index + 1}`" class="w-full h-full object-cover" loading="lazy" />
      </button>
    </div>
  </div>
</template>
