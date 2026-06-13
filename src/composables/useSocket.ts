/**
 * Socket.IO client composable.
 *
 * Lazily creates a single shared connection that auto-reconnects.
 *
 * Usage:
 *   const socket = useSocket()
 *
 *   socket.on('booking:created', (data) => { ... })
 *   socket.emit('event:join', { room: 'admin' })
 *   socket.disconnect()
 */
import { io, type Socket } from 'socket.io-client'
import { getApiBase, getSocketUrl } from '~/composables/useRuntimeConfig'

let socket: Socket | null = null

interface UseSocketOptions {
  /** Override the default URL (defaults to same-origin `/v2` namespace via runtime config) */
  url?: string
  /** Auto-connect on first use (default: true) */
  autoConnect?: boolean
  /** Auth token sent in the handshake */
  auth?: Record<string, any> | (() => Record<string, any>)
  /** Optional query params */
  query?: Record<string, any>
  /** Force a new transport (default: false) */
  forceNew?: boolean
}

export function useSocket(options: UseSocketOptions = {}) {
  const baseUrl =
    options.url
    ?? getSocketUrl()
    ?? getApiBase()
    ?? (typeof window !== 'undefined' ? window.location.origin : '')

  if (!socket) {
    socket = io(baseUrl, {
      // Default off: the socket only connects when an authenticated
      // surface (the dashboard layout) explicitly opts in. Without
      // this, the socket would dial the server on every page —
      // including the public sign-in / forgot-password screens —
      // and the server would have nothing to identify the connection
      // with, producing noisy reconnect churn.
      autoConnect: options.autoConnect ?? false,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      forceNew: options.forceNew ?? false,
      auth: typeof options.auth === 'function' ? options.auth() : options.auth,
      query: options.query,
    })

    if (import.meta.client) {
      socket.on('connect', () => {
        // eslint-disable-next-line no-console
        console.info('[socket] connected', socket?.id)
      })
      socket.on('disconnect', (reason) => {
        // eslint-disable-next-line no-console
        console.info('[socket] disconnected', reason)
      })
      socket.on('connect_error', (err) => {
        // eslint-disable-next-line no-console
        console.warn('[socket] connect_error', err.message)
      })
    }
  }

  function on<T = any>(event: string, handler: (payload: T) => void) {
    if (!socket) return () => {}
    socket.on(event, handler as any)
    return () => socket?.off(event, handler as any)
  }

  function off(event: string, handler?: (...args: any[]) => void) {
    if (!socket) return
    socket.off(event, handler as any)
  }

  /**
   * Listen to every incoming socket event. The handler receives
   * the event name and its (first) payload. Returns an unsubscribe
   * function.
   */
  function onAny(handler: (event: string, payload: any) => void): () => void {
    if (!socket) return () => {}
    const wrapped = (event: string, ...args: any[]) => handler(event, args[0])
    socket.onAny(wrapped as any)
    return () => socket?.offAny(wrapped as any)
  }

  function offAny(handler?: (event: string, payload: any) => void) {
    if (!socket) return
    if (handler) {
      socket.offAny(handler as any)
    } else {
      socket.offAny()
    }
  }

  function emit(event: string, payload?: any) {
    if (!socket) return
    socket.emit(event, payload)
  }

  function connect() {
    socket?.connect()
  }

  function disconnect() {
    socket?.disconnect()
  }

  return {
    socket,
    on,
    off,
    onAny,
    offAny,
    emit,
    connect,
    disconnect,
  }
}
