import { defineStore } from 'pinia'

// ── Types ──────────────────────────────────────────────

export interface HotelSettings {
  id: string
  name: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  country: string
  zipCode: string
  description: string
  starRating: number
  currency: string
  code: string
  primaryColor: string
  secondaryColor: string
  heroImage: string | null
  logo: string | null
  checkOutTime: string
  serviceCharge: number
  refundSurcharge: number
  vatEnabled: boolean
}

export interface ProfileSettings {
  firstName: string
  lastName: string
  email: string
  phone: string
  avatar: string | null
  jobTitle: string
  department: string
  language: string
}

export interface BillingPlan {
  id: string
  name: string
  price: number
  interval: 'monthly' | 'yearly'
  features: string[]
  isActive: boolean
}

export interface BillingSettings {
  plan: BillingPlan
  paymentMethod: {
    type: 'card' | 'bank' | 'mobile_money'
    last4: string
    brand: string
    expMonth: number
    expYear: number
  } | null
  nextBillingDate: string
  invoices: Array<{
    id: string
    date: string
    amount: number
    status: 'paid' | 'pending' | 'failed'
    description: string
  }>
}

export interface NotificationChannel {
  id: string
  label: string
  email: boolean
  inApp: boolean
  push: boolean
}

export interface NotificationSettings {
  channels: NotificationChannel[]
  quietHours: {
    enabled: boolean
    start: string
    end: string
  }
  emailDigest: 'none' | 'daily' | 'weekly'
}

export interface SecuritySettings {
  twoFactorEnabled: boolean
  twoFactorMethod: 'app' | 'sms' | 'email'
  sessionTimeout: number
  passwordMinLength: number
  requireSpecialChars: boolean
  loginNotifications: boolean
  activeSessions: Array<{
    id: string
    device: string
    browser: string
    ip: string
    lastActive: string
    location: string
    isCurrent: boolean
  }>
  auditLog: Array<{
    id: string
    action: string
    timestamp: string
    ip: string
    userAgent: string
  }>
}

export interface SettingsState {
  hotel: HotelSettings | null
  profile: ProfileSettings | null
  billing: BillingSettings | null
  notifications: NotificationSettings | null
  security: SecuritySettings | null
  loading: boolean
  saving: boolean
  error: string | null
}

// ── Dummy Profile Data (profile not yet connected to API) ─────────

const dummyProfile: ProfileSettings = {
  firstName: 'Alex',
  lastName: 'Thompson',
  email: 'alex@grandhorizon.com',
  phone: '+234 800 123 4567',
  avatar: null,
  jobTitle: 'General Manager',
  department: 'Management',
  language: 'en',
}

const defaultNotificationChannels: NotificationChannel[] = [
  { id: 'new_booking', label: 'New Booking', email: true, inApp: true, push: false },
  { id: 'cancellation', label: 'Cancellation', email: true, inApp: true, push: true },
  { id: 'checkin_reminder', label: 'Check-in Reminder', email: false, inApp: true, push: true },
  { id: 'checkout_reminder', label: 'Check-out Reminder', email: false, inApp: true, push: true },
  { id: 'payment_received', label: 'Payment Received', email: true, inApp: true, push: false },
  { id: 'payment_failed', label: 'Payment Failed', email: true, inApp: true, push: true },
  { id: 'review_received', label: 'Review Received', email: false, inApp: true, push: false },
  { id: 'maintenance_alert', label: 'Maintenance Alert', email: true, inApp: true, push: true },
  { id: 'system_update', label: 'System Update', email: true, inApp: false, push: false },
  { id: 'subscription_alert', label: 'Subscription Alert', email: true, inApp: true, push: true },
]

const dummyBilling: BillingSettings = {
  plan: {
    id: 'plan_pro',
    name: 'Professional',
    price: 49000,
    interval: 'monthly',
    features: [
      'Up to 50 rooms',
      'Unlimited bookings',
      'Channel manager',
      'Analytics & reports',
      'Priority support',
    ],
    isActive: true,
  },
  paymentMethod: {
    type: 'card',
    last4: '4242',
    brand: 'Visa',
    expMonth: 12,
    expYear: 2027,
  },
  nextBillingDate: '2026-07-15',
  invoices: [
    { id: 'INV-2026-06', date: '2026-06-15', amount: 49000, status: 'paid', description: 'Professional Plan - June 2026' },
    { id: 'INV-2026-05', date: '2026-05-15', amount: 49000, status: 'paid', description: 'Professional Plan - May 2026' },
    { id: 'INV-2026-04', date: '2026-04-15', amount: 49000, status: 'paid', description: 'Professional Plan - April 2026' },
  ],
}

const dummySecurity: SecuritySettings = {
  twoFactorEnabled: false,
  twoFactorMethod: 'app',
  sessionTimeout: 30,
  passwordMinLength: 8,
  requireSpecialChars: true,
  loginNotifications: true,
  activeSessions: [
    { id: 's1', device: 'MacBook Pro', browser: 'Chrome 125', ip: '192.168.1.100', lastActive: '2 minutes ago', location: 'Lagos, Nigeria', isCurrent: true },
    { id: 's2', device: 'iPhone 15', browser: 'Safari', ip: '192.168.1.101', lastActive: '3 hours ago', location: 'Lagos, Nigeria', isCurrent: false },
  ],
  auditLog: [
    { id: 'a1', action: 'Password changed', timestamp: '2026-06-10 14:32', ip: '192.168.1.100', userAgent: 'Chrome 125 on Mac' },
    { id: 'a2', action: 'Two-factor disabled', timestamp: '2026-06-05 09:15', ip: '192.168.1.100', userAgent: 'Chrome 125 on Mac' },
    { id: 'a3', action: 'Login from new device', timestamp: '2026-06-01 22:45', ip: '192.168.1.101', userAgent: 'Safari on iPhone' },
  ],
}

// ── Store ───────────────────────────────────────────────

export const useSettingsStore = defineStore('settings', () => {
  const { call } = useAuthenticatedFetch()

  // State
  const hotel = ref<HotelSettings | null>(null)
  const profile = ref<ProfileSettings | null>(null)
  const billing = ref<BillingSettings | null>(null)
  const notifications = ref<NotificationSettings | null>(null)
  const security = ref<SecuritySettings | null>(null)
  const loading = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const hasSettings = computed(() => hotel.value !== null)
  const activeNotificationsCount = computed(() => {
    if (!notifications.value) return 0
    return notifications.value.channels.filter(c => c.email || c.inApp || c.push).length
  })

  // Actions
  async function fetchAll() {
    loading.value = true
    error.value = null
    try {
      // Fetch hotel settings from the API
      // call() already unwraps res.data, so response is the HotelSettings object
      const response = await call<HotelSettings>(
        '/settings',
        { method: 'GET' },
        { silent: true },
      )
      hotel.value = response as HotelSettings

      // Profile, billing, notifications, security still use dummy data
      // until their respective API endpoints are built
      profile.value = { ...dummyProfile }
      billing.value = { ...dummyBilling }
      notifications.value = {
        channels: defaultNotificationChannels.map(c => ({ ...c })),
        quietHours: { enabled: false, start: '22:00', end: '07:00' },
        emailDigest: 'daily',
      }
      security.value = JSON.parse(JSON.stringify(dummySecurity))
    } catch (e: any) {
      error.value = e?.message || 'Failed to load settings'
      console.error('[SettingsStore] fetchAll error:', e)
    } finally {
      loading.value = false
    }
  }

  async function saveHotelSettings(
    data: Partial<HotelSettings>,
    opts: { silent?: boolean; silentSuccess?: boolean; silentError?: boolean } = {},
  ) {
    saving.value = true
    try {
      const result = await call<unknown>('/settings', {
        method: 'PUT',
        body: data,
      }, opts)
      // Update local state after successful save
      hotel.value = { ...hotel.value!, ...data }
      return result
    } catch {
      return null
    } finally {
      saving.value = false
    }
  }

  async function saveProfileSettings(
    data: Partial<ProfileSettings>,
    opts: { silent?: boolean; silentSuccess?: boolean; silentError?: boolean } = {},
  ) {
    saving.value = true
    try {
      await new Promise(resolve => setTimeout(resolve, 600))
      void opts
      profile.value = { ...profile.value!, ...data }
      return true
    } finally {
      saving.value = false
    }
  }

  async function saveNotificationSettings(
    data: Partial<NotificationSettings>,
    opts: { silent?: boolean; silentSuccess?: boolean; silentError?: boolean } = {},
  ) {
    saving.value = true
    try {
      await new Promise(resolve => setTimeout(resolve, 600))
      void opts
      notifications.value = { ...notifications.value!, ...data }
      return true
    } finally {
      saving.value = false
    }
  }

  async function updateChannel(id: string, updates: Partial<NotificationChannel>) {
    if (!notifications.value) return
    const idx = notifications.value.channels.findIndex(c => c.id === id)
    if (idx !== -1) {
      notifications.value.channels[idx] = { ...notifications.value.channels[idx], ...updates }
    }
  }

  async function saveSecuritySettings(
    data: Partial<SecuritySettings>,
    opts: { silent?: boolean; silentSuccess?: boolean; silentError?: boolean } = {},
  ) {
    saving.value = true
    try {
      await new Promise(resolve => setTimeout(resolve, 600))
      void opts
      security.value = { ...security.value!, ...data }
      return true
    } finally {
      saving.value = false
    }
  }

  async function updatePlan(planId: string) {
    saving.value = true
    try {
      await new Promise(resolve => setTimeout(resolve, 800))
      if (billing.value) {
        billing.value.plan = { ...billing.value.plan, id: planId }
      }
      return true
    } finally {
      saving.value = false
    }
  }

  async function revokeSession(sessionId: string) {
    if (!security.value) return
    security.value.activeSessions = security.value.activeSessions.filter(s => s.id !== sessionId)
  }

  return {
    hotel, profile, billing, notifications, security,
    loading, saving, error,
    hasSettings, activeNotificationsCount,
    fetchAll, saveHotelSettings, saveProfileSettings,
    saveNotificationSettings, updateChannel,
    saveSecuritySettings, updatePlan, revokeSession,
  }
})
