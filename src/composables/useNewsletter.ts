import { ref, readonly } from 'vue'
import { useApiFetch } from './useApiFetch'

export interface NewsletterInput {
  email: string
  name?: string
  source?: string
}

export function useNewsletter() {
  const { loading, error, post } = useApiFetch()
  const subscribed = ref(false)
  const unsubscribed = ref(false)

  async function subscribe(input: NewsletterInput): Promise<boolean> {
    const data = await post<{ subscriber: any }>(
      '/api/v1/leads/newsletters/subscribe',
      input,
      async () => {
        subscribed.value = true
        return { subscriber: { email: input.email } }
      },
    )
    if (data.subscriber) {
      subscribed.value = true
      return true
    }
    return false
  }

  async function unsubscribe(email: string): Promise<boolean> {
    const data = await post<{ subscriber: any }>(
      '/api/v1/leads/newsletters/unsubscribe',
      { email },
      async () => {
        unsubscribed.value = true
        return { subscriber: { email } }
      },
    )
    if (data.subscriber) {
      unsubscribed.value = true
      return true
    }
    return false
  }

  function reset() {
    subscribed.value = false
    unsubscribed.value = false
  }

  return {
    subscribed: readonly(subscribed),
    unsubscribed: readonly(unsubscribed),
    loading,
    error,
    subscribe,
    unsubscribe,
    reset,
  }
}
