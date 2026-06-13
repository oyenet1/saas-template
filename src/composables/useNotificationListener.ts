import { useSocket } from './useSocket'
import { useBell } from './useBell'
import { useBookingAlert } from './useBookingAlert'
import type { BackendNotification } from '~/stores/notifications'

interface NotificationEvent {
  id: string
  type: string
  category: string | null
  severity: string | null
  title: string
  body: string | null
  reference_type: string | null
  reference_id: string | number | null
  data?: {
    type?: string
    persistent?: boolean
    bell?: boolean
    actionUrl?: string
    paymentStatus?: 'paid' | 'unpaid'
    bookingReference?: string
    [key: string]: unknown
  }
  created_at: string
  hotel_id: string | null
}

const ACTIVE_TOAST_ID = 'persistent-notification'
let bellStoppedByUser = false
let currentNotificationId: string | null = null

export function useNotificationListener() {
  const toast = useToast()
  const bell = useBell()
  const socket = useSocket()
  const router = useRouter()
  const notifications = useNotificationsStore()
  const bookingAlert = useBookingAlert()

  function dismissCurrent() {
    ;(toast as any).remove?.(ACTIVE_TOAST_ID)
    bell.stopContinuous()
    bellStoppedByUser = true
    currentNotificationId = null
  }

  function handleNotification(event: NotificationEvent) {
    notifications.prependIncoming(event as BackendNotification)
    const data = event.data || {}
    const shouldRing = data.bell === true
    const isBooking = data.type?.startsWith('booking') || event.type?.startsWith('booking')

    void notifications.fetchInbox()
    void notifications.fetchUnreadCount()

    // Booking notifications: UAlert + ring (creator is excluded by backend,
    // so only other staff receive this)
    if (isBooking) {
      bellStoppedByUser = false
      currentNotificationId = event.id

      if (shouldRing) {
        bell.startContinuous({ volume: 0.7, repeatDelay: 3000 })
      }

      bookingAlert.show({
        title: event.title,
        body: event.body || '',
        bookingRef: String(data.bookingReference || ''),
        actionUrl: String(data.actionUrl || ''),
        paymentStatus: data.paymentStatus || 'unpaid',
      })
      return
    }

    // Non-booking persistent notifications: toast
    const isPersistent = data.persistent !== false
    if (isPersistent) {
      const toastActions: any[] = [
        {
          label: 'Dismiss',
          color: 'neutral',
          variant: 'ghost',
          onClick: () => dismissCurrent(),
        },
      ]

      if (data.actionUrl) {
        toastActions.unshift({
          label: 'View',
          color: 'primary',
          variant: 'solid',
          onClick: () => {
            dismissCurrent()
            router.push(data.actionUrl as string)
          },
        })
      }

      toast.add({
        id: ACTIVE_TOAST_ID,
        title: event.title,
        description: event.body || undefined,
        icon: 'i-heroicons-bell-alert',
        color:
          event.severity === 'success' ? 'success'
          : event.severity === 'error' ? 'error'
          : event.severity === 'warning' ? 'warning'
          : 'info',
        duration: 0,
        actions: toastActions,
      } as any)
    }

    if (shouldRing) {
      bell.play({ repeats: 2, volume: 0.6 })
    }
  }

  function handleUnreadCount(data: { unread_count: number }) {
    notifications.syncUnreadCount(data.unread_count)
  }

  function setup() {
    if (import.meta.client && typeof window !== 'undefined') {
      const prime = () => {
        void bell.resume()
        document.removeEventListener('pointerdown', prime)
        document.removeEventListener('keydown', prime)
      }
      document.addEventListener('pointerdown', prime, { once: true })
      document.addEventListener('keydown', prime, { once: true })
    }

    socket.on('notification', handleNotification)
    socket.on('notification:unread-count', handleUnreadCount)
  }

  function teardown() {
    socket.off('notification', handleNotification)
    socket.off('notification:unread-count', handleUnreadCount)
    dismissCurrent()
  }

  return {
    setup,
    teardown,
    dismissCurrent,
    handleNotification,
  }
}
