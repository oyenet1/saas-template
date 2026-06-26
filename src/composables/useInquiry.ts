import { ref, readonly } from 'vue'
import { useApiFetch } from './useApiFetch'

export interface InquiryInput {
  name: string
  email: string
  phone?: string
  message: string
  source?: 'web' | 'whatsapp' | 'phone' | 'walk-in' | 'other'
  propertyId?: number
}

export interface InquiryResult {
  id?: number
  name: string
  email: string
  phone?: string
  message: string
  status?: string
  createdAt?: string
}

export function useInquiry() {
  const { loading, error, post } = useApiFetch()
  const result = ref<InquiryResult | null>(null)
  const success = ref(false)

  async function submit(input: InquiryInput): Promise<boolean> {
    const data = await post<{ inquiry: InquiryResult }>(
      '/api/v1/leads/inquiries',
      input,
      async () => {
        result.value = { name: input.name, email: input.email, message: input.message, status: 'received' }
        success.value = true
        return { inquiry: result.value }
      },
    )
    if (data.inquiry) {
      result.value = data.inquiry
      success.value = true
      return true
    }
    return false
  }

  function reset() {
    result.value = null
    success.value = false
  }

  return {
    result: readonly(result),
    success: readonly(success),
    loading,
    error,
    submit,
    reset,
  }
}
