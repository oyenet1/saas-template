import { useTimeoutFn } from '@vueuse/core'

export interface BookingAlertData {
  title: string
  body: string
  bookingRef: string
  actionUrl: string
  paymentStatus: 'paid' | 'unpaid'
}

interface BookingAlertState {
  visible: boolean
  data: BookingAlertData | null
}

const alertState = reactive<BookingAlertState>({
  visible: false,
  data: null,
})

let autoDismiss: ReturnType<typeof useTimeoutFn> | null = null

export function useBookingAlert() {
  function show(data: BookingAlertData) {
    alertState.visible = true
    alertState.data = data

    if (autoDismiss) autoDismiss.stop()
    autoDismiss = useTimeoutFn(() => {
      alertState.visible = false
    }, 30000)
  }

  function dismiss() {
    if (autoDismiss) autoDismiss.stop()
    alertState.visible = false
  }

  return {
    alertState: readonly(alertState),
    show,
    dismiss,
  }
}
