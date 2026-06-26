<script setup lang="ts">
import type { Agent } from '../data/agents'

const props = defineProps<{ agent: Agent }>()

const href = `/agents/${props.agent.slug}`
</script>

<template>
  <a
    :href="href"
    class="group block surface-card surface-card-hover overflow-hidden"
  >
    <div class="relative aspect-[4/5] overflow-hidden">
      <img
        :src="agent.imageUrl"
        :alt="agent.name"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        loading="lazy"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      <div class="absolute bottom-0 left-0 right-0 p-5">
        <span
          v-if="agent.featured"
          class="px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide bg-primary text-white shadow-sm mb-2 inline-block"
        >
          Featured
        </span>
        <h3 class="text-white text-lg font-semibold">{{ agent.name }}</h3>
        <p class="text-white/80 text-sm">{{ agent.title }}</p>
      </div>
    </div>

    <div class="p-5 space-y-3">
      <div class="flex items-center gap-1">
        <svg
          v-for="i in agent.rating"
          :key="i"
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="currentColor"
          class="text-amber-400"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      </div>

      <div class="flex flex-wrap gap-1.5">
        <span
          v-for="s in agent.specialties.slice(0, 3)"
          :key="s"
          class="px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary border border-primary/20"
        >
          {{ s }}
        </span>
      </div>

      <div class="flex items-center gap-4 pt-2 text-sm text-muted">
        <span>{{ agent.propertiesSold }} sold</span>
        <span>{{ agent.experience }} yrs</span>
      </div>
    </div>
  </a>
</template>
