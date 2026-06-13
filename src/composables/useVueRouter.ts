import { useRoute, useRouter } from 'vue-router'

export function useVueRouter() {
  const route = useRoute()
  const router = useRouter()

  return { route, router }
}
