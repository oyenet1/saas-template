<script setup lang="ts">
const slides = [
  {
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=80',
    alt: 'Luxury villa with ocean view',
  },
  {
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80',
    alt: 'Modern luxury living room',
  },
  {
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&q=80',
    alt: 'Elegant mansion entrance',
  },
  {
    image: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb144?w=1920&q=80',
    alt: 'Luxury estate with pool',
  },
  {
    image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1920&q=80',
    alt: 'Minimalist luxury interior',
  },
  {
    image: 'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=1920&q=80',
    alt: 'Grand stairway with chandelier',
  },
  {
    image: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=1920&q=80',
    alt: 'Modern kitchen with ocean views',
  },
  {
    image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1920&q=80',
    alt: 'Luxury bedroom suite',
  },
]

const current = ref(0)
const isPaused = ref(false)
const total = slides.length

function next() {
  current.value = (current.value + 1) % total
}

onMounted(() => {
  const timer = setInterval(() => {
    if (!isPaused.value) next()
  }, 5000)
  onUnmounted(() => clearInterval(timer))
})
</script>

<template>
  <section
    class="relative h-dvh flex flex-col overflow-hidden bg-white"
    @mouseenter="isPaused = true"
    @mouseleave="isPaused = false"
  >
    <div
      v-for="(slide, i) in slides"
      :key="i"
      class="absolute inset-0 z-0 transition-opacity duration-1000 ease-out"
      :class="i === current ? 'opacity-100' : 'opacity-0'"
    >
      <img
        :src="slide.image"
        :alt="slide.alt"
        class="w-full h-full object-cover scale-105"
        loading="eager"
      />
    </div>
    <div class="absolute inset-0 bg-gradient-to-r from-[var(--surface-page)] via-[var(--surface-page)]/90 to-[var(--surface-page)]/30 z-10" />
    <div class="absolute inset-0 bg-gradient-to-t from-[var(--surface-page)]/90 via-transparent to-transparent z-10" />

    <div class="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-20 lg:pt-28">
      <div class="max-w-2xl">
        <span class="badge-soft mb-5">
          Premium Property Management
        </span>
        <h1 class="text-4xl sm:text-5xl lg:text-[3.5rem] font-semibold leading-[1.1] text-default">
          Find Your Perfect<br />
          <span class="text-primary italic">Place to Call Home</span>
        </h1>
        <p class="mt-5 text-lg text-muted leading-relaxed max-w-lg">
          Explore a curated collection of exceptional properties in the world's most sought-after locations — from beachfront villas to urban penthouses.
        </p>
        <div class="mt-8 flex flex-wrap gap-4">
          <a href="/properties" class="btn-primary">
            Explore Properties
            <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </a>
          <a href="/about" class="btn-outline">
            About Us
          </a>
        </div>
      </div>

      <div class="mt-12 lg:mt-16 surface-card p-5 lg:p-6 shadow-[var(--shadow-card)] backdrop-blur-sm bg-white/95 dark:bg-[var(--surface-elevated)]/95">
        <p class="text-xs font-semibold uppercase tracking-wider text-muted mb-3">Search Listings</p>
        <form action="/properties" method="GET" class="flex flex-col lg:flex-row gap-3">
          <div class="flex-1">
            <input
              type="text"
              name="search"
              placeholder="Search by city, location, or keyword..."
              class="input-field"
            />
          </div>
          <select name="type" class="input-field lg:max-w-[180px]">
            <option value="">All Types</option>
            <option value="villa">Villa</option>
            <option value="house">House</option>
            <option value="apartment">Apartment</option>
            <option value="penthouse">Penthouse</option>
            <option value="land">Land</option>
          </select>
          <select name="status" class="input-field lg:max-w-[160px]">
            <option value="">Buy & Rent</option>
            <option value="sale">For Sale</option>
            <option value="rent">For Rent</option>
          </select>
          <button type="submit" class="btn-primary shrink-0 justify-center">
            Search
          </button>
        </form>
      </div>
    </div>

    <div class="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
      <button
        v-for="(_, i) in slides"
        :key="i"
        type="button"
        class="w-2 h-2 rounded-full transition-all duration-300"
        :class="i === current ? 'w-6 bg-primary' : 'bg-white/60 hover:bg-white/90'"
        :aria-label="`Go to slide ${i + 1}`"
        @click="current = i"
      />
    </div>
  </section>
</template>
