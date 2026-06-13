<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: ['platform-staff'] })

const auth = useAuthStore()
const api = usePlatformApi()

const roleLabel = computed(() => {
  if (auth.isSuperAdmin) return 'Super Admin'
  if (auth.isCustomerCare) return 'Customer Care'
  return 'Platform Team'
})

const greetingName = computed(
  () => auth.fullName || auth.user?.firstname || auth.user?.email || 'there',
)

const stats = reactive({
  hotels: 0,
  customers: 0,
  subscriptions: 0,
  failedJobs: 0,
})

const statsLoading = ref(true)

onMounted(async () => {
  try {
    const [hotels, customers, subs, failed] = await Promise.allSettled([
      api.listHotels({ perPage: 1 }),
      api.listCustomers({ perPage: 1 }),
      api.listSubscriptions({ perPage: 1 }),
      api.listFailedJobs({ perPage: 1 }),
    ])
    if (hotels.status === 'fulfilled') stats.hotels = hotels.value?.meta?.pagination?.total ?? 0
    if (customers.status === 'fulfilled') stats.customers = customers.value?.meta?.pagination?.total ?? 0
    if (subs.status === 'fulfilled') stats.subscriptions = subs.value?.meta?.pagination?.total ?? 0
    if (failed.status === 'fulfilled') stats.failedJobs = failed.value?.meta?.pagination?.total ?? 0
  } finally {
    statsLoading.value = false
  }
})

const superAdminLinks = [
  { label: 'All Hotels',          description: 'Browse every hotel on the platform',         to: '/platform/hotels',                icon: 'i-heroicons-building-office-2' },
  { label: 'Plans',               description: 'Manage subscription packages',              to: '/platform/plans',                 icon: 'i-heroicons-rectangle-stack' },
  { label: 'Subscriptions',       description: 'Active and historical subscriptions',       to: '/platform/subscriptions',         icon: 'i-heroicons-credit-card' },
  { label: 'Invoices',            description: 'Every invoice in the system',               to: '/platform/invoices',              icon: 'i-heroicons-document-text' },
  { label: 'Platform Staff',      description: 'Super-admins and customer-care agents',     to: '/platform/staff',                 icon: 'i-heroicons-user-group' },
  { label: 'Locations',           description: 'Cities and states with hotel counts',       to: '/platform/locations',             icon: 'i-heroicons-map' },
  { label: 'Customers',           description: 'Every guest across every hotel',            to: '/platform/customers',             icon: 'i-heroicons-user' },
  { label: 'Bookings',            description: 'Every booking across the platform',         to: '/platform/bookings',              icon: 'i-heroicons-calendar-days' },
  { label: 'Activity Logs',       description: 'Audit trail of every change',               to: '/platform/activity-logs',         icon: 'i-heroicons-pulse' },
  { label: 'Failed Jobs',         description: 'Background jobs that errored',              to: '/platform/failed-jobs',           icon: 'i-heroicons-exclamation-triangle' },
]

const customerCareLinks = [
  { label: 'All Hotels',          description: 'Browse every hotel on the platform',         to: '/platform/hotels',                icon: 'i-heroicons-building-office-2' },
  { label: 'Customers',           description: 'Every guest across every hotel',            to: '/platform/customers',             icon: 'i-heroicons-user' },
  { label: 'Bookings',            description: 'Every booking across the platform',         to: '/platform/bookings',              icon: 'i-heroicons-calendar-days' },
  { label: 'Subscriptions',       description: 'Active and historical subscriptions',       to: '/platform/subscriptions',         icon: 'i-heroicons-credit-card' },
  { label: 'Invoices',            description: 'Every invoice in the system',               to: '/platform/invoices',              icon: 'i-heroicons-document-text' },
  { label: 'Locations',           description: 'Cities and states with hotel counts',       to: '/platform/locations',             icon: 'i-heroicons-map' },
  { label: 'Activity Logs',       description: 'Audit trail of every change',               to: '/platform/activity-logs',         icon: 'i-heroicons-pulse' },
  { label: 'Failed Jobs',         description: 'Background jobs that errored',              to: '/platform/failed-jobs',           icon: 'i-heroicons-exclamation-triangle' },
]

const quickLinks = computed(() => auth.isSuperAdmin ? superAdminLinks : customerCareLinks)
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-10 space-y-6 sm:space-y-8 max-w-6xl">
    <header class="space-y-2">
      <p class="text-xs font-semibold tracking-[0.2em] uppercase text-primary">LodgeStatus Platform</p>
      <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
        Welcome back, {{ greetingName }}
      </h1>
      <p class="text-sm text-muted">
        You're signed in as <span class="font-semibold text-gray-900 dark:text-white">{{ roleLabel }}</span>.
        Your view spans every tenant on LodgeStatus.
      </p>
    </header>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        <p class="text-xs text-muted">Hotels</p>
        <p class="text-2xl sm:text-3xl font-bold mt-1">
          <USkeleton v-if="statsLoading" class="h-7 w-16" />
          <span v-else>{{ stats.hotels.toLocaleString() }}</span>
        </p>
      </div>
      <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        <p class="text-xs text-muted">Customers</p>
        <p class="text-2xl sm:text-3xl font-bold mt-1">
          <USkeleton v-if="statsLoading" class="h-7 w-16" />
          <span v-else>{{ stats.customers.toLocaleString() }}</span>
        </p>
      </div>
      <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        <p class="text-xs text-muted">Subscriptions</p>
        <p class="text-2xl sm:text-3xl font-bold mt-1">
          <USkeleton v-if="statsLoading" class="h-7 w-16" />
          <span v-else>{{ stats.subscriptions.toLocaleString() }}</span>
        </p>
      </div>
      <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        <p class="text-xs text-muted">Failed jobs</p>
        <p class="text-2xl sm:text-3xl font-bold mt-1" :class="stats.failedJobs > 0 ? 'text-rose-600' : ''">
          <USkeleton v-if="statsLoading" class="h-7 w-16" />
          <span v-else>{{ stats.failedJobs.toLocaleString() }}</span>
        </p>
      </div>
    </div>

    <section class="space-y-3">
      <h2 class="text-sm font-semibold tracking-wide uppercase text-muted">Quick actions</h2>
      <div class="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <NuxtLink
          v-for="link in quickLinks"
          :key="link.to"
          :to="link.to"
          class="group rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 sm:p-5 hover:border-primary hover:shadow-md transition-all"
        >
          <div class="size-10 rounded-lg bg-primary/10 text-primary grid place-items-center mb-4 group-hover:scale-105 transition-transform">
            <UIcon :name="link.icon" class="size-5" />
          </div>
          <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ link.label }}</p>
          <p class="text-xs text-muted mt-1 leading-relaxed">{{ link.description }}</p>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
