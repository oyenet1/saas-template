import { defineStore } from 'pinia'

export interface InboxNotification {
  id: string
  type: string
  category: string | null
  severity: 'info' | 'success' | 'warning' | 'error'
  title: string
  body: string | null
  referenceType: string | null
  referenceId: string | number | null
  data: Record<string, unknown>
  createdAt: string
  updatedAt: string | null
  hotelId: string | null
  isRead: boolean
  readAt: string | null
  channel: string | null
}

export interface BackendNotification {
  id: string
  type: string
  category: string | null
  severity: 'info' | 'success' | 'warning' | 'error' | null
  title: string
  body: string | null
  reference_type: string | null
  reference_id: string | number | null
  data: Record<string, unknown> | string | null
  created_at: string
  updated_at?: string | null
  hotel_id: string | null
  is_read?: number | boolean | null
  read_at?: string | null
  channel?: string | null
}

interface InboxResponse {
  notifications: BackendNotification[]
}

interface UnreadCountResponse {
  unread_count: number
}

function parseNotificationData(value: BackendNotification['data']) {
  if (!value) return {}
  if (typeof value === 'object') return value

  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function normalizeNotification(notification: BackendNotification): InboxNotification {
  return {
    id: notification.id,
    type: notification.type,
    category: notification.category ?? null,
    severity: notification.severity ?? 'info',
    title: notification.title,
    body: notification.body ?? null,
    referenceType: notification.reference_type ?? null,
    referenceId: notification.reference_id ?? null,
    data: parseNotificationData(notification.data),
    createdAt: notification.created_at,
    updatedAt: notification.updated_at ?? null,
    hotelId: notification.hotel_id ?? null,
    isRead: notification.is_read === true || Number(notification.is_read ?? 0) === 1,
    readAt: notification.read_at ?? null,
    channel: notification.channel ?? null,
  }
}

export const useNotificationsStore = defineStore('notifications', () => {
  const { call } = useAuthenticatedFetch()
  const app = useAppStore()

  const items = ref<InboxNotification[]>([])
  const unreadCount = ref(0)
  const loading = ref(false)
  const loaded = ref(false)

  function syncUnreadCount(count: number) {
    unreadCount.value = Math.max(0, Number(count || 0))
    app.notificationCount = unreadCount.value
  }

  function setItems(notifications: BackendNotification[]) {
    items.value = notifications.map(normalizeNotification)
  }

  async function fetchInbox() {
    loading.value = true

    try {
      const data = await call<InboxResponse>(
        '/v1/notifications/inbox',
        {
          method: 'GET',
          query: {
            page: 1,
            perPage: 24,
          },
        },
        {
          silent: true,
        },
      )

      setItems(data.notifications || [])
      syncUnreadCount(items.value.filter(item => !item.isRead).length)
      loaded.value = true
      return items.value
    } catch {
      items.value = []
      loaded.value = false
      return items.value
    } finally {
      loading.value = false
    }
  }

  async function fetchUnreadCount() {
    try {
      const data = await call<UnreadCountResponse>(
        '/v1/notifications/inbox/unread-count',
        {
          method: 'GET',
        },
        {
          silent: true,
          silentError: true,
        },
      )

      syncUnreadCount(data.unread_count)
    } catch {
      syncUnreadCount(0)
    }

    return unreadCount.value
  }

  async function markAsRead(id: string) {
    await call(
      `/v1/notifications/inbox/${id}/read`,
      {
        method: 'PATCH',
      },
      {
        silentSuccess: true,
      },
    )

    items.value = items.value.map(item =>
      item.id === id ? { ...item, isRead: true, readAt: item.readAt ?? new Date().toISOString() } : item,
    )

    syncUnreadCount(items.value.filter(item => !item.isRead).length)
  }

  async function markAllAsRead() {
    await call(
      '/v1/notifications/inbox/read-all',
      {
        method: 'POST',
      },
      {
        silentSuccess: true,
      },
    )

    const now = new Date().toISOString()
    items.value = items.value.map(item => ({
      ...item,
      isRead: true,
      readAt: item.readAt ?? now,
    }))

    syncUnreadCount(0)
  }

  async function deleteNotification(id: string) {
    const wasUnread = items.value.some(item => item.id === id && !item.isRead)

    await call(
      `/v1/notifications/inbox/${id}`,
      {
        method: 'DELETE',
      },
      {
        silentSuccess: true,
      },
    )

    items.value = items.value.filter(item => item.id !== id)

    if (wasUnread) {
      syncUnreadCount(unreadCount.value - 1)
    }
  }

  function prependIncoming(notification: BackendNotification) {
    const next = normalizeNotification({
      ...notification,
      is_read: 0,
      read_at: null,
    })

    items.value = [next, ...items.value.filter(item => item.id !== next.id)].slice(0, 24)

    if (loaded.value) {
      syncUnreadCount(items.value.filter(item => !item.isRead).length)
    }
  }

  return {
    items,
    unreadCount,
    loading,
    loaded,
    syncUnreadCount,
    fetchInbox,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    prependIncoming,
  }
})
