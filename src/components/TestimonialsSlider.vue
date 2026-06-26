<script setup lang="ts">
import type { Testimony } from '../lib/api'

const testimonials = ref<Testimony[]>([])

onMounted(async () => {
  const { getTestimonies } = await import('../lib/api')
  testimonials.value = await getTestimonies()
})

const current = ref(0)
const isPaused = ref(false)
const total = testimonials.length

function prev() {
  current.value = (current.value - 1 + total) % total
}

function next() {
  current.value = (current.value + 1) % total
}

function goTo(index: number) {
  current.value = index
}

onMounted(() => {
  const timer = setInterval(() => {
    if (!isPaused.value) next()
  }, 5000)
  onUnmounted(() => clearInterval(timer))
})
</script>

<template>
  <div
    class="relative"
    @mouseenter="isPaused = true"
    @mouseleave="isPaused = false"
  >
    <div class="overflow-hidden">
      <div
        class="flex transition-transform duration-700 ease-out"
        :style="{ transform: `translateX(-${current * 100}%)` }"
      >
        <div
          v-for="(t, i) in testimonials"
          :key="i"
          class="min-w-0 w-full shrink-0 px-0.5"
        >
          <div class="surface-card p-8 lg:p-12 mx-auto max-w-3xl">
            <div class="flex items-center gap-1 mb-6">
              <svg
                v-for="star in 5"
                :key="star"
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                :class="star <= t.rating ? 'text-amber-400' : 'text-[var(--surface-border)]'"
                fill="currentColor"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>

            <blockquote class="text-lg lg:text-xl leading-relaxed text-default font-[family-name:var(--font-display)] italic tracking-tight">
              &ldquo;{{ t.content }}&rdquo;
            </blockquote>

            <div class="flex items-center gap-4 mt-8 pt-6 border-t border-[var(--surface-border)]">
              <img
                :src="t.imageUrl"
                :alt="t.name"
                class="w-12 h-12 rounded-full object-cover ring-2 ring-[var(--surface-border)]"
              />
              <div>
                <p class="font-semibold text-sm">{{ t.name }}</p>
                <p class="text-xs text-muted mt-0.5">{{ t.title }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <button
      type="button"
      class="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 rounded-full surface-card flex items-center justify-center text-default hover:text-primary transition-colors shadow-[var(--shadow-card)] z-10"
      @click="prev"
      aria-label="Previous testimonial"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
    </button>

    <button
      type="button"
      class="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 rounded-full surface-card flex items-center justify-center text-default hover:text-primary transition-colors shadow-[var(--shadow-card)] z-10"
      @click="next"
      aria-label="Next testimonial"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
    </button>

    <div class="flex justify-center gap-2 mt-8">
      <button
        v-for="i in total"
        :key="i"
        type="button"
        class="w-2 h-2 rounded-full transition-all duration-300"
        :class="i - 1 === current ? 'w-6 bg-primary' : 'bg-[var(--surface-border)] hover:bg-[var(--ui-color-neutral-300)]'"
        :aria-label="`Go to testimonial ${i}`"
        @click="goTo(i - 1)"
      />
    </div>
  </div>
</template>
