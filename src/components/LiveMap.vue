<template>
  <div
    class="relative w-full overflow-hidden rounded-xl border border-default bg-elevated/30"
    :style="{ height: heightPx }"
  >
    <LMap
      ref="mapRef"
      :zoom="zoom"
      :center="initialCenter"
      :use-global-leaflet="false"
      :options="{
        zoomControl: true,
        attributionControl: true,
      }"
      :style="{ height: '100%', width: '100%' }"
      @ready="onMapReady"
    >
      <LTileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        :attribution="attribution"
        :max-zoom="19"
      />

      <!-- Hotel pin -->
      <LMarker
        v-if="target"
        :lat-lng="[target.latitude, target.longitude]"
      >
        <LIcon
          :icon-size="[40, 40]"
          :icon-anchor="[20, 40]"
          class-name="lodgestatus-marker"
        >
          <div class="size-10 rounded-full bg-primary text-white grid place-items-center shadow-lg shadow-primary/40 ring-4 ring-white dark:ring-gray-950">
            <UIcon name="i-heroicons-building-office-2-solid" class="size-5" />
          </div>
        </LIcon>
        <LTooltip :options="{ direction: 'top', offset: [0, -40] }">
          <strong>{{ targetLabel || 'Hotel' }}</strong>
        </LTooltip>
      </LMarker>

      <!-- User pin (live) -->
      <LMarker
        v-if="current"
        :lat-lng="[current.latitude, current.longitude]"
      >
        <LIcon
          :icon-size="[28, 28]"
          :icon-anchor="[14, 14]"
          class-name="lodgestatus-user-marker"
        >
          <div
            class="size-7 rounded-full bg-info text-white grid place-items-center shadow-lg ring-4 ring-white dark:ring-gray-950 transition-transform"
            :style="userMarkerStyle"
          >
            <div class="size-2 rounded-full bg-white" />
          </div>
        </LIcon>
      </LMarker>

      <!-- Route polyline -->
      <LPolyline
        v-if="routeLatLngs.length"
        :lat-lngs="routeLatLngs"
        :color="'#0F766E'"
        :weight="5"
        :opacity="0.85"
        :line-cap="'round'"
        :line-join="'round'"
      />

      <!-- Accuracy circle -->
      <LCircle
        v-if="current && accuracy"
        :lat-lng="[current.latitude, current.longitude]"
        :radius="accuracy"
        :color="'#0EA5E9'"
        :weight="1"
        :fill-color="'#0EA5E9'"
        :fill-opacity="0.08"
      />
    </LMap>

    <!-- Center-on-me FAB -->
    <button
      v-if="isTracking && current"
      type="button"
      class="absolute bottom-3 right-3 z-[1000] size-10 rounded-full bg-white dark:bg-gray-900 shadow-lg border border-default grid place-items-center hover:scale-105 transition"
      aria-label="Center on me"
      @click="recenter"
    >
      <UIcon name="i-heroicons-arrow-path" class="size-4 text-primary" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'

interface LatLng {
  latitude: number
  longitude: number
}

const props = withDefaults(
  defineProps<{
    current: LatLng | null
    target: LatLng | null
    route?: { geometry: [number, number][] } | null
    accuracy?: number | null
    heading?: number | null
    isTracking?: boolean
    targetLabel?: string
    height?: number | string
    zoom?: number
  }>(),
  {
    height: 320,
    zoom: 14,
    isTracking: false,
    targetLabel: 'Hotel',
    accuracy: null,
    heading: null,
    route: null,
  },
)

const heightPx = computed(() =>
  typeof props.height === 'number' ? `${props.height}px` : props.height,
)

const attribution =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

const initialCenter = computed<[number, number]>(() => {
  if (props.current) return [props.current.latitude, props.current.longitude]
  if (props.target) return [props.target.latitude, props.target.longitude]
  return [0, 0]
})

const routeLatLngs = computed<[number, number][]>(() => {
  if (!props.route?.geometry) return []
  return props.route.geometry.map(([lng, lat]) => [lat, lng])
})

const userMarkerStyle = computed(() => ({
  transform: `rotate(${props.heading ?? 0}deg)`,
}))

const mapRef = ref<any>(null)
let leafletMap: any = null

function onMapReady(map: any) {
  leafletMap = map
  fitBoundsIfReady()
}

function fitBoundsIfReady() {
  if (!leafletMap) return
  const points: [number, number][] = []
  if (props.current) points.push([props.current.latitude, props.current.longitude])
  if (props.target) points.push([props.target.latitude, props.target.longitude])
  if (props.route?.geometry?.length) {
    for (const [lng, lat] of props.route.geometry) {
      points.push([lat, lng])
    }
  }
  if (points.length >= 2) {
    leafletMap.fitBounds(points, { padding: [40, 40] })
  } else if (points.length === 1) {
    leafletMap.setView(points[0], props.zoom)
  }
}

function recenter() {
  if (!leafletMap || !props.current) return
  leafletMap.setView(
    [props.current.latitude, props.current.longitude],
    Math.max(leafletMap.getZoom(), 16),
    { animate: true },
  )
}

watch(
  () => [props.target, props.route] as const,
  async () => {
    await nextTick()
    fitBoundsIfReady()
  },
  { deep: true },
)

onMounted(() => {
  if (import.meta.client) {
    const style = document.createElement('style')
    style.textContent = `
      .lodgestatus-user-marker .leaflet-marker-icon { background: transparent; border: 0; }
      .lodgestatus-marker .leaflet-marker-icon { background: transparent; border: 0; }
    `
    document.head.appendChild(style)
  }
})
</script>
