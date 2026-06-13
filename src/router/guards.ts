import type { Router } from 'vue-router'

const PUBLIC_ROUTES = new Set([
  '/',
  '/search',
  '/about',
  '/faq',
  '/contact',
  '/sign-in',
  '/sign-up',
  '/forgot-password',
  '/forgot-password-otp',
  '/otp',
  '/reset-password',
])

const DEFAULT_AUTH_REDIRECT = '/dashboard'

export function getSafeRedirect(value: unknown) {
  return typeof value === 'string' && value.startsWith('/') ? value : DEFAULT_AUTH_REDIRECT
}

function titleFromPath(path: string) {
  if (path === '/') return 'LodgeStatus'

  const clean = path
    .split('?')[0]
    .split('#')[0]
    .split('/')
    .filter(Boolean)
    .map(segment => segment.replace(/[-_]/g, ' '))
    .map(segment => segment.replace(/\b\w/g, char => char.toUpperCase()))

  return clean.join(' · ')
}

export function setupRouterGuards(router: Router) {
  router.beforeEach(async (to) => {
    const auth = useAuthStore()
    await auth.hydrate()

    const hasToken = auth.hasToken
    const hasUser = Boolean(auth.user)

    if (PUBLIC_ROUTES.has(to.path)) {
      if (hasToken && !hasUser) {
        await auth.ensureSession()
      }

      if (auth.user && (to.path === '/sign-in' || to.path === '/sign-up')) {
        return {
          path: getSafeRedirect(to.query.redirect),
          replace: true,
        }
      }

      return true
    }

    if (!hasToken) {
      return {
        path: '/sign-in',
        query: { redirect: to.fullPath },
      }
    }

    if (!hasUser) {
      const ok = await auth.ensureSession()

      if (!ok) {
        return {
          path: '/sign-in',
          query: { redirect: to.fullPath },
        }
      }
    }

    return true
  })

  router.afterEach((to) => {
    const pageTitle = typeof to.meta.title === 'string' && to.meta.title.trim()
      ? to.meta.title.trim()
      : titleFromPath(to.path)

    document.title = pageTitle ? `${pageTitle} | LodgeStatus` : 'LodgeStatus'
  })
}
