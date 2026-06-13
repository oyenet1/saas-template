/**
 * Authenticated fetch composable.
 *
 * Wraps $fetch so every call:
 *  1. Reads the latest access token from the auth store
 *  2. Attaches the `Authorization: Bearer …` header
 *  3. On a 401 response, attempts ONE silent refresh + retry
 *  4. Surfaces the server-provided `message` as a toast (success or error)
 *     via `useApi`. Use `silent: true` in the third arg to opt out.
 *
 * Use this for any call that requires the user to be signed in.
 * For public endpoints (sign-in, refresh, forgot-password) keep
 * using `useApi` so the interceptor doesn't get in the way.
 */
import { $fetch } from 'ofetch'
import type { FetchOptions } from 'ofetch'

type ToastOpts = { silent?: boolean; silentSuccess?: boolean; silentError?: boolean }

function friendlyTitle(message: string): string {
  const trimmed = (message || '').trim()
  if (!trimmed) return 'Done'
  if (trimmed.length <= 60) return trimmed
  return trimmed.slice(0, 57) + '…'
}

function friendlyErrorTitle(status: number): string {
  if (status === 0) return 'Network error'
  if (status === 401) return 'Please sign in'
  if (status === 403) return 'Not allowed'
  if (status === 404) return 'Not found'
  if (status === 409) return 'Conflict'
  if (status === 422) return 'Please review the form'
  if (status === 429) return 'Too many requests'
  if (status >= 500) return 'Server error'
  return 'Something went wrong'
}

function toastIconForStatus(status: number): string {
  if (status === 0) return 'i-heroicons-wifi'
  if (status >= 200 && status < 300) return 'i-heroicons-check-circle'
  if (status === 401 || status === 403) return 'i-heroicons-lock-closed'
  if (status === 404) return 'i-heroicons-question-mark-circle'
  if (status === 409) return 'i-heroicons-exclamation-circle'
  if (status === 422) return 'i-heroicons-exclamation-triangle'
  if (status === 429) return 'i-heroicons-clock'
  if (status >= 500) return 'i-heroicons-server-stack'
  if (status >= 400) return 'i-heroicons-exclamation-triangle'
  return 'i-heroicons-information-circle'
}

function toastColorForStatus(status: number): 'success' | 'error' | 'warning' | 'info' {
  if (status === 0) return 'error'
  if (status >= 200 && status < 300) return 'success'
  if (status === 429) return 'warning'
  if (status >= 500) return 'error'
  if (status >= 400) return 'warning'
  return 'info'
}

/**
 * Sanitises an error message so we never surface raw URLs, browser fetch
 * internals (e.g. "Failed to fetch", "NetworkError when attempting to fetch
 * resource", "Load failed"), or `TypeError: ...` text in a user-facing toast.
 *
 * The backend URL is never part of the user-facing message — if the server
 * is unreachable we tell the user that, in plain language, without leaking
 * the endpoint or HTTP method.
 */
function cleanErrorMessage(raw: unknown, status: number): string {
  const fallback = status >= 500
    ? 'Something went wrong on our end. Please try again in a moment.'
    : status === 0
      ? 'Can\'t reach the server. Please check your connection and try again.'
      : 'That request didn\'t go through. Please try again.'

  if (raw == null) return fallback
  const text = String(raw).trim()
  if (!text) return fallback

  // Reject anything that contains a URL
  if (/\bhttps?:\/\//i.test(text)) return fallback
  if (/\b\/\/[a-z0-9.-]+/i.test(text)) return fallback

  // Reject raw browser / ofetch network error strings
  const lc = text.toLowerCase()
  const networkLeakPatterns = [
    'failed to fetch',
    'networkerror',
    'network error when attempting',
    'load failed',
    'fetch failed',
    'the network connection was lost',
    'err_',
    'TypeError: fetch',
    'TypeError: NetworkError',
  ]
  if (networkLeakPatterns.some(p => lc.includes(p))) return fallback

  return text
}

export function useAuthenticatedFetch() {
  const auth = useAuthStore()
  const base = useApi()
  const apiBase = getApiBase()
  const toast = useToast()

  async function call<T = any>(
    url: string,
    options: FetchOptions<'json'> = {},
    opts: ToastOpts = {},
  ): Promise<T> {
    const showSuccess = !opts.silent && !opts.silentSuccess
    const showError = !opts.silent && !opts.silentError
    const method = String(options?.method ?? 'GET').toUpperCase()
    const isReadOnly = method === 'GET' || method === 'HEAD' || method === 'OPTIONS'
    const finalShowSuccess = !isReadOnly && showSuccess

    const token = auth.accessToken
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> | undefined),
    }
    if (token) headers.Authorization = `Bearer ${token}`

    const baseURL = url.startsWith('http')
      ? undefined
      : (apiBase as string) || undefined

    const toastFromResponse = (data: any, status: number) => {
      if (!finalShowSuccess) return
      const message = String(data?.message ?? '').trim()
      if (!message) return
      toast.add({
        title: friendlyTitle(message),
        description: message,
        icon: toastIconForStatus(status),
        color: toastColorForStatus(status),
      })
    }

    const toastFromError = (err: any) => {
      if (!showError) return
      const status = Number(err?.statusCode ?? err?.response?.status ?? 0)
      const data: any = err?.data ?? err?.response?._data ?? null
      const message = cleanErrorMessage(data?.message ?? err?.message, status)
      toast.add({
        title: friendlyErrorTitle(status),
        description: message,
        icon: toastIconForStatus(status),
        color: toastColorForStatus(status),
      })
    }

    // First attempt
    try {
      const res: any = await $fetch(url, {
        ...options,
        headers,
        baseURL,
        onResponse({ response }) {
          const status = Number(response?.status ?? 200)
          const data = (response as any)?._data ?? response
          toastFromResponse(data, status)
        },
      })
      return ((res as any)?.data ?? res) as T
    } catch (err: any) {
      const status = Number(err?.statusCode ?? err?.response?.status ?? 0)
      if (status !== 401 && status !== 419) {
        toastFromError(err)
        throw err
      }

      // 🚫 419 — the account is permanently barred from re-authenticating.
      // Show a hard error and skip the refresh attempt entirely
      // (there's nothing to refresh into).
      if (status === 419) {
        const reason = cleanErrorMessage(err?.data?.message || err?.message, status)
        toast.add({
          title: "Account locked",
          description: reason || "Your account can no longer sign in. Please contact support.",
          icon: "i-heroicons-shield-exclamation",
          color: "error",
        })
        // Do NOT call logout here — the user should see the message
        // and click an explicit "Back to sign in" action, not be
        // silently redirected.
        throw err
      }

      // 401: try a silent refresh + retry once
      const fresh = await auth.refresh()
      if (!fresh) {
        await auth.logout({ silent: true })
        toastFromError(err)
        throw err
      }

      const retryHeaders = { ...headers, Authorization: `Bearer ${fresh}` }
      try {
        const res: any = await $fetch(url, {
          ...options,
          headers: retryHeaders,
          baseURL,
          onResponse({ response }) {
            const s = Number(response?.status ?? 200)
            const data = (response as any)?._data ?? response
            toastFromResponse(data, s)
          },
        })
        return ((res as any)?.data ?? res) as T
      } catch (retryErr: any) {
        toastFromError(retryErr)
        throw retryErr
      }
    }
  }

  return { call }
}
