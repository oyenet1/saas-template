<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, defineAsyncComponent } from 'vue'
import { useRoute } from 'vue-router'
import AuthLayout from '~/layouts/auth.vue'
import DashboardLayout from '~/layouts/dashboard.vue'
import DefaultLayout from '~/layouts/default.vue'
import LaunchLayout from '~/layouts/launch.vue'

const route = useRoute()
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1024)

function updateWidth() {
  windowWidth.value = window.innerWidth
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', updateWidth, { passive: true })
  }
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', updateWidth)
  }
})

const AUTH_PATHS = new Set([
  '/sign-in',
  '/sign-up',
  '/forgot-password',
  '/forgot-password-otp',
  '/otp',
  '/reset-password',
])

const isMobile = computed(() => windowWidth.value < 1024)

const layoutComponent = computed(() => {
  if (route.path === '/launch') return LaunchLayout
  if (AUTH_PATHS.has(route.path)) return AuthLayout
  if (route.path === '/preview' || route.path.startsWith('/admin') || route.path.startsWith('/platform')) return DashboardLayout
  return DefaultLayout
})

const componentKey = computed(() => route.fullPath)
</script>

<template>
  <UApp :toaster="{ position: 'top-right' }">
    <RouterView v-slot="{ Component }">
      <component :is="layoutComponent">
        <Suspense>
          <component :is="Component" :key="componentKey" />

          <template #fallback>
            <div class="min-h-screen flex items-center justify-center">
              <UIcon name="i-heroicons-arrow-path" class="size-8 animate-spin text-primary" />
            </div>
          </template>
        </Suspense>
      </component>
    </RouterView>
  </UApp>
</template>
