<script setup lang="ts">
import { adminRequest } from '../../lib/admin-api'
import { useTenant } from '../../composables/useTenant'

interface InquiryRow {
  id: number
  name: string
  email: string
  phone?: string
  message: string
  status: string
  createdAt?: string
}

const { bootstrap, activeCompany } = useTenant()
const loading = ref(true)
const rows = ref<InquiryRow[]>([])
const toast = useToast()

const statusOptions = [
  { label: 'New', value: 'new' },
  { label: 'Contacted', value: 'contacted' },
  { label: 'Qualified', value: 'qualified' },
  { label: 'Converted', value: 'converted' },
  { label: 'Closed', value: 'closed' },
  { label: 'Spam', value: 'spam' },
]

async function load() {
  loading.value = true
  await bootstrap()
  const res = await adminRequest<{ inquiries: InquiryRow[] }>('/api/v1/leads/inquiries?perPage=50')
  rows.value = res.data?.inquiries ?? []
  loading.value = false
}

async function updateStatus(id: number, status: string) {
  const res = await adminRequest(`/api/v1/leads/inquiries/${id}/status`, {
    method: 'PATCH',
    body: { status },
  })
  if (!res.success) {
    toast.add({ title: 'Update failed', description: res.message, color: 'error' })
    return
  }
  toast.add({ title: 'Status updated', color: 'success' })
  await load()
}

onMounted(load)
</script>

<template>
  <div>
    <div v-if="loading" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-primary" />
    </div>
    <div v-else-if="!rows.length" class="surface-card p-12 text-center text-muted">No inquiries yet.</div>
    <div v-else class="space-y-4">
      <div v-for="row in rows" :key="row.id" class="surface-card p-5">
        <div class="flex flex-wrap items-start justify-between gap-4 mb-3">
          <div>
            <p class="font-semibold">{{ row.name }}</p>
            <p class="text-sm text-muted">{{ row.email }} <span v-if="row.phone">· {{ row.phone }}</span></p>
          </div>
          <USelect
            :model-value="row.status"
            :items="statusOptions"
            class="w-40"
            @update:model-value="(v: string) => updateStatus(row.id, v)"
          />
        </div>
        <p class="text-sm whitespace-pre-wrap">{{ row.message }}</p>
      </div>
    </div>
  </div>
</template>
