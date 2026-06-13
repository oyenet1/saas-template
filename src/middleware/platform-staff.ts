/**
 * Gate /platform/* routes to super-admin and customer-care.
 * Anyone else is bounced to /admin.
 */
export default defineNuxtRouteMiddleware((to: any) => {
  if (!to.path.startsWith('/platform')) return
  const auth = useAuthStore()
  if (!auth.isPlatformStaff) {
    return navigateTo('/admin', { replace: true })
  }
})
