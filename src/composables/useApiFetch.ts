import { ref, readonly } from 'vue'
import { apiUrl } from '../lib/api-config'

/**
 * Vue composable for public API reads. Calls the **external** Hono backend
 * at `PUBLIC_API_BASE_URL`. Mock fallbacks apply only when the API is unreachable.
 */

export interface ApiEnvelope<T> {
  success: boolean
  message?: string
  data?: T
  errors?: Record<string, unknown>
  meta?: Record<string, unknown>
}

export function useApiFetch() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function get<T>(path: string, fallback: () => Promise<T>, timeout = 4000): Promise<T> {
    loading.value = true
    error.value = null
    try {
      const res = await fetch(apiUrl(path), {
        signal: AbortSignal.timeout(timeout),
        credentials: 'include',
      })
      if (!res.ok) throw new Error(`API ${res.status}`)
      const json: ApiEnvelope<T> = await res.json()
      if (!json.success) throw new Error(json.message || 'API error')
      return json.data as T
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
      return fallback()
    } finally {
      loading.value = false
    }
  }

  async function post<T>(path: string, body: unknown, fallback: () => Promise<T>, timeout = 5000): Promise<T> {
    loading.value = true
    error.value = null
    try {
      const res = await fetch(apiUrl(path), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(timeout),
        credentials: 'include',
      })
      const json: ApiEnvelope<T> = await res.json()
      if (!json.success) throw new Error(json.message || 'API error')
      return json.data as T
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
      return fallback()
    } finally {
      loading.value = false
    }
  }

  return { loading: readonly(loading), error: readonly(error), get, post }
}
