import type {
  HotelSettings,
  ProfileSettings,
  NotificationSettings,
  SecuritySettings,
} from '~/stores/settings'

// ── Types ──────────────────────────────────────────────

export interface UpdateHotelSettingsPayload extends Partial<HotelSettings> {}
export interface UpdateProfilePayload extends Partial<ProfileSettings> {}
export interface UpdateNotificationPayload extends Partial<NotificationSettings> {}
export interface UpdateSecurityPayload extends Partial<SecuritySettings> {}

// ── Composable ─────────────────────────────────────────

export function useSettings() {
  const toast = useToast()
  const { call } = useAuthenticatedFetch()
  const store = useSettingsStore()

  /** Fetch all settings from the API */
  async function fetchSettings(): Promise<void> {
    await store.fetchAll()
  }

  /** Update hotel/general settings */
  async function updateHotelSettings(payload: UpdateHotelSettingsPayload): Promise<boolean> {
    try {
      const result = await store.saveHotelSettings(payload, { silentSuccess: true })
      const title = 'Settings updated'
      const description = (result as any)?.message
      toast.add({
        title,
        description: description && (description as string) !== title ? description : undefined,
        color: 'success',
        icon: 'i-heroicons-check-circle',
      })
      return true
    } catch (e: any) {
      const title = 'Failed to save'
      const description = String(e?.data?.message || e?.message || 'Could not update hotel settings.')
      toast.add({
        title,
        description: description !== title ? description : undefined,
        color: 'error',
        icon: 'i-heroicons-exclamation-circle',
      })
      return false
    }
  }

  /** Update profile settings */
  async function updateProfile(payload: UpdateProfilePayload): Promise<boolean> {
    try {
      const result = await store.saveProfileSettings(payload, { silentSuccess: true })
      const title = 'Profile updated'
      const description = (result as any)?.message
      toast.add({
        title,
        description: description && (description as string) !== title ? description : undefined,
        color: 'success',
        icon: 'i-heroicons-check-circle',
      })
      return true
    } catch (e: any) {
      const title = 'Failed to save'
      const description = String(e?.data?.message || e?.message || 'Could not update profile.')
      toast.add({
        title,
        description: description !== title ? description : undefined,
        color: 'error',
        icon: 'i-heroicons-exclamation-circle',
      })
      return false
    }
  }

  /** Update notification preferences */
  async function updateNotificationPreferences(payload: UpdateNotificationPayload): Promise<boolean> {
    try {
      const result = await store.saveNotificationSettings(payload, { silentSuccess: true })
      const title = 'Preferences saved'
      const description = (result as any)?.message
      toast.add({
        title,
        description: description && (description as string) !== title ? description : undefined,
        color: 'success',
        icon: 'i-heroicons-check-circle',
      })
      return true
    } catch (e: any) {
      const title = 'Failed to save'
      const description = String(e?.data?.message || e?.message || 'Could not update notification preferences.')
      toast.add({
        title,
        description: description !== title ? description : undefined,
        color: 'error',
        icon: 'i-heroicons-exclamation-circle',
      })
      return false
    }
  }

  /** Update security settings */
  async function updateSecurity(payload: UpdateSecurityPayload): Promise<boolean> {
    try {
      const result = await store.saveSecuritySettings(payload, { silentSuccess: true })
      const title = 'Security updated'
      const description = (result as any)?.message
      toast.add({
        title,
        description: description && (description as string) !== title ? description : undefined,
        color: 'success',
        icon: 'i-heroicons-check-circle',
      })
      return true
    } catch (e: any) {
      const title = 'Failed to save'
      const description = String(e?.data?.message || e?.message || 'Could not update security settings.')
      toast.add({
        title,
        description: description !== title ? description : undefined,
        color: 'error',
        icon: 'i-heroicons-exclamation-circle',
      })
      return false
    }
  }

  /** Upload an avatar image via R2 and return the public URL */
  async function uploadAvatar(file: File): Promise<string | null> {
    const r2 = useR2Upload()
    try {
      const url = await r2.uploadFile(file, { folder: 'avatars' }, undefined, { silent: true })
      return url
    } catch (e: any) {
      const title = 'Upload failed'
      const description = String(e?.data?.message || e?.message || 'Could not upload the avatar. Please try again.')
      toast.add({
        title,
        description: description !== title ? description : undefined,
        color: 'error',
        icon: 'i-heroicons-exclamation-circle',
      })
      return null
    }
  }

  return {
    fetchSettings,
    updateHotelSettings,
    updateProfile,
    updateNotificationPreferences,
    updateSecurity,
    uploadAvatar,
  }
}
