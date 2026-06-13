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

const IS_ACTIVE_OPTIONS = [
  { label: 'Active', value: true },
  { label: 'Inactive', value: false },
]

const FIELDS = [
  { type: 'text', name: 'search', label: 'Search' },
  { type: 'select', name: 'isActive', label: 'Active', options: IS_ACTIVE_OPTIONS },
  { type: 'date', name: 'fromDate', label: 'Created from' },
  { type: 'date', name: 'toDate', label: 'Created to' },
]

const columns: TableColumn<any>[] = [
  { id: 'name', accessorKey: 'name', header: 'Plan',  cell: ({ row }) => h('div', [
    h('div', { class: 'font-semibold' }, row.original.name),
    h('div', { class: 'text-xs text-muted' }, `Order #${row.original.sort_order ?? 0}`),
  ]) },
  { id: 'amount', accessorKey: 'amount', header: 'Monthly base',  cell: ({ row }) => formatCurrency(row.original.amount) },
  { id: 'subscribers', header: 'Hotels',  cell: ({ row }) => h(resolveComponent('UBadge'), { color: 'primary', variant: 'soft' }, () => String(row.original.subscribers ?? 0)) },
  { id: 'is_active', header: 'Status', cell: ({ row }) => h(resolveComponent('UBadge'), {
    color: row.original.is_active ? 'success' : 'neutral',
    variant: 'soft',
    size: 'sm',
  }, () => row.original.is_active ? 'Active' : 'Inactive') },
  { id: 'price_ngn_yearly', header: 'NGN yearly', cell: ({ row }) => row.original.price_ngn_yearly ? `₦${Number(row.original.price_ngn_yearly).toLocaleString()}` : '—' },
  { id: 'price_usd_yearly', header: 'USD yearly', cell: ({ row }) => row.original.price_usd_yearly ? `$${Number(row.original.price_usd_yearly).toLocaleString()}` : '—' },
  { id: 'created_at', accessorKey: 'created_at', header: 'Created',  cell: ({ row }) => row.original.created_at ? new Date(row.original.created_at).toLocaleDateString() : '—' },
  { id: 'actions', header: '', cell: ({ row }) => h('div', { class: 'flex gap-1' }, [
    h(resolveComponent('UButton'), {
      to: `/platform/plans/${row.original.id}`,
      size: 'xs',
      color: 'primary',
      variant: 'soft',
      icon: 'i-heroicons-eye',
    }),
    auth.isSuperAdmin && h(resolveComponent('UButton'), {
      to: `/platform/plans/${row.original.id}/edit`,
      size: 'xs',
      color: 'neutral',
      variant: 'soft',
      icon: 'i-heroicons-pencil',
    }),
  ].filter(Boolean)) },
]

async function load() {
  loading.value = true
  try {
    const params: Record<string, any> = { page: page.value, perPage: perPage.value, ...filters.value }
    if (sort.value) {
      params.sortBy = sort.value.column
      params.order = sort.value.direction
    }
    const res: any = await api.listPlans(params)
    rows.value = res?.plans ?? []
    total.value = res?.meta?.pagination?.total ?? 0
  } catch (e: any) {
    toast.add({ title: 'Failed to load plans', description: e?.data?.message || e?.message, color: 'error' })
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

function formatCurrency(n: any) {
  const v = Number(n || 0)
  return `₦${v.toLocaleString()}`
}
</script>

<template>
  <div class="p-6 lg:p-10 space-y-6 max-w-[1400px]">
    <header class="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <p class="text-xs font-semibold tracking-[0.2em] uppercase text-primary">Platform · Commercial</p>
        <h1 class="text-2xl font-bold tracking-tight">Plans</h1>
        <p class="text-sm text-muted mt-1">Subscription packages offered to hotels.</p>
      </div>
      <UButton
        v-if="auth.isSuperAdmin"
        to="/platform/plans/new"
        color="primary"
        icon="i-heroicons-plus"
      >
        New plan
      </UButton>
    </header>

    <PlatformFilterBar v-model="filters" :fields="FIELDS" />

    <PlatformDataTable
      :columns="columns"
      :data="rows"
      :loading="loading"
      :total="total"
      :page="page"
      :per-page="perPage"
      empty-title="No plans yet"
      empty-description="Create your first plan to start selling subscriptions."
      @update:page="page = $event"
      @update:per-page="perPage = $event"
      @update:sort="sort = $event"
    />
  </div>
</template>
