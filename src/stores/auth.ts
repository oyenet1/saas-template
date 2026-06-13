/**
 * Auth / session store.
 *
 * - In production the refresh token lives as an httpOnly cookie
 *   set by the server. In that case this store only tracks the
 *   in-memory access token + user.
 * - As a fallback, tokens are stored encrypted in sessionStorage
 *   (see `useSecureTokenStorage`) so they survive a page refresh
 *   but never persist across tab close.
 * - The `autoRefresh` flow listens for 401s, swaps a fresh
 *   access token, and retries the request once.
 */
import { defineStore } from 'pinia'
import { $fetch } from 'ofetch'
import { getApiBase } from '~/composables/useRuntimeConfig'

export interface AuthUser {
  id: string
  firstname: string
  lastname: string
  username: string
  email: string
  phone: string
  avatar: string | null
  currentRole: string
  role: string
  designation: string | null
  canLogin: number | boolean
  emailVerifiedAt: string | null
  hotelId: string | null
  dateOfEmployment: string | null
  deviceName: string | null
  [key: string]: unknown
}

export interface GeoNode {
  id: string | number
  name: string | null
}

export interface PermissionDetail {
  permission: string
  moduleKey: string | null
  moduleName: string | null
}

export interface HotelPlanDetails {
  packageId: string
  name: string
  features: Record<string, unknown> | null
}

export interface HotelSubscriptionDetails {
  interval: string
  renewDate: string | null
  nextBillingDate: string | null
  daysUntilExpiry: number
  isExpired: boolean
  autoRenew: boolean
  latestInvoice: {
    reference: string
    amount: number
    status: string
    dueDate: string | null
  } | null
}

export interface AssociatedHotel {
  id: string
  name: string
  code: string
  logo: string | null
  email: string | null
  phone: string | null
  address: string | null
  subdomain: string | null
  website: string | null
  primaryColor: string | null
  secondaryColor: string | null
  primaryCurrency: string | null
  secondaryCurrency: string | null
  status: string | null
  isCurrent: boolean
  location: unknown
  latitude: string | number | null
  longitude: string | number | null
  city: GeoNode | null
  state: GeoNode | null
  country: GeoNode | null
  plan: HotelPlanDetails | null
  subscription: HotelSubscriptionDetails | null
  pricing: Record<string, unknown> | null
  discountTiers: Record<string, unknown> | null
}

export interface AuthProfile extends AuthUser {
  roles?: string[]
  permissionDetails?: PermissionDetail[]
  associatedHotels?: AssociatedHotel[]
  currentHotel?: AssociatedHotel | null
  currentHotelId?: string | null
  city?: GeoNode | null
  state?: GeoNode | null
  country?: GeoNode | null
}

interface ApiEnvelope<T> {
  data: T
  message?: string
  success?: boolean
  statusCode?: number
}

export interface LoginResponse {
  token?: string
  accessToken?: string
  refreshToken?: string
  user: AuthProfile
}

export interface AuthSession {
  user: AuthProfile
  accessToken: string
  refreshToken: string | null
}

const REFRESH_PATH = '/v1/auth/refresh'
const LOGIN_PATH = '/v1/auth/login'
const LOGOUT_PATH = '/v1/auth/logout'
const PROFILE_PATH = '/v1/auth/profile'

function unwrapResponse<T>(response: ApiEnvelope<T> | T): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as ApiEnvelope<T>).data
  }

  return response as T
}

export const useAuthStore = defineStore('auth', () => {
  const config = getApiBase()
  const user = ref<AuthProfile | null>(null)
  const accessToken = ref<string | null>(null)
  const refreshToken = ref<string | null>(null)

  const isHydrating = ref(true)
  const isInitialized = ref(false)

  let refreshInFlight: Promise<string | null> | null = null

  const isAuthenticated = computed(() => !!accessToken.value && !!user.value)
  const hasToken = computed(() => !!accessToken.value)
  const isStaff = computed(() => {
    const role = user.value?.role ?? user.value?.currentRole ?? ''
    return ['receptionist', 'manager', 'sales', 'accountant', 'admin', 'staff'].includes(role)
  })
  const isSuperAdmin = computed(
    () => (user.value?.role ?? user.value?.currentRole) === 'super-admin',
  )
  const isCustomerCare = computed(() => {
    const role = user.value?.role ?? user.value?.currentRole ?? ''
    return role === 'customer-service' || role === 'customercare'
  })
  const isPlatformStaff = computed(
    () => isSuperAdmin.value || isCustomerCare.value,
  )
  const fullName = computed(() =>
    user.value ? `${user.value.firstname} ${user.value.lastname}`.trim() : '',
  )
  const initials = computed(() => {
    if (!user.value) return ''
    const firstname = user.value.firstname?.[0] ?? ''
    const lastname = user.value.lastname?.[0] ?? ''
    return (firstname + lastname).toUpperCase()
  })
  const associatedHotels = computed(() => user.value?.associatedHotels ?? [])
  const currentHotel = computed(() => {
    const currentId = user.value?.currentHotelId ?? user.value?.currentHotel?.id ?? null
    if (!currentId) {
      return associatedHotels.value[0] ?? null
    }

    return (
      associatedHotels.value.find(
        hotel => hotel.id === currentId || hotel.isCurrent,
      ) ?? associatedHotels.value[0] ?? null
    )
  })
  const currentPlan = computed(() => currentHotel.value?.plan ?? null)

  function applySession(session: AuthSession) {
    user.value = session.user
    accessToken.value = session.accessToken
    refreshToken.value = session.refreshToken
  }

  function clearSession() {
    user.value = null
    accessToken.value = null
    refreshToken.value = null
  }

  async function hydrate() {
    if (isInitialized.value) return

    const storage = useSecureTokenStorage()
    await storage.hydrate()

    accessToken.value = storage.getAccessToken()
    refreshToken.value = await storage.getRefreshToken()
    isHydrating.value = false
    isInitialized.value = true
  }

  async function login(payload: { identifier: string; password: string; clientType?: string }) {
    const response = await $fetch<ApiEnvelope<LoginResponse> | LoginResponse>(LOGIN_PATH, {
      baseURL: config || undefined,
      method: 'POST',
      body: {
        identifier: payload.identifier,
        password: payload.password,
        client_type: payload.clientType ?? 'web',
      },
    })

    const data = unwrapResponse(response)
    return acceptLoginResponse(data)
  }

  async function acceptLoginResponse(data: LoginResponse) {
    const storage = useSecureTokenStorage()
    const token = data.accessToken ?? data.token

    if (!token || !data.user) {
      throw new Error('Login response did not include a session token.')
    }

    const session: AuthSession = {
      user: data.user,
      accessToken: token,
      refreshToken: data.refreshToken ?? null,
    }

    applySession(session)

    storage.setAccessToken(token)
    if (data.refreshToken) {
      await storage.setRefreshToken(data.refreshToken)
    }

    return data.user
  }

  async function fetchProfile() {
    if (!accessToken.value) return null

    try {
      const response = await $fetch<ApiEnvelope<AuthProfile> | AuthProfile>(PROFILE_PATH, {
        baseURL: config || undefined,
        headers: { Authorization: `Bearer ${accessToken.value}` },
      })

      const profile = unwrapResponse(response)
      user.value = profile
      return profile
    } catch (error: any) {
      if (error?.response?.status === 401) return null
      throw error
    }
  }

  async function refresh(): Promise<string | null> {
    if (refreshInFlight) return refreshInFlight

    const storage = useSecureTokenStorage()
    const token = refreshToken.value ?? (await storage.getRefreshToken())
    if (!token) return null

    refreshInFlight = (async () => {
      try {
        const response = await $fetch<
          ApiEnvelope<{ token?: string; accessToken?: string; refreshToken?: string }>
          | { token?: string; accessToken?: string; refreshToken?: string }
        >(REFRESH_PATH, {
          baseURL: config || undefined,
          method: 'POST',
          body: { refreshToken: token },
        })

        const data = unwrapResponse(response)
        const freshToken = data.accessToken ?? data.token

        if (!freshToken) {
          throw new Error('Refresh response did not include an access token.')
        }

        accessToken.value = freshToken
        storage.setAccessToken(freshToken)

        if (data.refreshToken) {
          refreshToken.value = data.refreshToken
          await storage.setRefreshToken(data.refreshToken)
        }

        return freshToken
      } catch (err: any) {
        // 🚫 419 — the account is permanently barred from
        // re-authenticating (banned, deleted, or email no longer
        // verified). Do NOT call logout here: there's nothing to log
        // out to, and silently redirecting the user to /sign-in
        // would just bounce them back with the same error. Instead,
        // wipe the in-memory tokens so no further request goes out
        // with a stale Authorization header, and re-throw the error
        // so useAuthenticatedFetch can surface the "Account locked"
        // toast.
        const status = Number(err?.statusCode ?? err?.response?.status ?? 0)
        if (status === 419) {
          accessToken.value = null
          refreshToken.value = null
          user.value = null
          await storage.clear?.()
          throw err
        }

        // 410 (revoked) and 401 (expired/invalid) → full logout so
        // the user is bounced to /sign-in.
        await logout({ silent: true })
        return null
      } finally {
        refreshInFlight = null
      }
    })()

    return refreshInFlight
  }

  async function ensureSession(): Promise<boolean> {
    await hydrate()

    if (!accessToken.value) return false

    const profile = await fetchProfile()
    if (profile) return true

    const freshToken = await refresh()
    if (freshToken) {
      const retry = await fetchProfile()
      if (retry) return true
    }

    await logout({ silent: true })
    return false
  }

  async function logout(opts: { silent?: boolean } = {}) {
    const token = accessToken.value
    const refresh = refreshToken.value
    const storage = useSecureTokenStorage()

    // Tear down the realtime socket first so no inbound events
    // (notifications, booking toasts, etc.) try to render against
    // a signed-out user.
    try {
      useSocket().disconnect()
    } catch {
      // never block logout on a socket teardown error
    }

    clearSession()
    storage.clear()

    if (!opts.silent && token) {
      return $fetch(LOGOUT_PATH, {
        baseURL: config || undefined,
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: { refreshToken: refresh },
      })
    }
  }

  return {
    user,
    accessToken,
    refreshToken,
    isHydrating,
    isInitialized,
    isAuthenticated,
    hasToken,
    isStaff,
    isSuperAdmin,
    isCustomerCare,
    isPlatformStaff,
    fullName,
    initials,
    associatedHotels,
    currentHotel,
    currentPlan,
    hydrate,
    ensureSession,
    login,
    acceptLoginResponse,
    fetchProfile,
    refresh,
    logout,
  }
})
