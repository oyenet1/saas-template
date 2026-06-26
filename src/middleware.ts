import { defineMiddleware } from 'astro:middleware'
import { getSessionUser } from './lib/auth-client'

const PROTECTED_PREFIXES = ['/admin', '/dashboard'] as const
const GUEST_ONLY_PREFIXES = ['/login', '/register'] as const

function matchesPrefix(pathname: string, prefixes: readonly string[]): boolean {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname, search } = context.url
  const user = await getSessionUser(context.request)

  context.locals.user = user

  if (!user && matchesPrefix(pathname, PROTECTED_PREFIXES)) {
    const nextPath = encodeURIComponent(pathname + search)
    return context.redirect(`/login?next=${nextPath}`)
  }

  if (user && matchesPrefix(pathname, GUEST_ONLY_PREFIXES)) {
    return context.redirect(pathname === '/register' ? '/dashboard' : '/admin')
  }

  return next()
})
