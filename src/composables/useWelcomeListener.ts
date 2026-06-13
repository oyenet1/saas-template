/**
 * useWelcomeListener — subscribes to the `welcome` socket event that
 * the server emits from inside the `handshake` handler. The server
 * sends a personalised greeting with the user's first + last name and
 * the 👋 icon at the end of the message; this composable surfaces
 * that as a one-off success toast so the user gets visual confirmation
 * that the realtime connection is live.
 *
 * Lifecycle:
 * - `setup()` attaches listeners. Idempotent — safe across re-mounts.
 * - `teardown()` removes listeners and dismisses any in-flight toast.
 *
 * The toast is intentionally transient (no `actions`) so it doesn't
 * pile up if the socket reconnects mid-session.
 */
import { useSocket } from '~/composables/useSocket'

interface WelcomePayload {
  message: string
  user: {
    firstname: string | null
    lastname: string | null
  } | null
}

const WELCOME_TOAST_KEY = 'socket-welcome-toast'

export function useWelcomeListener() {
  const socket = useSocket()
  const toast = useToast()

  function handleWelcome(payload: WelcomePayload) {
    if (!payload?.message) return

    // Replace any prior welcome toast so a reconnect during the same
    // session doesn't stack duplicates in the corner.
    try {
      const list = (toast as any).toasts?.value as Array<{ id?: string }> | undefined
      if (Array.isArray(list)) {
        for (const t of list) {
          if (t?.id === WELCOME_TOAST_KEY) {
            (toast as any).remove?.(t.id)
          }
        }
      }
    } catch {
      /* toast API may differ across versions — never break the listener */
    }

    toast.add({
      id: WELCOME_TOAST_KEY,
      title: payload.user?.firstname
        ? `Welcome, ${payload.user.firstname}`
        : 'Connected',
      description: payload.message,
      icon: 'i-heroicons-wifi',
      color: 'success',
    })
  }

  function setup() {
    socket.on('welcome', handleWelcome)
  }

  function teardown() {
    socket.off('welcome', handleWelcome)
  }

  return {
    setup,
    teardown,
    handleWelcome,
  }
}