import { createHead } from '@unhead/vue/client'
import { createPinia } from 'pinia'
import { PiniaColada } from '@pinia/colada'
import ui from '@nuxt/ui/vue-plugin'
import { createApp } from 'vue'
import { router } from './router/index'
import { LCircle, LIcon, LMap, LMarker, LPolyline, LTileLayer, LTooltip } from '@vue-leaflet/vue-leaflet'
import 'echarts'
import VChart from 'vue-echarts'
import App from './App.vue'
import { setupRouterGuards } from './router/guards'
import './assets/css/main.css'
import 'leaflet/dist/leaflet.css'

const app = createApp(App)
const pinia = createPinia()
const head = createHead()

app.use(head)
app.use(pinia)
app.use(PiniaColada, {})
app.use(router)
app.use(ui)

app.component('VChart', VChart)
app.component('LMap', LMap)
app.component('LTileLayer', LTileLayer)
app.component('LMarker', LMarker)
app.component('LIcon', LIcon)
app.component('LTooltip', LTooltip)
app.component('LPolyline', LPolyline)
app.component('LCircle', LCircle)

const previousWarnHandler = app.config.warnHandler
app.config.warnHandler = (message: string, instance: any, trace: string) => {
  if (message.includes('<Suspense> is an experimental feature')) {
    return
  }

  previousWarnHandler?.(message, instance, trace)
}

setupRouterGuards(router)

const auth = useAuthStore(pinia)
await auth.hydrate()

if (auth.hasToken && !auth.user) {
  void auth.ensureSession().catch(() => {})
}

await router.isReady()
app.mount('#app')
