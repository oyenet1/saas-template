// Nuxt provides these as auto-imports at runtime.
// Declared here so vue-tsc can type-check middleware/auth/composables
// without depending on the full Nuxt type package.

declare function defineNuxtRouteMiddleware(
  fn: (to: any, from: any) => any | Promise<any>,
): unknown

declare function useAuthStore(): any
declare function useNotificationsStore(): any
declare function useToast(): any
declare function useColorMode(): any
declare function useApiBase(): string | undefined
declare function useRoute(): any
declare function useRouter(): any
declare function useNotificationListener(): any
declare function getApiBase(): string | undefined
declare function getApiBase(): string
