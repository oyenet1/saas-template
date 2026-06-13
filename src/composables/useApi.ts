/**
 * useApi — thin wrapper around $fetch that:
 *   • shows a toast for every response (2xx, 4xx, 5xx) with
 *     an icon mapped to the HTTP status
 *   • extracts field-level validation errors so the form can
 *     display them inline
 *   • throws a structured `ApiError` the caller can `catch`
 *     and use to populate form fields
 *
 * By default the **server-provided `message` always reaches the user
 * via toast** (success or error). Callers can opt out with the
 * `silent: true` option when they want to render a custom UI.
 */
import { $fetch } from 'ofetch'
import type { FetchOptions } from 'ofetch'

export interface ApiError extends Error {
  status: number
  message: string
  fieldErrors: Record<string, string>
  data: any
  /** Seconds until the user can retry (set on 429). */
  retryAfter?: number
  /** Absolute timestamp (ms) when the ban lifts (set on 429). */
  bannedUntil?: number
  /** Total ban duration in seconds (set on 429). */
  banDurationSeconds?: number
}

interface ApiSuccess<T> {
  data: T
  status: number
  message: string
}

export interface CallOptions {
  /** When true, suppress ALL toasts for this call */
  silent?: boolean
  /** Suppress the success toast only */
  silentSuccess?: boolean
  /** Suppress the error toast only */
  silentError?: boolean
  /** Override the success toast title */
  successTitle?: string
  /** Override the success toast description */
  successMessage?: string
  /** Force the success toast to render even if the server didn't include a message */
  showSuccess?: boolean
  /** @deprecated use `silentSuccess` */
  success?: boolean
  /** @deprecated use `silentError` */
  error?: boolean
}

function normalizeFieldErrors(errors: unknown): Record<string, string> {
  if (!errors || typeof errors !== 'object') return {}

  return Object.fromEntries(
    Object.entries(errors as Record<string, unknown>)
      .map(([field, value]) => {
        if (Array.isArray(value)) return [field, String(value[0] ?? '')]
        if (typeof value === 'string') return [field, value]
        return [field, '']
      })
      .filter(([, value]) => Boolean(value)),
  )
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

  // Reject anything that contains a URL (http://, https://, //host, ws://, …)
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

function makeApiError(err: any): ApiError {
  const status = Number(err?.statusCode ?? err?.response?.status ?? 0)
  const data = err?.data ?? err?.response?._data ?? null
  // For 429, prefer the server-provided message (it includes the
  // human-friendly retry duration) and surface retryAfter/bannedUntil
  // so the caller can lock the UI accordingly.
  const message = cleanErrorMessage(data?.message ?? err?.message, status)
  const rawErrors = data?.errors ?? data?.fieldErrors
  const fieldErrors =
    rawErrors && typeof rawErrors === 'object'
      ? normalizeFieldErrors(rawErrors)
      : {}

  // Pull Retry-After / bannedUntil from response headers if the body
  // didn't include them (defensive — some proxies strip JSON body).
  const headers = err?.response?.headers ?? err?.headers ?? {}
  const retryAfterHeader = Number(headers.get?.('retry-after') ?? headers['retry-after'])
  const banUntilHeader = Number(headers.get?.('x-ratelimit-ban-until') ?? headers['x-ratelimit-ban-until'])
  const retryAfter = Number(data?.retryAfter) || (Number.isFinite(retryAfterHeader) && retryAfterHeader > 0 ? retryAfterHeader : 0)
  const bannedUntil = Number(data?.bannedUntil) || (Number.isFinite(banUntilHeader) && banUntilHeader > 0 ? banUntilHeader : 0)
  const banDurationSeconds = Number(data?.banDurationSeconds) || 0

  const apiErr: ApiError = Object.assign(new Error(message), {
    status,
    message,
    fieldErrors,
    data,
    name: 'ApiError',
  })
  // Attach 429-specific metadata so pages can read it
  if (status === 429) {
    ;(apiErr as any).retryAfter = retryAfter
    ;(apiErr as any).bannedUntil = bannedUntil
    ;(apiErr as any).banDurationSeconds = banDurationSeconds
  }
  return apiErr
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

export function useApi() {
  const toast = useToast()
  const apiBase = getApiBase()

  async function call<T = any>(
    url: string,
    options: FetchOptions<'json'> = {},
    opts: CallOptions = {},
  ): Promise<ApiSuccess<T>> {
    const showSuccess = !opts.silent && !opts.silentSuccess && opts.success !== false
    const showError = !opts.silent && !opts.silentError && opts.error !== false
    const method = String(options?.method ?? 'GET').toUpperCase()
    const isReadOnly = method === 'GET' || method === 'HEAD' || method === 'OPTIONS'
    const finalShowSuccess = showSuccess && (!isReadOnly || opts.showSuccess === true)

    try {
      const res: any = await $fetch(url, {
        ...options,
        baseURL: url.startsWith('http') ? undefined : (apiBase || undefined),
        onResponse({ response }) {
          if (!finalShowSuccess) return
          try {
            const status = Number(response?.status ?? 200)
            const data: any = (response as any)?._data ?? response
            const message = String(data?.message ?? '').trim()
            if (!message) return
            // Title: short fixed category (or caller override).
            // Description: full backend message.
            // If the caller-provided title would collide with the
            // description, suppress the description entirely so the two
            // are never identical.
            const title = opts.successTitle ?? 'Success'
            const description = opts.successMessage ?? message
            toast.add({
              title,
              description: title === description ? undefined : description,
              icon: toastIconForStatus(status),
              color: toastColorForStatus(status),
            })
          } catch {
            /* never break a request over a toast failure */
          }
        },
      })
      const status = Number(res?.status ?? 200)
      const message = res?.message ?? 'Done'
      return { data: (res?.data ?? res) as T, status, message }
    } catch (err: any) {
      const apiErr = makeApiError(err)
      if (showError) {
        // Title: short fixed category. Description: backend message.
        toast.add({
          title: friendlyErrorTitle(apiErr.status),
          description: apiErr.message,
          icon: toastIconForStatus(apiErr.status),
          color: toastColorForStatus(apiErr.status),
        })
      }
      throw apiErr
    }
  }

  return { call }
}

function friendlyTitle(message: string): string {
  // Kept for backwards-compat callers; never returned automatically.
  const trimmed = (message || '').trim()
  if (!trimmed) return 'Done'
  return trimmed.length <= 60 ? trimmed : trimmed.slice(0, 57) + '…'
}

function friendlyErrorTitle(status: number): string {
  if (status === 0) return 'Network error'
  if (status === 401) return 'Please sign in'
  if (status === 403) return 'Not allowed'
  if (status === 404) return 'Not found'
  if (status === 409) return 'Conflict'
  if (status === 422) return 'Please review the form'
  if (status === 429) return 'You\'re temporarily blocked'
  if (status >= 500) return 'Server error'
  return 'Something went wrong'
}
