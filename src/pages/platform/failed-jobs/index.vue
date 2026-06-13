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
  { type: 'text', name: 'queue', label: 'Queue' },
  { type: 'text', name: 'jobName', label: 'Job' },
  { type: 'date', name: 'fromDate', label: 'From' },
  { type: 'date', name: 'toDate', label: 'To' },
]

const columns: TableColumn<any>[] = [
  { id: 'failed_at', accessorKey: 'failed_at', header: 'When',  cell: ({ row }) => row.original.failed_at ? new Date(row.original.failed_at).toLocaleString() : '—' },
  { id: 'queue', accessorKey: 'queue', header: 'Queue',  cell: ({ row }) => h(resolveComponent('UBadge'), { variant: 'soft', size: 'sm' }, () => row.original.queue) },
  { id: 'job_name', accessorKey: 'job_name', header: 'Job' },
  { id: 'hotel_id', header: 'Hotel', cell: ({ row }) => row.original.hotel_id || '—' },
  { id: 'error', header: 'Error', cell: ({ row }) => h('div', { class: 'max-w-md text-xs text-rose-600 dark:text-rose-400 truncate' }, row.original.error || row.original.error_message || '—') },
]

async function load() {
  loading.value = true
  try {
    const params: Record<string, any> = { page: page.value, perPage: perPage.value, ...filters.value }
    if (sort.value) {
      params.sortBy = sort.value.column
      params.order = sort.value.direction
    }
    const res: any = await api.listFailedJobs(params)
    rows.value = res?.failedJobs ?? []
    total.value = res?.meta?.pagination?.total ?? 0
  } catch (e: any) {
    toast.add({ title: 'Failed to load failed jobs', description: e?.data?.message || e?.message, color: 'error' })
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
      <p class="text-xs font-semibold tracking-[0.2em] uppercase text-primary">Platform · Activity</p>
      <h1 class="text-2xl font-bold tracking-tight">Failed jobs</h1>
      <p class="text-sm text-muted mt-1">Background jobs that failed to complete.</p>
    </header>

    <PlatformFilterBar v-model="filters" :fields="FIELDS" />

    <PlatformDataTable
      :columns="columns"
      :data="rows"
      :loading="loading"
      :total="total"
      :page="page"
      :per-page="perPage"
      empty-title="No failed jobs"
      @update:page="page = $event"
      @update:per-page="perPage = $event"
      @update:sort="sort = $event"
    />
  </div>
</template>
