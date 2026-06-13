/**
 * Hotels data — fetched via Pinia Colada so multiple components can
 * share the same cache and refetch together.
 */
import { $fetch } from 'ofetch'
import { useAppQuery, useAppMutation } from '~/composables/queries'

export interface Hotel {
  id: string
  name: string
  code: string
  city?: string
  primaryColor?: string
}

export function useHotelsQuery() {
  return useAppQuery<Hotel[]>({
    key: ['hotels'],
    query: () => $fetch<Hotel[]>('/v2/hotels'),
  })
}

export function useCreateHotelMutation() {
  return useAppMutation<Hotel, Partial<Hotel>>({
    key: ['hotels'],
    mutation: (body) =>
      $fetch<Hotel>('/v2/hotels', { method: 'POST', body }),
  })
}
