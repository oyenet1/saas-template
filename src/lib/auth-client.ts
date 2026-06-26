/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-06-17
 * 🔄 Updated Date: 2026-06-17
 * 📝 File Description:
 *   Thin browser/SSR-friendly client for the Hono auth endpoints.
 *   Astro is frontend-only — every auth request flows through the
 *   Hono backend at `PUBLIC_API_BASE_URL`. The backend issues and
 *   reads the session cookie; this module never stores user data
 *   locally.
 *
 *   Both the browser-side helpers (`login`, `logout`, `register`,
 *   `me`) and the SSR helpers (`getSessionUser`, `requireUser`) go
 *   through the same underlying `request` function so credentials
 *   behaviour stays consistent.
 * ──────────────────────────────────────────────────────────────────
 */

const API_BASE_URL: string = (import.meta.env.PUBLIC_API_BASE_URL as string | undefined) || 'http://localhost:4000'

/** Shape of the user payload returned by the backend. */
export interface SessionUser {
  id: string
  email: string
  name?: string | null
  image?: string | null
}

/** Shape of the standard API response envelope. */
export interface ApiEnvelope<T> {
  success: boolean
  message: string
  data?: T
  errors?: Record<string, unknown>
  meta?: Record<string, unknown>
}

/* ── Internal HTTP helper ─────────────────────────────────────────── */

/** Strip the trailing slash from the API base URL to avoid `//api/v1/...`. */
function api(path: string): string {
  return `${API_BASE_URL.replace(/\/$/, '')}${path}`
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  /** Inbound `Cookie` header (used by SSR `getSessionUser`). */
  cookie?: string
  /** Extra request headers (SSR only). */
  headers?: Record<string, string>
  /** `credentials: 'include'` (browser only, default true). */
  credentials?: RequestCredentials
  /** Abort signal for fetch. */
  signal?: AbortSignal
}

/**
 * Low-level request helper. Returns the parsed envelope. Throws on
 * network errors only — non-2xx responses return `{ success: false, … }`
 * so callers can branch on the envelope rather than try/catching.
 */
export async function request<T = unknown>(path: string, opts: RequestOptions = {}): Promise<ApiEnvelope<T>> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(opts.headers ?? {}),
  }
  let body: BodyInit | undefined
  if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(opts.body)
  }
  if (opts.cookie) headers['Cookie'] = opts.cookie

  const init: RequestInit = {
    method: opts.method ?? 'GET',
    headers,
    body,
  }
  if (typeof opts.credentials === 'string') {
    init.credentials = opts.credentials
  } else if (typeof window !== 'undefined') {
    // Browser default: include cookies so the backend's Set-Cookie
    // is persisted across reloads.
    init.credentials = 'include'
  }
  if (opts.signal) init.signal = opts.signal

  let res: Response
  try {
    res = await fetch(api(path), init)
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Network request failed'
    return {
      success: false,
      message: `API unreachable at ${API_BASE_URL.replace(/\/$/, '')}. Start the backend (bun run dev in the API repo) and set PUBLIC_API_BASE_URL if needed. (${reason})`,
    }
  }

  let parsed: ApiEnvelope<T> = { success: res.ok, message: res.statusText }
  try {
    parsed = (await res.json()) as ApiEnvelope<T>
  } catch {
    // Non-JSON response — keep the status-based fallback.
  }
  return parsed
}

/* ── Browser helpers ──────────────────────────────────────────────── */

export async function login(input: { email: string; password: string }): Promise<ApiEnvelope<{ user: SessionUser }>> {
  return request('/api/v1/auth/login', { method: 'POST', body: input })
}

export async function register(input: {
  email: string
  password: string
  name: string
}): Promise<ApiEnvelope<{ user: SessionUser }>> {
  return request('/api/v1/auth/register', { method: 'POST', body: input })
}

export async function logout(): Promise<ApiEnvelope<null>> {
  return request('/api/v1/auth/logout', { method: 'POST' })
}

export async function forgotPassword(input: { email: string }): Promise<ApiEnvelope<null>> {
  return request('/api/v1/auth/forgot-password', { method: 'POST', body: input })
}

export async function resetPassword(input: {
  email: string
  code: string
  password: string
}): Promise<ApiEnvelope<null>> {
  return request('/api/v1/auth/reset-password', { method: 'POST', body: input })
}

/**
 * Fetch the currently-authenticated user. Returns `null` when no
 * session is attached (or the backend returns 401). Both the
 * browser (uses `credentials: include`) and the SSR caller
 * (passes the inbound `Cookie` header) reach the same backend
 * session.
 */
export async function me(opts: { cookie?: string } = {}): Promise<SessionUser | null> {
  const res = await request<SessionUser>('/api/v1/auth/me', { cookie: opts.cookie })
  if (!res.success || !res.data) return null
  return res.data
}

/* ── SSR helpers ──────────────────────────────────────────────────── */

/**
 * Resolve the session user from the inbound request. Used by Astro
 * page/middleware frontmatter. Returns `null` for unauthenticated
 * callers so the caller can decide between a redirect and a 401.
 */
export async function getSessionUser(request: Request): Promise<SessionUser | null> {
  const cookie = request.headers.get('cookie') ?? undefined
  return me({ cookie })
}

/**
 * Guard helper for protected Astro pages. When the caller is
 * unauthenticated, returns an `Astro.redirect()` to `/login?next=…`
 * with the current pathname preserved. When authenticated, returns
 * the session user.
 *
 * Usage in a `.astro` file:
 *
 *   const guard = await requireUser(Astro)
 *   if (guard instanceof Response) return guard
 *   const user = guard
 */
export async function requireUser(astro: {
  request: Request
  url: URL
  redirect: (path: string) => Response
}): Promise<SessionUser | Response> {
  const user = await getSessionUser(astro.request)
  if (user) return user
  const next = encodeURIComponent(astro.url.pathname + astro.url.search)
  return astro.redirect(`/login?next=${next}`)
}
