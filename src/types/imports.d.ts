/* eslint-disable */
/* prettier-ignore */
// @ts-nocheck
/**
 * Virtual module declarations for Nuxt-style imports in the Vue app.
 * The actual runtime values come from `@nuxt/ui/vue-plugin`,
 * `import.meta.env`, or the `composables/` directory.
 */

declare module '#imports' {
  export function useRuntimeConfig(): {
    public: {
      apiBase: string
      socketUrl: string
    }
  }
  export function useHead(input: any): void
  export function useSeoMeta(input: any): void
  export function useRoute(): any
  export function useRouter(): any
  export function useColorMode(): {
    value: 'light' | 'dark' | 'system'
    preference: 'light' | 'dark' | 'system'
    forced: boolean
    resolved: 'light' | 'dark'
    unknown: boolean
    system: 'light' | 'dark'
  }
  export function useToast(): {
    add(toast: any): any
    update(id: string | number, toast: any): void
    remove(id?: string | number): void
    clear(): void
  }
  export function useOverlay(): any
  export function defineShortcuts(options: Record<string, ((e: any) => void) | false | null | undefined>): void
  export function useAppState(): any
  export function useId(): string
}
