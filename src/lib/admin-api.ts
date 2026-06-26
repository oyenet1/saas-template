/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-06-26
 * 🔄 Updated Date: 2026-06-26
 * ──────────────────────────────────────────────────────────────────
 * 📝 File Description:
 *   Authenticated admin API client for tenant-scoped dashboard
 *   operations. All requests go to the **external** Hono API
 *   (`PUBLIC_API_BASE_URL`) and attach `X-Company-Id` when set.
 * ──────────────────────────────────────────────────────────────────
 */

import { type ApiEnvelope, request, type RequestOptions } from './auth-client'

export const ACTIVE_COMPANY_KEY = 'topvilla:activeCompanyId'

export function getActiveCompanyId(): number | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(ACTIVE_COMPANY_KEY)
  if (!raw) return null
  const id = Number.parseInt(raw, 10)
  return Number.isFinite(id) ? id : null
}

export function setActiveCompanyId(id: number): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(ACTIVE_COMPANY_KEY, String(id))
}

export function clearActiveCompanyId(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(ACTIVE_COMPANY_KEY)
}

export async function adminRequest<T = unknown>(
  path: string,
  opts: RequestOptions = {},
): Promise<ApiEnvelope<T>> {
  const companyId = getActiveCompanyId()
  const headers: Record<string, string> = { ...(opts.headers ?? {}) }
  if (companyId) headers['X-Company-Id'] = String(companyId)
  return request<T>(path, { ...opts, headers })
}

/** Map Zod `flatten().fieldErrors` to single-line field messages. */
export function mapFieldErrors(errors: unknown): Record<string, string> {
  if (!errors || typeof errors !== 'object') return {}
  const fieldErrors = (errors as { fieldErrors?: Record<string, string[]> }).fieldErrors
  if (!fieldErrors) return {}
  const out: Record<string, string> = {}
  for (const [key, messages] of Object.entries(fieldErrors)) {
    if (Array.isArray(messages) && messages.length) out[key] = messages.join(', ')
  }
  return out
}
