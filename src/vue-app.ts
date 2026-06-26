import { createRouter, createWebHistory, createMemoryHistory } from 'vue-router'
import type { App } from 'vue'

export default function (app: App) {
  const router = createRouter({
    history: import.meta.env.SSR ? createMemoryHistory() : createWebHistory(),
    routes: [{ path: '/:pathMatch(.*)*', name: 'catch-all', component: {} as any }],
  })
  app.use(router)
}
