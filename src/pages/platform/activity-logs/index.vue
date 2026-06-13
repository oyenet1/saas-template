<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

definePageMeta({ layout: 'dashboard', middleware: ['platform-staff'] })

const auth = useAuthStore()

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
  { id: 'created_at', accessorKey: 'created_at', header: 'When',  cell: ({ row }) => h('div', [
    h('div', { class: 'font-semibold' }, new Date(row.original.created_at).toLocaleString()),
    h('div', { class: 'text-xs text-muted' }, row.original.source || '—'),
  ]) },
  { id: 'log_name', accessorKey: 'log_name', header: 'Log' },
  { id: 'event', accessorKey: 'event', header: 'Event',  cell: ({ row }) => h(resolveComponent('UBadge'), { variant: 'soft', size: 'sm' }, () => row.original.event) },
  { id: 'description', accessorKey: 'description', header: 'Description', cell: ({ row }) => h('div', { class: 'max-w-md truncate' }, row.original.description) },
  { id: 'subject_type', header: 'Subject', cell: ({ row }) => h('div', { class: 'text-xs' }, [
    h('div', row.original.subject_type || '—'),
    h('div', { class: 'text-muted' }, row.original.subject_id || ''),
  ]) },
  { id: 'causer', header: 'Causer', cell: ({ row }) => h('div', { class: 'text-xs' }, [
    h('div', row.original.causer_type || '—'),
    h('div', { class: 'text-muted' }, row.original.causer_id || ''),
  ]) },
]

async function load() {
  loading.value = true
  try {
    const params: Record<string, any> = { page: page.value, perPage: perPage.value, ...filters.value }
    if (sort.value) {
      params.sortBy = sort.value.column
      params.order = sort.value.direction
    }
    const res: any = await $fetch(`${getApiBase()}/v1/activity-logs`, {
      method: 'GET',
      query: params,
      headers: { Authorization: `Bearer ${auth.accessToken}` },
    })
    const body = (res as any)?.data ?? res
    rows.value = body?.activities ?? []
    total.value = body?.meta?.pagination?.total ?? 0
  } catch (e: any) {
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
      <h1 class="text-2xl font-bold tracking-tight">Activity logs</h1>
      <p class="text-sm text-muted mt-1">Every change across the platform.</p>
    </header>

    <PlatformFilterBar v-model="filters" :fields="FIELDS" />

    <PlatformDataTable
      :columns="columns"
      :data="rows"
      :loading="loading"
      :total="total"
      :page="page"
      :per-page="perPage"
      empty-title="No activity yet"
      @update:page="page = $event"
      @update:per-page="perPage = $event"
      @update:sort="sort = $event"
    />
  </div>
</template>
