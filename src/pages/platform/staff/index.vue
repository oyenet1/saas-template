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

const ROLE = [
  { label: 'Super Admin', value: 'super-admin' },
  { label: 'Customer Service', value: 'customer-service' },
]

const FIELDS = [
  { type: 'text', name: 'search', label: 'Search' },
  { type: 'select', name: 'role', label: 'Role', options: ROLE },
  { type: 'date', name: 'fromDate', label: 'Created from' },
  { type: 'date', name: 'toDate', label: 'Created to' },
]

const columns: TableColumn<any>[] = [
  { id: 'firstname', accessorKey: 'firstname', header: 'Name',  cell: ({ row }) => h('div', [
    h('div', { class: 'font-semibold' }, `${row.original.firstname} ${row.original.lastname}`.trim()),
    h('div', { class: 'text-xs text-muted' }, `@${row.original.username}`),
  ]) },
  { id: 'email', accessorKey: 'email', header: 'Email' },
  { id: 'phone', accessorKey: 'phone', header: 'Phone' },
  { id: 'current_role', accessorKey: 'current_role', header: 'Role',  cell: ({ row }) => h(resolveComponent('UBadge'), { variant: 'soft', color: row.original.current_role === 'super-admin' ? 'error' : 'primary', size: 'sm' }, () => row.original.current_role) },
  { id: 'can_login', header: 'Status', cell: ({ row }) => h(resolveComponent('UBadge'), {
    color: row.original.can_login ? 'success' : 'neutral',
    variant: 'soft',
    size: 'sm',
  }, () => row.original.can_login ? 'Active' : 'Disabled') },
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
    const res: any = await api.listStaff(params)
    rows.value = res?.staff ?? []
    total.value = res?.meta?.pagination?.total ?? 0
  } catch (e: any) {
    toast.add({ title: 'Failed to load staff', description: e?.data?.message || e?.message, color: 'error' })
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
      <p class="text-xs font-semibold tracking-[0.2em] uppercase text-primary">Platform · Tenants</p>
      <h1 class="text-2xl font-bold tracking-tight">Platform staff</h1>
      <p class="text-sm text-muted mt-1">Super-admins and customer-care agents with platform-wide access.</p>
    </header>

    <PlatformFilterBar v-model="filters" :fields="FIELDS" />

    <PlatformDataTable
      :columns="columns"
      :data="rows"
      :loading="loading"
      :total="total"
      :page="page"
      :per-page="perPage"
      empty-title="No platform staff"
      @update:page="page = $event"
      @update:per-page="perPage = $event"
      @update:sort="sort = $event"
    />
  </div>
</template>
