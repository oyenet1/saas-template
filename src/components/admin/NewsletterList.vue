<script setup lang="ts">
import { adminRequest, mapFieldErrors } from '../../lib/admin-api'
import { useTenant } from '../../composables/useTenant'
import { useConfirm } from '../../composables/useConfirm'
import ConfirmDialog from '../../components/ConfirmDialog.vue'

const { bootstrap } = useTenant()
const confirm = useConfirm()
const loading = ref(true)
const rows = ref<Record<string, unknown>[]>([])
const showForm = ref(false)
const saving = ref(false)
const form = reactive<{ email: string }>({ email: '' })
const fieldErrors = reactive<Record<string, string>>({})
const toast = useToast()

async function load() {
  loading.value = true
  await bootstrap()
  const res = await adminRequest<Record<string, unknown>>('/api/v1/leads/newsletters?perPage=200')
  const data = res.data as Record<string, unknown[]> | undefined
  rows.value = (data?.subscribers as Record<string, unknown>[]) ?? []
  loading.value = false
}

function openCreate() {
  Object.assign(form, { email: '' })
  Object.keys(fieldErrors).forEach((k) => delete fieldErrors[k])
  showForm.value = true
}

async function save() {
  saving.value = true
  Object.keys(fieldErrors).forEach((k) => delete fieldErrors[k])
  const res = await adminRequest('/api/v1/leads/newsletters/subscribe', { method: 'POST', body: form })
  saving.value = false
  if (!res.success) {
    Object.assign(fieldErrors, mapFieldErrors(res.errors))
    toast.add({ title: 'Failed', description: res.message, color: 'error' })
    return
  }
  toast.add({ title: 'Subscriber added', color: 'success' })
  showForm.value = false
  await load()
}

async function toggleSub(row: Record<string, unknown>) {
  const subscribed = !Boolean(row.subscribed ?? row.isSubscribed)
  const endpoint = subscribed ? '/api/v1/leads/newsletters/subscribe' : '/api/v1/leads/newsletters/unsubscribe'
  const res = await adminRequest(endpoint, {
    method: 'POST',
    body: { email: row.email },
  })
  if (!res.success) {
    toast.add({ title: 'Failed', description: res.message, color: 'error' })
    return
  }
  row.subscribed = subscribed
  row.isSubscribed = subscribed
  toast.add({ title: subscribed ? 'Subscribed' : 'Unsubscribed', color: 'success' })
}

async function remove(id: number) {
  const ok = await confirm.confirm('Delete this subscriber?')
  if (!ok) return
  const res = await adminRequest(`/api/v1/leads/newsletters/${id}`, { method: 'DELETE' })
  if (!res.success) {
    toast.add({ title: 'Delete failed', description: res.message, color: 'error' })
    return
  }
  toast.add({ title: 'Deleted', color: 'success' })
  await load()
}

function exportCsv() {
  const csv = [['Email', 'Subscribed', 'Date'].join(',')]
  for (const row of rows.value) {
    const subscribed = Boolean(row.subscribed ?? row.isSubscribed)
    csv.push([row.email, subscribed ? 'Yes' : 'No', row.createdAt as string].join(','))
  }
  const blob = new Blob([csv.join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'newsletters.csv'
  a.click()
  URL.revokeObjectURL(url)
}

onMounted(load)
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <p class="text-sm text-muted">{{ rows.length }} subscriber(s)</p>
      <div class="flex gap-2">
        <UButton size="xl" color="neutral" variant="outline" icon="i-lucide-download" label="Export CSV" @click="exportCsv" />
        <UButton size="xl" color="primary" icon="i-lucide-plus" label="Add Subscriber" @click="openCreate" />
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-primary" />
    </div>
    <div v-else-if="!rows.length" class="p-12 text-center text-muted border border-dashed border-[var(--surface-border)] rounded-xl">No subscribers yet.</div>
    <div v-else class="border border-[var(--surface-border)] rounded-xl overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="bg-[var(--surface-muted)] text-muted text-xs uppercase tracking-wider">
            <th class="text-left px-4 py-3 font-medium">Email</th>
            <th class="text-left px-4 py-3 font-medium">Status</th>
            <th class="text-left px-4 py-3 font-medium hidden sm:table-cell">Subscribed</th>
            <th class="text-right px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[var(--surface-border)]">
          <tr v-for="row in rows" :key="String(row.id)" class="hover:bg-[var(--surface-muted)]/50 transition-colors">
            <td class="px-4 py-3 font-medium">{{ row.email }}</td>
            <td class="px-4 py-3">
              <span :class="[(row.subscribed ?? row.isSubscribed) ? 'text-success' : 'text-muted', 'text-xs font-medium']">
                {{ (row.subscribed ?? row.isSubscribed) ? 'Active' : 'Unsubscribed' }}
              </span>
            </td>
            <td class="px-4 py-3 text-xs text-muted hidden sm:table-cell">{{ (row.createdAt as string)?.split('T')[0] }}</td>
            <td class="px-4 py-3 text-right">
              <div class="flex gap-1 justify-end">
                <UButton size="xl" variant="ghost" :label="(row.subscribed ?? row.isSubscribed) ? 'Unsubscribe' : 'Subscribe'" @click="toggleSub(row)" />
                <UButton size="xl" variant="ghost" color="error" icon="i-lucide-trash-2" @click="remove(row.id as number)" />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ConfirmDialog :confirm="confirm" />
    <UModal v-model:open="showForm">
      <template #content>
        <div class="p-6 max-w-md w-full">
          <h3 class="text-lg font-semibold mb-4">Add Subscriber</h3>
          <UForm :state="form" class="space-y-4" @submit="save">
            <UFormField label="Email" name="email" :error="fieldErrors.email" required>
              <UInput v-model="form.email" size="xl" type="email" placeholder="email@example.com" class="w-full" />
            </UFormField>
            <div class="flex gap-2 pt-2">
              <UButton type="submit" size="xl" color="primary" label="Save" :loading="saving" />
              <UButton size="xl" color="neutral" variant="outline" label="Cancel" @click="showForm = false" />
            </div>
          </UForm>
        </div>
      </template>
    </UModal>
  </div>
</template>
