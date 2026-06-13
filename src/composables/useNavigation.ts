/**
 * Live navigation composable.
 *
 * Streams the user's position from the browser's Geolocation API and
 * continuously calculates distance + compass bearing to a target
 * (e.g. a hotel's lat/lng).
 *
 * No external SDKs — uses pure math (Haversine + great-circle
 * bearing) so it's instant and works offline. For actual road
 * routing, call `fetchRoute()` which uses the free OSRM demo server.
 */
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { $fetch } from 'ofetch'

interface LatLng {
  latitude: number
  longitude: number
}

interface NavigationOptions {
  /** How often to update the position in ms (default 5000) */
  intervalMs?: number
  /** Enable high-accuracy GPS on mobile (default true) */
  highAccuracy?: boolean
  /** Auto-start watching position on mount (default true) */
  immediate?: boolean
}

export function useNavigation(options: NavigationOptions = {}) {
  const { intervalMs = 5000, highAccuracy = true, immediate = true } = options

  const current = ref<LatLng | null>(null)
  const target = ref<LatLng | null>(null)
  const heading = ref<number | null>(null)        // compass direction the user is facing (deg)
  const speed = ref<number | null>(null)          // m/s
  const accuracy = ref<number | null>(null)       // meters
  const error = ref<string | null>(null)
  const isTracking = ref(false)

  let watchId: number | null = null

  // ── Math helpers ────────────────────────────────────────────────────────────

  const EARTH_RADIUS_M = 6_371_000

  function toRad(deg: number) {
    return (deg * Math.PI) / 180
  }
  function toDeg(rad: number) {
    return (rad * 180) / Math.PI
  }

  /** Haversine distance in meters between two points */
  function haversineDistance(a: LatLng, b: LatLng): number {
    const φ1 = toRad(a.latitude)
    const φ2 = toRad(b.latitude)
    const Δφ = toRad(b.latitude - a.latitude)
    const Δλ = toRad(b.longitude - a.longitude)

    const h =
      Math.sin(Δφ / 2) ** 2 +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2
    return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)))
  }

  /**
   * Initial bearing (forward azimuth) from `a` to `b` in degrees,
   * 0 = north, 90 = east, 180 = south, 270 = west.
   */
  function bearingTo(a: LatLng, b: LatLng): number {
    const φ1 = toRad(a.latitude)
    const φ2 = toRad(b.latitude)
    const Δλ = toRad(b.longitude - a.longitude)

    const y = Math.sin(Δλ) * Math.cos(φ2)
    const x =
      Math.cos(φ1) * Math.sin(φ2) -
      Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)
    const θ = Math.atan2(y, x)
    return (toDeg(θ) + 360) % 360
  }

  // ── Reactive calculations ───────────────────────────────────────────────────

  const distanceMeters = computed(() => {
    if (!current.value || !target.value) return null
    return haversineDistance(current.value, target.value)
  })

  const distanceKm = computed(() =>
    distanceMeters.value == null ? null : distanceMeters.value / 1000,
  )

  /** Bearing to the target (compass direction) */
  const bearingToTarget = computed(() => {
    if (!current.value || !target.value) return null
    return bearingTo(current.value, target.value)
  })

  /**
   * Rotation (in degrees) the arrow should rotate on screen.
   * 0 = pointing north. Positive = clockwise.
   */
  const arrowRotation = computed(() => bearingToTarget.value ?? 0)

  /** Estimated walking minutes (avg 5 km/h) */
  const etaWalkingMinutes = computed(() => {
    if (distanceMeters.value == null) return null
    return Math.max(1, Math.round(distanceMeters.value / (5000 / 60)))
  })

  /** Estimated driving minutes (avg 40 km/h) */
  const etaDrivingMinutes = computed(() => {
    if (distanceMeters.value == null) return null
    return Math.max(1, Math.round(distanceMeters.value / (40000 / 60)))
  })

  /** Human-readable distance */
  const distanceLabel = computed(() => {
    if (distanceMeters.value == null) return '—'
    if (distanceMeters.value < 1000) return `${Math.round(distanceMeters.value)} m`
    return `${distanceKm.value!.toFixed(distanceKm.value! < 10 ? 2 : 1)} km`
  })

  // ── Browser geolocation ─────────────────────────────────────────────────────

  function start() {
    if (!import.meta.client) return
    if (!('geolocation' in navigator)) {
      error.value = 'Geolocation is not supported on this device'
      return
    }

    isTracking.value = true
    error.value = null

    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        current.value = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }
        heading.value = pos.coords.heading
        speed.value = pos.coords.speed
        accuracy.value = pos.coords.accuracy
        error.value = null
      },
      (err) => {
        error.value = err.message || 'Failed to get location'
        isTracking.value = false
      },
      {
        enableHighAccuracy: highAccuracy,
        maximumAge: intervalMs,
        timeout: intervalMs + 5000,
      },
    )
  }

  function stop() {
    if (watchId != null) {
      navigator.geolocation.clearWatch(watchId)
      watchId = null
    }
    isTracking.value = false
  }

  function setTarget(t: LatLng | null) {
    target.value = t
  }

  // ── OSRM road routing (optional, free public server) ───────────────────────

  interface RouteStep {
    distance: number   // meters
    duration: number   // seconds
    instruction: string
    maneuver: string
    location: [number, number] // [lng, lat]
  }

  interface Route {
    distance: number   // meters
    duration: number   // seconds
    geometry: [number, number][]
    steps: RouteStep[]
  }

  const route = ref<Route | null>(null)
  const isRouting = ref(false)

  async function fetchRoute(profile: 'foot' | 'car' = 'foot') {
    if (!current.value || !target.value) return null
    isRouting.value = true
    try {
      const url =
        `https://router.project-osrm.org/route/v1/${profile}/` +
        `${current.value.longitude},${current.value.latitude};` +
        `${target.value.longitude},${target.value.latitude}` +
        `?overview=full&geometries=geojson&steps=true`
      const data: any = await $fetch(url)
      const leg = data.routes?.[0]
      if (!leg) return null

      const steps: RouteStep[] = []
      for (const s of leg.legs?.[0]?.steps ?? []) {
        steps.push({
          distance: s.distance,
          duration: s.duration,
          instruction: s.maneuver?.instruction || '',
          maneuver: s.maneuver?.type || '',
          location: s.maneuver?.location ?? [0, 0],
        })
      }

      route.value = {
        distance: leg.distance,
        duration: leg.duration,
        geometry: leg.geometry.coordinates,
        steps,
      }
      return route.value
    } catch (err) {
      error.value = (err as Error).message || 'Routing failed'
      return null
    } finally {
      isRouting.value = false
    }
  }

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  onMounted(() => {
    if (immediate) start()
  })
  onBeforeUnmount(() => stop())

  // Auto-refresh route as the user moves (only if a route already exists)
  watch(
    () => [current.value?.latitude, current.value?.longitude] as const,
    () => {
      if (route.value && current.value && target.value) {
        fetchRoute('foot')
      }
    },
  )

  return {
    // State
    current,
    target,
    heading,
    speed,
    accuracy,
    error,
    isTracking,
    isRouting,
    route,

    // Computed
    distanceMeters,
    distanceKm,
    distanceLabel,
    bearingToTarget,
    arrowRotation,
    etaWalkingMinutes,
    etaDrivingMinutes,

    // Actions
    start,
    stop,
    setTarget,
    fetchRoute,
  }
}
