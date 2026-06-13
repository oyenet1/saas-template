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
  { label: 'Booked', value: 'booked' },
  { label: 'Checked in', value: 'checked_in' },
  { label: 'Checked out', value: 'checked_out' },
  { label: 'Cancelled', value: 'cancelled' },
]
const TYPE = [
  { label: 'Room', value: 'room' },
  { label: 'Hall', value: 'hall' },
]

const FIELDS = [
  { type: 'text', name: 'search', label: 'Search', placeholder: 'Code, guest, hotel…' },
  { type: 'select', name: 'status', label: 'Status', options: STATUS },
  { type: 'select', name: 'type', label: 'Type', options: TYPE },
  { type: 'date', name: 'fromDate', label: 'Created from' },
  { type: 'date', name: 'toDate', label: 'Created to' },
]

const columns: TableColumn<any>[] = [
  { id: 'code', accessorKey: 'code', header: 'Code',  cell: ({ row }) => h('div', { class: 'font-mono text-xs font-semibold' }, row.original.code) },
  { id: 'hotel', header: 'Hotel', cell: ({ row }) => row.original.hotelName || '—' },
  { id: 'customer', header: 'Guest', cell: ({ row }) => {
    const name = `${row.original.customerFirst ?? ''} ${row.original.customerLast ?? ''}`.trim()
    return h('div', [
      h('div', { class: 'font-semibold' }, name || '—'),
      h('div', { class: 'text-xs text-muted' }, row.original.customerPhone || ''),
    ])
  } },
  { id: 'status', accessorKey: 'status', header: 'Status',  cell: ({ row }) => h(resolveComponent('UBadge'), {
    color: row.original.status === 'checked_in' ? 'success' : row.original.status === 'cancelled' ? 'error' : 'neutral',
    variant: 'soft',
    size: 'sm',
  }, () => row.original.status) },
  { id: 'type', accessorKey: 'type', header: 'Type' },
  { id: 'checked_in', accessorKey: 'checked_in', header: 'In' },
  { id: 'checked_out', accessorKey: 'checked_out', header: 'Out' },
  { id: 'due', accessorKey: 'due', header: 'Amount',  cell: ({ row }) => row.original.due ? `₦${Number(row.original.due).toLocaleString()}` : '—' },
  { id: 'created_at', accessorKey: 'created_at', header: 'Created',  cell: ({ row }) => row.original.created_at ? new Date(row.original.created_at).toLocaleDateString() : '—' },
]

async function load() {
  loading.value = true
  try {
    const params: Record<string, any> = { page: page.value, perPage: perPage.value, ...filters.value }
    if (sort.value) {
      params.sortBy = sort.value.column
      params.order = sort.value.direction
    }
    const res: any = await api.listBookings(params)
    rows.value = res?.bookings ?? []
    total.value = res?.meta?.pagination?.total ?? 0
  } catch (e: any) {
    toast.add({ title: 'Failed to load bookings', description: e?.data?.message || e?.message, color: 'error' })
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
  <div class="p-4 sm:p-6 lg:p-10 space-y-5 sm:space-y-6 max-w-[1400px]">
    <header>
      <p class="text-xs font-semibold tracking-[0.2em] uppercase text-primary">Platform · People</p>
      <h1 class="text-xl sm:text-2xl font-bold tracking-tight">Bookings</h1>
      <p class="text-sm text-muted mt-1">Every booking across every hotel.</p>
    </header>

    <PlatformFilterBar v-model="filters" :fields="FIELDS" />

    <PlatformDataTable
      :columns="columns"
      :data="rows"
      :loading="loading"
      :total="total"
      :page="page"
      :per-page="perPage"
      empty-title="No bookings"
      @update:page="page = $event"
      @update:per-page="perPage = $event"
      @update:sort="sort = $event"
    />
  </div>
</template>
