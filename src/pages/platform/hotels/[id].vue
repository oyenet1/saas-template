<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

definePageMeta({ layout: 'dashboard', middleware: ['platform-staff'] })

const route = useRoute()
const api = usePlatformApi()
const toast = useToast()
const auth = useAuthStore()

const hotel = ref<any>(null)
const loading = ref(true)
const id = computed(() => String((route.params as any).id))

async function load() {
  loading.value = true
  try {
    hotel.value = await api.getHotel(id.value)
  } catch (e: any) {
    toast.add({ title: 'Failed to load hotel', description: e?.data?.message || e?.message, color: 'error' })
  } finally {
    loading.value = false
  }
}
onMounted(load)

const statusColor = (s: string) =>
  s === 'active' ? 'success' : s === 'pending_verification' ? 'warning' : 'neutral'
</script>

<template>
  <div class="p-6 lg:p-10 max-w-5xl space-y-6">
    <div class="flex items-center gap-2 text-sm text-muted">
      <UButton to="/platform/hotels" variant="link" color="primary" size="sm" icon="i-heroicons-arrow-left">
        Back to hotels
      </UButton>
    </div>

    <div v-if="loading" class="py-16 flex justify-center">
      <UIcon name="i-heroicons-arrow-path" class="size-8 animate-spin text-primary" />
    </div>

    <div v-else-if="hotel" class="space-y-6">
      <header class="space-y-2">
        <p class="text-xs font-semibold tracking-[0.2em] uppercase text-primary">Hotel</p>
        <h1 class="text-3xl font-bold tracking-tight">{{ hotel.name }}</h1>
        <p class="text-sm text-muted">{{ hotel.code }} · {{ hotel.email }}</p>
      </header>

      <div class="grid sm:grid-cols-3 gap-3">
        <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <p class="text-xs text-muted">Bookings</p>
          <p class="text-2xl font-bold mt-1">{{ hotel.metrics?.bookings ?? 0 }}</p>
        </div>
        <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <p class="text-xs text-muted">Customers</p>
          <p class="text-2xl font-bold mt-1">{{ hotel.metrics?.customers ?? 0 }}</p>
        </div>
        <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <p class="text-xs text-muted">Staff</p>
          <p class="text-2xl font-bold mt-1">{{ hotel.metrics?.staff ?? 0 }}</p>
        </div>
      </div>

      <div class="grid sm:grid-cols-2 gap-4">
        <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-3">
          <p class="text-xs font-semibold uppercase text-muted">Account</p>
          <div class="grid grid-cols-2 gap-y-2 text-sm">
            <span class="text-muted">Status</span>
            <UBadge :color="statusColor(hotel.status)" variant="soft" size="sm">{{ hotel.status }}</UBadge>
            <span class="text-muted">Plan</span><span>{{ hotel.packageName || '—' }}</span>
            <span class="text-muted">Interval</span><span>{{ hotel.subscription_interval || '—' }}</span>
            <span class="text-muted">Star rating</span><span>{{ hotel.star_rating ? '★'.repeat(Number(hotel.star_rating)) : '—' }}</span>
            <span class="text-muted">Renew</span><span>{{ hotel.renew || '—' }}</span>
            <span class="text-muted">Joined</span><span>{{ hotel.created_at ? new Date(hotel.created_at).toLocaleDateString() : '—' }}</span>
          </div>
        </div>
        <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-3">
          <p class="text-xs font-semibold uppercase text-muted">Contact & location</p>
          <div class="grid grid-cols-2 gap-y-2 text-sm">
            <span class="text-muted">Telephone</span><span>{{ hotel.telephone }}</span>
            <span class="text-muted">Email</span><span class="truncate">{{ hotel.email }}</span>
            <span class="text-muted">Address</span><span>{{ hotel.address || '—' }}</span>
            <span class="text-muted">City</span><span>{{ hotel.cityName || '—' }}</span>
            <span class="text-muted">State</span><span>{{ hotel.stateName || '—' }}</span>
            <span class="text-muted">Country</span><span>{{ hotel.countryName || '—' }}</span>
          </div>
        </div>
      </div>

      <div v-if="auth.isSuperAdmin" class="flex flex-wrap gap-2">
        <UButton to="/platform/invoices" color="primary" variant="soft" icon="i-heroicons-document-text">
          View invoices
        </UButton>
        <UButton to="/platform/subscriptions" color="primary" variant="soft" icon="i-heroicons-credit-card">
          View subscriptions
        </UButton>
      </div>
    </div>
  </div>
</template>
