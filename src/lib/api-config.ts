/**
 * ──────────────────────────────────────────────────────────────────
 * 🏢 Company Name: Bonifade Technologies
 * 👨‍💻 Developer: Bowofade Oyerinde
 * 🐙 GitHub: oyenet1
 * 📅 Created Date: 2026-06-26
 * 🔄 Updated Date: 2026-06-26
 * ──────────────────────────────────────────────────────────────────
 * 📝 File Description:
 *   Single source of truth for how the Astro frontend talks to the
 *   **external** Top Villa API (Hono backend in `../server`).
 *
 *   Astro does NOT own business data, auth sessions, or uploads.
 *   Every page, composable, and form calls the remote API via
 *   `PUBLIC_API_BASE_URL` (browser + SSR). Mock/fallback data in
 *   composables is only used when that API is unreachable in dev.
 *
 *   Set `PUBLIC_API_BASE_URL` in `astro/.env` (see `.env.example`).
 * ──────────────────────────────────────────────────────────────────
 */

/** Base URL of the external Hono API (no trailing slash). */
export const API_BASE_URL: string =
  (import.meta.env.PUBLIC_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ||
  'https://api.topvillaluxuryhome.com.ng'

/** Human-readable note for UI banners and developer docs. */
export const EXTERNAL_API_NOTE =
  'This Astro site is frontend-only. Listings, auth, admin data, and uploads are served by the external API at api.topvillaluxuryhome.com.ng.'

export function apiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE_URL}${normalized}`
}
