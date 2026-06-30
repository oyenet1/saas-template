<script setup lang="ts">
import type { Property } from '../lib/api'
import { formatPrice } from '../lib/api'

const props = defineProps<{ property: Property }>()

const href = `/properties/${props.property.slug}`
</script>

<template>
  <a
    :href="href"
    class="group block surface-card surface-card-hover overflow-hidden"
  >
    <div class="relative aspect-[4/3] overflow-hidden">
      <img
        :src="property.images[0]"
        :alt="property.title"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        loading="lazy"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div class="absolute top-3 left-3 flex flex-wrap gap-2">
        <span class="px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide bg-white/95 text-default shadow-sm backdrop-blur-sm">
          {{ property.status === 'sale' ? 'For Sale' : 'For Rent' }}
        </span>
        <span
          v-if="property.featured"
          class="px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide bg-primary text-white shadow-sm"
        >
          Featured
        </span>
      </div>
    </div>

    <div class="p-5">
      <h3 class="font-semibold text-base group-hover:text-primary transition-colors line-clamp-1">
        {{ property.title }}
      </h3>
      <p class="text-sm text-muted mt-1.5 flex items-center gap-1.5">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
        {{ property.location }}
      </p>

      <div class="flex items-center gap-4 mt-4 pt-4 border-t border-[var(--surface-border)]">
        <div class="flex items-center gap-1.5 text-xs font-medium text-muted">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
          {{ property.bedrooms }} bd
        </div>
        <div class="flex items-center gap-1.5 text-xs font-medium text-muted">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 22H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4"/><path d="M15 22h5a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-4"/><path d="M9 2h6v4H9z"/></svg>
          {{ property.bathrooms }} ba
        </div>
        <div class="flex items-center gap-1.5 text-xs font-medium text-muted">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
          {{ property.area.toLocaleString() }} sqft
        </div>
      </div>

      <p class="mt-4 text-xl font-semibold text-primary font-[family-name:var(--font-display)]">
        {{ formatPrice(property.price, property.status, property.currency) }}
      </p>
    </div>
  </a>
</template>
