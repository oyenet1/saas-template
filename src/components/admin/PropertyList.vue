<script setup lang="ts">
import { adminRequest } from '../../lib/admin-api'
import { useTenant } from '../../composables/useTenant'

interface PropertyRow {
  id: number
  title: string
  slug: string
  status: string
  purpose: string
  price: number
  currency: string
}

const { bootstrap } = useTenant()
const loading = ref(true)
const rows = ref<PropertyRow[]>([])
const toast = useToast()

async function load() {
  loading.value = true
  await bootstrap()
  const res = await adminRequest<{ properties: PropertyRow[] }>('/api/v1/admin/properties?perPage=50')
  rows.value = res.data?.properties ?? []
  loading.value = false
}

async function remove(id: number) {
  if (!confirm('Delete this property?')) return
  const res = await adminRequest(`/api/v1/admin/properties/${id}`, { method: 'DELETE' })
  if (!res.success) {
    toast.add({ title: 'Delete failed', description: res.message, color: 'error' })
    return
  }
  toast.add({ title: 'Property deleted', color: 'success' })
  await load()
}

onMounted(load)

const columns = [
  { accessorKey: 'title', header: 'Title' },
  { accessorKey: 'purpose', header: 'Purpose' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'price', header: 'Price' },
  { id: 'actions', header: '' },
]
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <p class="text-sm text-muted">{{ rows.length }} listing(s)</p>
      <UButton to="/admin/properties/new" color="primary" icon="i-lucide-plus" label="New property" />
    </div>
    <div v-if="loading" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-primary" />
    </div>
    <div v-else-if="!rows.length" class="surface-card p-12 text-center text-muted">
      No properties yet. Create your first listing.
    </div>
    <div v-else class="surface-card overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-[var(--surface-muted)] border-b border-default">
          <tr>
            <th v-for="col in columns" :key="col.accessorKey ?? col.id" class="text-left px-4 py-3 font-medium text-muted">
              {{ col.header }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.id" class="border-b border-default last:border-0">
            <td class="px-4 py-3 font-medium">{{ row.title }}</td>
            <td class="px-4 py-3 capitalize">{{ row.purpose }}</td>
            <td class="px-4 py-3">
              <UBadge :label="row.status" color="neutral" variant="subtle" />
            </td>
            <td class="px-4 py-3">{{ row.currency }} {{ Number(row.price).toLocaleString() }}</td>
            <td class="px-4 py-3 text-right space-x-2">
              <UButton :to="`/admin/properties/${row.id}`" size="xs" variant="ghost" icon="i-lucide-pencil" />
              <UButton size="xs" variant="ghost" color="error" icon="i-lucide-trash-2" @click="remove(row.id)" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
