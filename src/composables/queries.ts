/**
 * Pinia Colada query helpers.
 *
 * Wrap $fetch calls with caching, de-duplication, refetch and reactive keys.
 *
 * Usage:
 *   const { state, asyncStatus, refresh } = useAppQuery({
 *     key: ['hotels'],
 *     query: () => $fetch('/v2/hotels'),
 *   })
 */
import { useQuery, useMutation, useQueryCache } from '@pinia/colada'
import type { UseQueryOptions, UseMutationOptions } from '@pinia/colada'

export function useAppQuery<T = unknown>(options: {
  key: any[]
  query: () => Promise<T>
  staleTime?: number
  enabled?: import('vue').Ref<boolean> | (() => boolean)
}) {
  const cache = useQueryCache()

  return useQuery<T>({
    key: options.key,
    query: options.query,
    staleTime: options.staleTime ?? 30_000,
    enabled: typeof options.enabled === 'function' ? options.enabled : undefined,
  } as UseQueryOptions<T>)
}

export function useAppMutation<TData = unknown, TVariables = void>(
  options: {
    key?: any[]
    mutation: (vars: TVariables) => Promise<TData>
    onSuccess?: (data: TData, vars: TVariables) => void
    onError?: (err: unknown, vars: TVariables) => void
  },
) {
  const cache = useQueryCache()

  return useMutation<TData, TVariables>({
    mutation: options.mutation,
    onSuccess(data, vars) {
      if (options.key) {
        cache.invalidateQueries({ key: options.key })
      }
      options.onSuccess?.(data, vars)
    },
    onError(err, vars) {
      options.onError?.(err, vars)
    },
  } as UseMutationOptions<TData, TVariables>)
}
