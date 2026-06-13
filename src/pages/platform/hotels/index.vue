<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

definePageMeta({ layout: 'dashboard', middleware: ['platform-staff'] })

const api = usePlatformApi()
const toast = useToast()
const auth = useAuthStore()

const filters = ref<Record<string, any>>({})
const page = ref(1)
const perPage = ref(24)
const sort = ref<{ column: string; direction: 'asc' | 'desc' } | null>(null)
const loading = ref(false)
const rows = ref<any[]>([])
const total = ref(0)
const meta = ref<any>(null)

const STATUS_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Pending verification', value: 'pending_verification' },
  { label: 'Suspended', value: 'suspended' },
  { label: 'Expired', value: 'expired' },
  { label: 'Deactivated', value: 'deactivated' },
]

const INTERVAL_OPTIONS = [
  { label: 'Monthly', value: 'monthly' },
  { label: 'Half-yearly', value: 'half_yearly' },
  { label: 'Yearly', value: 'yearly' },
  { label: '2 years', value: '2years' },
  { label: '4 years', value: '4years' },
]

const columns: TableColumn<any>[] = [
  { id: 'name', accessorKey: 'name', header: 'Hotel',  cell: ({ row }) => h('div', { class: 'font-semibold' }, [
    h('div', row.original.name),
    h('div', { class: 'text-xs text-muted' }, row.original.code),
  ]) },
  { id: 'email', accessorKey: 'email', header: 'Email' },
  { id: 'status', accessorKey: 'status', header: 'Status',  cell: ({ row }) => h(resolveComponent('UBadge'), {
    color: row.original.status === 'active' ? 'success' : row.original.status === 'pending_verification' ? 'warning' : 'neutral',
    variant: 'soft',
    size: 'sm',
  }, () => row.original.status) },
  { id: 'package', header: 'Plan', cell: ({ row }) => row.original.packageName || '—' },
  { id: 'subscription_interval', header: 'Interval', cell: ({ row }) => row.original.subscription_interval || '—' },
  { id: 'city', header: 'Location', cell: ({ row }) => {
    const bits = [row.original.cityName, row.original.stateName, row.original.countryName].filter(Boolean)
    return bits.length ? bits.join(', ') : '—'
  } },
  { id: 'star_rating', header: '★', cell: ({ row }) => row.original.star_rating ? '★'.repeat(Number(row.original.star_rating)) : '—' },
  { id: 'created_at', accessorKey: 'created_at', header: 'Joined',  cell: ({ row }) => row.original.created_at ? new Date(row.original.created_at).toLocaleDateString() : '—' },
  { id: 'actions', header: '', cell: ({ row }) => h(resolveComponent('UButton'), {
    to: `/platform/hotels/${row.original.id}`,
    size: 'xs',
    color: 'primary',
    variant: 'soft',
    icon: 'i-heroicons-arrow-right',
  }) },
]

const fields = [
  { type: 'text', name: 'search', label: 'Search', placeholder: 'Name, email, code, address…' },
  { type: 'select', name: 'status', label: 'Status', options: STATUS_OPTIONS },
  { type: 'select', name: 'subscriptionInterval', label: 'Interval', options: INTERVAL_OPTIONS },
  { type: 'date', name: 'fromDate', label: 'Joined from' },
  { type: 'date', name: 'toDate', label: 'Joined to' },
]

async function load() {
  loading.value = true
  try {
    const params: Record<string, any> = {
      page: page.value,
      perPage: perPage.value,
      ...filters.value,
    }
    if (sort.value) {
      params.sortBy = sort.value.column
      params.order = sort.value.direction
    }
    const res: any = await api.listHotels(params)
    rows.value = res?.hotels ?? []
    total.value = res?.meta?.pagination?.total ?? 0
    meta.value = res?.meta?.pagination ?? null
  } catch (e: any) {
    toast.add({ title: 'Failed to load hotels', description: e?.data?.message || e?.message, color: 'error' })
    rows.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

watch([page, perPage, sort], () => load(), { deep: true })
let debounce: any
watch(filters, () => {
  clearTimeout(debounce)
  debounce = setTimeout(() => { page.value = 1; load() }, 250)
}, { deep: true })

onMounted(load)

const filterFields = fields
</script>

<template>
  <div class="p-6 lg:p-10 space-y-6 max-w-[1400px]">
    <header class="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <p class="text-xs font-semibold tracking-[0.2em] uppercase text-primary">Platform</p>
        <h1 class="text-2xl font-bold tracking-tight">Hotels</h1>
        <p class="text-sm text-muted mt-1">Every hotel on LodgeStatus. Search, filter, sort, and drill in.</p>
      </div>
      <div class="flex items-center gap-2">
        <UButton
          v-if="auth.isSuperAdmin"
          color="primary"
          icon="i-heroicons-arrow-down-tray"
          variant="soft"
          to="/platform/staff"
        >
          Platform Staff
        </UButton>
      </div>
    </header>

    <PlatformFilterBar v-model="filters" :fields="filterFields" />

    <PlatformDataTable
      :columns="columns"
      :data="rows"
      :loading="loading"
      :total="total"
      :page="page"
      :per-page="perPage"
      empty-title="No hotels match"
      empty-description="Try adjusting the filters or check back later."
      empty-icon="i-heroicons-building-office-2"
      @update:page="page = $event"
      @update:per-page="perPage = $event"
      @update:sort="sort = $event"
    />
  </div>
</template>
