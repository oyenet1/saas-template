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

const FIELDS = [
  { type: 'text', name: 'search', label: 'Search' },
  { type: 'date', name: 'fromDate', label: 'From' },
  { type: 'date', name: 'toDate', label: 'To' },
]

const columns: TableColumn<any>[] = [
  { id: 'name', accessorKey: 'name', header: 'State', cell: ({ row }) => h('div', [
    h('div', { class: 'font-semibold' }, row.original.name),
    h('div', { class: 'text-xs text-muted' }, row.original.country_code || ''),
  ]) },
  { id: 'country', header: 'Country', cell: ({ row }) => row.original.countryName || '—' },
  { id: 'hotelCount', header: 'Hotels', cell: ({ row }) => h(resolveComponent('UBadge'), {
    color: 'primary',
    variant: 'soft',
    size: 'sm',
  }, () => String(row.original.hotelCount ?? 0)) },
  { id: 'created_at', accessorKey: 'created_at', header: 'Added', cell: ({ row }) => row.original.created_at ? new Date(row.original.created_at).toLocaleDateString() : '—' },
]

async function load() {
  loading.value = true
  try {
    const params: Record<string, any> = { page: page.value, perPage: perPage.value, ...filters.value }
    if (sort.value) {
      params.sortBy = sort.value.column
      params.order = sort.value.direction
    }
    const res: any = await api.listStates(params)
    rows.value = res?.states ?? []
    total.value = res?.meta?.pagination?.total ?? 0
  } catch (e: any) {
    toast.add({ title: 'Failed to load states', description: e?.data?.message || e?.message, color: 'error' })
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
      <p class="text-xs font-semibold tracking-[0.2em] uppercase text-primary">Platform · Locations</p>
      <h1 class="text-xl sm:text-2xl font-bold tracking-tight">States</h1>
      <p class="text-sm text-muted mt-1">Every state / region with its hotel count.</p>
    </header>

    <PlatformFilterBar v-model="filters" :fields="FIELDS" />

    <PlatformDataTable
      :columns="columns"
      :data="rows"
      :loading="loading"
      :total="total"
      :page="page"
      :per-page="perPage"
      empty-title="No states"
      @update:page="page = $event"
      @update:per-page="perPage = $event"
      @update:sort="sort = $event"
    />
  </div>
</template>
