/**
 * useProfileSocket — listens for `profile:invalidated` socket events
 * from the server and re-fetches the authenticated user's profile so
 * the dashboard's plan badge, subscription countdown, and invoice
 * list refresh in real time without polling or a page reload.
 *
 * Lifecycle:
 * - `start()` connects + subscribes. Idempotent — safe to call from
 *   multiple layouts/components.
 * - `stop()` unsubscribes + disconnects. Called automatically on
 *   `onScopeDispose` so it cleans up with the consuming component.
 * - Re-fetches are throttled to one in-flight request at a time to
 *   avoid stampedes when a single server action fans out to many
 *   users (e.g. cron deactivates 50 hotels at once).
 */
import { onScopeDispose, ref } from 'vue'
import { useSocket } from '~/composables/useSocket'

const PROFILE_EVENT = 'profile:invalidated'
let inFlight: Promise<void> | null = null
const started = ref(false)

async function refetchProfile(): Promise<void> {
  if (inFlight) return inFlight
  const auth = useAuthStore()
  if (!auth.accessToken) return
  inFlight = (async () => {
    try {
      await auth.fetchProfile()
    } catch (err) {
      // fetchProfile already logs/handles its own errors. Never let
      // a socket-driven re-fetch crash the UI.
      // eslint-disable-next-line no-console
      console.warn('[profile-socket] re-fetch failed', err)
    } finally {
      inFlight = null
    }
  })()
  return inFlight
}

export function useProfileSocket() {
  let unsubscribe: (() => void) | null = null

  function start() {
    if (started.value) return
    const { on } = useSocket()
    unsubscribe = on(PROFILE_EVENT, () => {
      // Fire-and-forget; refetchProfile deduplicates concurrent calls.
      void refetchProfile()
    })
    started.value = true
  }

  function stop() {
    unsubscribe?.()
    unsubscribe = null
    started.value = false
  }

  onScopeDispose(stop)

  return {
    start,
    stop,
    isStarted: started,
  }
}