<template>
  <div
    class="relative overflow-hidden rounded-2xl border border-default bg-white dark:bg-gray-950 shadow-lg shadow-gray-900/5 dark:shadow-black/20"
  >
    <!-- Background gradient -->
    <div
      class="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none"
    />

    <!-- Header -->
    <div class="relative flex items-center justify-between p-5 pb-3">
      <div class="flex items-center gap-2">
        <div
          class="size-9 rounded-xl grid place-items-center bg-primary/10 text-primary"
        >
          <UIcon
            :name="isTracking ? 'i-heroicons-signal' : 'i-heroicons-map-pin'"
            class="size-5"
          />
        </div>
        <div>
          <p class="font-semibold text-sm leading-tight">Navigate to hotel</p>
          <p class="text-xs text-muted">
            {{ isTracking ? 'Live tracking active' : 'Tap to start' }}
          </p>
        </div>
      </div>
      <div class="flex items-center gap-1.5">
        <UButton
          v-if="isTracking"
          size="sm"
          color="neutral"
          variant="ghost"
          icon="i-heroicons-map"
          @click="mapOpen = !mapOpen"
        >
          {{ mapOpen ? 'Hide map' : 'Map' }}
        </UButton>
        <UButton
          v-if="!isTracking"
          size="sm"
          color="primary"
          icon="i-heroicons-play"
          @click="start"
        >
          Start
        </UButton>
        <UButton
          v-else
          size="sm"
          color="neutral"
          variant="ghost"
          icon="i-heroicons-stop"
          @click="stop"
        >
          Stop
        </UButton>
      </div>
    </div>

    <!-- Compass + distance (always visible when tracking) -->
    <div v-if="isTracking" class="relative grid grid-cols-2 gap-4 p-5 pt-0">
      <!-- Compass -->
      <div class="flex flex-col items-center justify-center">
        <div
          class="relative size-32 rounded-full border-2 border-default bg-elevated/30 flex items-center justify-center"
        >
          <span class="absolute top-1 text-[10px] font-semibold text-muted">N</span>
          <span class="absolute right-1 text-[10px] font-semibold text-muted">E</span>
          <span class="absolute bottom-1 text-[10px] font-semibold text-muted">S</span>
          <span class="absolute left-1 text-[10px] font-semibold text-muted">W</span>

          <UIcon
            name="i-heroicons-arrow-up-circle-solid"
            class="size-16 text-primary drop-shadow-md transition-transform duration-500 ease-out"
            :style="{ transform: `rotate(${arrowRotation}deg)` }"
          />
        </div>
        <p class="text-[11px] text-muted mt-2">
          {{ bearingToTarget ? `${Math.round(bearingToTarget)}° to target` : 'Acquiring…' }}
        </p>
      </div>

      <!-- Distance + ETA -->
      <div class="flex flex-col justify-center gap-2">
        <div>
          <p class="text-3xl font-bold tabular-nums leading-none">
            {{ distanceLabel }}
          </p>
          <p class="text-xs text-muted mt-1">away from hotel</p>
        </div>
        <div class="flex items-center gap-2 text-xs">
          <div class="flex items-center gap-1 text-muted">
            <UIcon name="i-heroicons-clock" class="size-3.5" />
            <span>{{ etaWalkingMinutes }} min walk</span>
          </div>
          <span class="text-muted">·</span>
          <div class="flex items-center gap-1 text-muted">
            <UIcon name="i-heroicons-truck" class="size-3.5" />
            <span>{{ etaDrivingMinutes }} min drive</span>
          </div>
        </div>
        <UButton
          size="xs"
          variant="soft"
          color="neutral"
          icon="i-heroicons-map"
          :loading="isRouting"
          @click="fetchRoute('foot')"
        >
          {{ isRouting ? 'Routing…' : 'Walking route' }}
        </UButton>
      </div>
    </div>

    <!-- Map (toggled) -->
    <div v-if="isTracking && mapOpen" class="px-5 pb-5">
      <ClientOnly>
        <LiveMap
          :current="current"
          :target="target"
          :route="route"
          :accuracy="accuracy"
          :heading="heading"
          :is-tracking="isTracking"
          target-label="Hotel"
          :height="360"
        />
        <template #fallback>
          <div
            class="flex items-center justify-center rounded-xl border border-default bg-elevated/30 text-muted text-sm"
            style="height: 360px"
          >
            <UIcon name="i-heroicons-map" class="size-5 mr-2 animate-pulse" />
            Loading map…
          </div>
        </template>
      </ClientOnly>
    </div>

    <!-- Error -->
    <UAlert
      v-if="error"
      color="error"
      variant="soft"
      :title="error"
      icon="i-heroicons-exclamation-triangle"
      class="m-5 mt-0"
    />

    <!-- Route steps -->
    <div
      v-if="route && route.steps.length"
      class="relative border-t border-default p-5 max-h-64 overflow-y-auto"
    >
      <p class="text-xs font-semibold uppercase tracking-wider text-muted mb-3">
        Turn-by-turn · {{ Math.round(route.distance) }} m · {{ Math.round(route.duration / 60) }} min
      </p>
      <ol class="space-y-2.5">
        <li
          v-for="(step, i) in route.steps.slice(0, 12)"
          :key="i"
          class="flex items-start gap-3 text-sm"
        >
          <span
            class="size-6 shrink-0 rounded-full bg-elevated grid place-items-center text-[10px] font-semibold"
          >
            {{ i + 1 }}
          </span>
          <div class="min-w-0 flex-1">
            <p class="leading-snug">{{ step.instruction || formatManeuver(step.maneuver) }}</p>
            <p v-if="step.distance" class="text-[11px] text-muted">
              {{ Math.round(step.distance) }} m
            </p>
          </div>
        </li>
      </ol>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useNavigation } from '~/composables/useNavigation'

const props = defineProps<{
  /** Target hotel latitude */
  latitude: number | null | undefined
  /** Target hotel longitude */
  longitude: number | null | undefined
  /** Update interval in ms (default 5000) */
  intervalMs?: number
}>()

const mapOpen = ref(false)

const {
  current,
  target,
  heading,
  accuracy,
  isTracking,
  isRouting,
  error,
  route,
  distanceLabel,
  bearingToTarget,
  arrowRotation,
  etaWalkingMinutes,
  etaDrivingMinutes,
  start,
  stop,
  setTarget,
  fetchRoute,
} = useNavigation({
  intervalMs: props.intervalMs ?? 5000,
  immediate: false,
})

// Sync target whenever the prop changes
watch(
  () => [props.latitude, props.longitude] as const,
  ([lat, lng]) => {
    if (lat != null && lng != null) {
      setTarget({ latitude: lat, longitude: lng })
    }
  },
  { immediate: true },
)

function formatManeuver(type: string) {
  if (!type) return 'Continue'
  const map: Record<string, string> = {
    turn: 'Turn',
    'new name': 'Continue onto a new road',
    depart: 'Start',
    arrive: 'You have arrived',
    merge: 'Merge',
    fork: 'Take the fork',
    roundabout: 'Enter the roundabout',
    rotary: 'Enter the rotary',
  }
  return map[type] || type
}
</script>
