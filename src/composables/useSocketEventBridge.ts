/**
 * Universal socket event bridge.
 *
 * Catches every incoming socket event and:
 *   - shows a toast with a SEMANTIC colour (info / success / warning
 *     / error) — never the primary brand colour — so the user can
 *     tell at a glance whether something is routine, positive,
 *     attention-required, or a failure
 *   - rings a bell tuned to the same tone (soft for info, louder
 *     and more repeats for errors)
 *   - leaves the dedicated `notification` and `notification:unread-count`
 *     handlers in `useNotificationListener` to do their rich work
 *     (persistent toast, bell looping, inbox prepend, etc.)
 *
 * The socket's `connect` event is intentionally NOT toasted — it's
 * a transport-level handshake, not a user-facing event.
 */
import { useSocket } from './useSocket'
import { useBell } from './useBell'

const SKIP_EVENTS = new Set<string>([
  'connect',
  'disconnect',
  'connect_error',
  'reconnect',
  'reconnect_attempt',
  'reconnect_error',
  'reconnect_failed',
  'ping',
  'pong',
  // Rich-handled elsewhere; don't double-toast
  'notification',
  'notification:unread-count',
  // The server emits a personalised `welcome` event after
  // handshake; useWelcomeListener owns that toast (it includes
  // the user's name and the 👋 icon). Skipping here prevents a
  // generic "Welcome" toast from stacking on top of it.
  'welcome',
])

/** Hints that mark an event as DANGER → red/error toast. */
const DANGER_HINTS = [
  'error',
  'critical',
  'alert',
  'danger',
  'failed',
  'failure',
  'overdue',
  'expired',
  'cancelled',
  'canceled',
  'declined',
  'rejected',
  'fraud',
  'breach',
]

/** Hints that mark an event as POSITIVE → green/success toast. */
const SUCCESS_HINTS = [
  'success',
  'completed',
  'confirmed',
  'verified',
  'paid',
  'checked-in',
  'checked-out',
  'checkin',
  'checkout',
]

/** Hints that mark an event as BOOKING-related — warning toast. */
const BOOKING_HINTS = ['booking', 'reservation', 'guest']

function humanizeEventName(event: string): string {
  return event
    .replace(/[:._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((w) => (w.length <= 2 ? w.toUpperCase() : w[0]!.toUpperCase() + w.slice(1)))
    .join(' ')
}

type ToastTone = 'error' | 'success' | 'warning' | 'info'

function classify(event: string, data: any): ToastTone {
  const blob = `${event} ${JSON.stringify(data ?? {})}`.toLowerCase()
  if (DANGER_HINTS.some((h) => blob.includes(h))) return 'error'
  if (SUCCESS_HINTS.some((h) => blob.includes(h))) return 'success'
  if (BOOKING_HINTS.some((h) => blob.includes(h))) return 'warning'
  return 'info'
}

function bellVolume(tone: ToastTone): number {
  if (tone === 'error') return 0.8
  if (tone === 'warning') return 0.6
  if (tone === 'success') return 0.5
  return 0.25
}

function bellRepeats(tone: ToastTone): number {
  if (tone === 'error') return 3
  if (tone === 'warning') return 2
  if (tone === 'success') return 2
  return 1
}

function toastIcon(tone: ToastTone): string {
  if (tone === 'error') return 'i-heroicons-exclamation-triangle'
  if (tone === 'warning') return 'i-heroicons-bell-alert'
  if (tone === 'success') return 'i-heroicons-check-circle'
  return 'i-heroicons-bolt'
}

function buildDescription(data: any): string {
  if (data == null) return ''
  if (typeof data === 'string') return data
  if (typeof data === 'number' || typeof data === 'boolean') return String(data)
  if (typeof data !== 'object') return ''

  const obj = data as Record<string, any>
  for (const key of ['message', 'msg', 'body', 'description', 'detail', 'text', 'note']) {
    if (typeof obj[key] === 'string' && obj[key].trim()) return obj[key]
  }
  for (const key of ['title', 'name', 'subject']) {
    if (typeof obj[key] === 'string' && obj[key].trim()) return obj[key]
  }
  if (obj.type && obj.data) {
    return typeof obj.data === 'string' ? obj.data : JSON.stringify(obj.data)
  }
  try {
    const json = JSON.stringify(obj)
    return json.length > 200 ? `${json.slice(0, 197)}…` : json
  } catch {
    return ''
  }
}

export function useSocketEventBridge() {
  const socket = useSocket()
  const bell = useBell()
  const toast = useToast()

  function handleEvent(event: string, payload: any) {
    if (!event || SKIP_EVENTS.has(event)) return
    if (payload === undefined || payload === null) return

    const description = buildDescription(payload)
    const tone = classify(event, payload)
    const title = humanizeEventName(event)

    if (description) {
      toast.add({
        title,
        description,
        color: tone,
        icon: toastIcon(tone),
      } as any)
    } else {
      toast.add({
        title,
        color: tone,
        icon: toastIcon(tone),
      } as any)
    }

    try {
      bell.play({
        volume: bellVolume(tone),
        repeats: bellRepeats(tone),
        repeatDelay: 500,
      })
    } catch {
      // never break a socket event over a sound failure
    }
  }

  function setup() {
    return socket.onAny(handleEvent)
  }

  function teardown(unsubscribe?: () => void) {
    if (unsubscribe) {
      unsubscribe()
    } else {
      socket.offAny(handleEvent)
    }
  }

  return { setup, teardown, handleEvent }
}
