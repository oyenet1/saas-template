<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

definePageMeta({ layout: 'dashboard', middleware: ['platform-staff'] })

const api = usePlatformApi()
const toast = useToast()

const filters = ref<Record<string, any>>({})
const page = ref(1)
const perPage = ref(24)
const sort = ref<{ column: string; direction: 'asc' | 'desc' } | null>(null)
const loading = ref(false)
const rows = ref<any[]>([])
const total = ref(0)

const STATUS = [
  { label: 'Unpaid', value: 'unpaid' },
  { label: 'Paid', value: 'paid' },
  { label: 'Failed', value: 'failed' },
  { label: 'Refunded', value: 'refunded' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Expired', value: 'expired' },
]
const CURRENCY = [
  { label: 'NGN', value: 'NGN' },
  { label: 'USD', value: 'USD' },
]

const FIELDS = [
  { type: 'text', name: 'search', label: 'Search', placeholder: 'Reference, description…' },
  { type: 'select', name: 'status', label: 'Status', options: STATUS },
  { type: 'select', name: 'currency', label: 'Currency', options: CURRENCY },
  { type: 'date', name: 'fromDate', label: 'Created from' },
  { type: 'date', name: 'toDate', label: 'Created to' },
]

const columns: TableColumn<any>[] = [
  { id: 'reference', accessorKey: 'reference', header: 'Reference',  cell: ({ row }) => h('div', [
    h('div', { class: 'font-mono text-xs font-semibold' }, row.original.reference),
    h('div', { class: 'text-xs text-muted truncate max-w-xs' }, row.original.description || '—'),
  ]) },
  { id: 'hotel', header: 'Hotel', cell: ({ row }) => row.original.hotelName || '—' },
  { id: 'amount', accessorKey: 'amount', header: 'Amount',  cell: ({ row }) => {
    const v = Number(row.original.amount || 0)
    return `${row.original.currency === 'USD' ? '$' : '₦'}${v.toLocaleString()}`
  } },
  { id: 'status', accessorKey: 'status', header: 'Status',  cell: ({ row }) => h(resolveComponent('UBadge'), {
    color: row.original.status === 'paid' ? 'success' : row.original.status === 'unpaid' ? 'warning' : 'neutral',
    variant: 'soft',
    size: 'sm',
  }, () => row.original.status) },
  { id: 'subscription', accessorKey: 'subscription', header: 'Period' },
  { id: 'gateway', accessorKey: 'gateway', header: 'Gateway' },
  { id: 'created_at', accessorKey: 'created_at', header: 'Created',  cell: ({ row }) => row.original.created_at ? new Date(row.original.created_at).toLocaleDateString() : '—' },
  { id: 'actions', header: '', cell: ({ row }) => h(resolveComponent('UButton'), {
    to: `/platform/invoices/${row.original.id}`,
    size: 'xs',
    color: 'primary',
    variant: 'soft',
    icon: 'i-heroicons-eye',
  }) },
]

async function load() {
  loading.value = true
  try {
    const params: Record<string, any> = { page: page.value, perPage: perPage.value, ...filters.value }
    if (sort.value) {
      params.sortBy = sort.value.column
      params.order = sort.value.direction
    }
    const res: any = await api.listInvoices(params)
    rows.value = res?.invoices ?? []
    total.value = res?.meta?.pagination?.total ?? 0
  } catch (e: any) {
    toast.add({ title: 'Failed to load invoices', description: e?.data?.message || e?.message, color: 'error' })
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
</script>

<template>
  <div class="p-6 lg:p-10 space-y-6 max-w-[1400px]">
    <header>
      <p class="text-xs font-semibold tracking-[0.2em] uppercase text-primary">Platform · Commercial</p>
      <h1 class="text-2xl font-bold tracking-tight">Invoices</h1>
      <p class="text-sm text-muted mt-1">Every invoice across the platform.</p>
    </header>

    <PlatformFilterBar v-model="filters" :fields="FIELDS" />

    <PlatformDataTable
      :columns="columns"
      :data="rows"
      :loading="loading"
      :total="total"
      :page="page"
      :per-page="perPage"
      empty-title="No invoices"
      @update:page="page = $event"
      @update:per-page="perPage = $event"
      @update:sort="sort = $event"
    />
  </div>
</template>
