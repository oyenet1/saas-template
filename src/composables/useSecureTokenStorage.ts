/**
 * Secure token storage.
 *
 * In an ideal production setup the server sets the refresh token
 * as an **httpOnly + Secure + SameSite=strict** cookie so the
 * JavaScript runtime never sees it. The access token lives in
 * memory (Pinia store) and is refreshed automatically when it
 * expires.
 *
 * As a fallback for environments where the server doesn't set
 * cookies (e.g. a development setup, or a third-party IdP that
 * returns tokens in the response body), we encrypt the tokens at
 * rest in `sessionStorage` using AES-GCM with a key derived from
 * a server-issued random pepper (`useSecureKey()`). The encryption
 * key is never persisted — the moment the tab closes, the
 * tokens vanish.
 *
 * **Never** use `localStorage` for tokens. It survives tab close
 * and any XSS in the page can read it.
 */
const STORAGE_KEYS = {
  access:  'lodge.auth.access',
  refresh: 'lodge.auth.refresh',
  pepper:  'lodge.auth.pepper',
} as const

// In-memory cache so we don't re-decrypt on every API call
let memoryAccess: string | null = null
let memoryRefresh: string | null = null
let cryptoKey: CryptoKey | null = null

function isBrowser() {
  return typeof window !== 'undefined' && typeof sessionStorage !== 'undefined'
}

function getPepper(): string {
  if (!isBrowser()) return ''
  let pepper = sessionStorage.getItem(STORAGE_KEYS.pepper)
  if (!pepper) {
    // Random 256-bit value, base64. Unique per tab.
    const bytes = new Uint8Array(32)
    crypto.getRandomValues(bytes)
    pepper = btoa(String.fromCharCode(...bytes))
    sessionStorage.setItem(STORAGE_KEYS.pepper, pepper)
  }
  return pepper
}

async function getKey(): Promise<CryptoKey> {
  if (cryptoKey) return cryptoKey
  if (!isBrowser() || !globalThis.crypto?.subtle) {
    throw new Error('Web Crypto API not available')
  }
  const pepper = getPepper()
  const raw = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pepper))
  cryptoKey = await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, [
    'encrypt',
    'decrypt',
  ])
  return cryptoKey
}

async function encrypt(plain: string): Promise<string> {
  const key = await getKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plain),
  )
  // Pack iv + ciphertext as base64
  const packed = new Uint8Array(iv.length + cipher.byteLength)
  packed.set(iv, 0)
  packed.set(new Uint8Array(cipher), iv.length)
  return btoa(String.fromCharCode(...packed))
}

async function decrypt(packed: string): Promise<string | null> {
  try {
    const key = await getKey()
    const buf = Uint8Array.from(atob(packed), (c) => c.charCodeAt(0))
    const iv = buf.slice(0, 12)
    const cipher = buf.slice(12)
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      cipher,
    )
    return new TextDecoder().decode(plain)
  } catch {
    return null
  }
}

export function useSecureTokenStorage() {
  function setAccessToken(token: string | null) {
    memoryAccess = token
    if (!isBrowser()) return
    if (token) {
      encrypt(token).then((enc) => sessionStorage.setItem(STORAGE_KEYS.access, enc))
    } else {
      sessionStorage.removeItem(STORAGE_KEYS.access)
    }
  }

  function getAccessToken(): string | null {
    return memoryAccess
  }

  async function setRefreshToken(token: string | null) {
    memoryRefresh = token
    if (!isBrowser()) return
    if (token) {
      const enc = await encrypt(token)
      sessionStorage.setItem(STORAGE_KEYS.refresh, enc)
    } else {
      sessionStorage.removeItem(STORAGE_KEYS.refresh)
    }
  }

  async function getRefreshToken(): Promise<string | null> {
    if (memoryRefresh) return memoryRefresh
    if (!isBrowser()) return null
    const packed = sessionStorage.getItem(STORAGE_KEYS.refresh)
    if (!packed) return null
    const plain = await decrypt(packed)
    memoryRefresh = plain
    return plain
  }

  function clear() {
    memoryAccess = null
    memoryRefresh = null
    if (isBrowser()) {
      sessionStorage.removeItem(STORAGE_KEYS.access)
      sessionStorage.removeItem(STORAGE_KEYS.refresh)
    }
  }

  /**
   * On app boot, hydrate the in-memory cache from the encrypted
   * sessionStorage so the access token survives a page refresh
   * (but not a tab close).
   */
  async function hydrate() {
    if (!isBrowser()) return
    const accessPacked = sessionStorage.getItem(STORAGE_KEYS.access)
    if (accessPacked) {
      const plain = await decrypt(accessPacked)
      memoryAccess = plain
    }
    const refreshPacked = sessionStorage.getItem(STORAGE_KEYS.refresh)
    if (refreshPacked) {
      const plain = await decrypt(refreshPacked)
      memoryRefresh = plain
    }
  }

  return {
    setAccessToken,
    getAccessToken,
    setRefreshToken,
    getRefreshToken,
    clear,
    hydrate,
  }
}
