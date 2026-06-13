<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: ['platform-staff'] })

const route = useRoute()
const router = useRouter()

const tabs = [
  { label: 'Cities',  to: '/platform/locations/cities',  icon: 'i-heroicons-building-office-2' },
  { label: 'States',  to: '/platform/locations/states',  icon: 'i-heroicons-map' },
]

function isActive(to: string) {
  return route.path === to
}
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-10 space-y-5 sm:space-y-6 max-w-[1400px]">
    <header>
      <p class="text-xs font-semibold tracking-[0.2em] uppercase text-primary">Platform · Tenants</p>
      <h1 class="text-xl sm:text-2xl font-bold tracking-tight">Locations</h1>
      <p class="text-sm text-muted mt-1">Cities and states with live hotel counts.</p>
    </header>

    <div class="border-b border-gray-200 dark:border-gray-800 -mx-4 sm:mx-0 px-4 sm:px-0 overflow-x-auto">
      <div class="flex items-center gap-1 min-w-max">
        <UButton
          v-for="t in tabs"
          :key="t.to"
          :to="t.to"
          :variant="isActive(t.to) ? 'soft' : 'ghost'"
          :color="isActive(t.to) ? 'primary' : 'neutral'"
          :icon="t.icon"
          size="sm"
        >
          {{ t.label }}
        </UButton>
      </div>
    </div>

    <NuxtPage v-if="false" />

    <div class="grid sm:grid-cols-2 gap-4">
      <NuxtLink
        to="/platform/locations/cities"
        class="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 hover:border-primary hover:shadow-md transition-all"
      >
        <div class="size-10 rounded-lg bg-primary/10 text-primary grid place-items-center mb-3">
          <UIcon name="i-heroicons-building-office-2" class="size-5" />
        </div>
        <p class="font-semibold">Cities</p>
        <p class="text-xs text-muted mt-1">Browse every city with hotel count.</p>
      </NuxtLink>
      <NuxtLink
        to="/platform/locations/states"
        class="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 hover:border-primary hover:shadow-md transition-all"
      >
        <div class="size-10 rounded-lg bg-primary/10 text-primary grid place-items-center mb-3">
          <UIcon name="i-heroicons-map" class="size-5" />
        </div>
        <p class="font-semibold">States</p>
        <p class="text-xs text-muted mt-1">Browse every state / region with hotel count.</p>
      </NuxtLink>
    </div>
  </div>
</template>
