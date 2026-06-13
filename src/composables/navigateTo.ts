import { router } from '~/router/index'

export function navigateTo(location: string | { path: string; query?: Record<string, string>; replace?: boolean }, options?: { replace?: boolean }) {
  const replace = options?.replace || (typeof location === 'object' && location.replace)
  if (replace) {
    router.replace(location)
  } else {
    router.push(location)
  }
}
