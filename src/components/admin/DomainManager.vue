<script setup lang="ts">
import { adminRequest } from '../../lib/admin-api'
import { useTenant } from '../../composables/useTenant'
import { useConfirm } from '../../composables/useConfirm'
import ConfirmDialog from '../../components/ConfirmDialog.vue'

const { bootstrap, activeCompany } = useTenant()
const confirm = useConfirm()
const loading = ref(true)
const rows = ref<Record<string, unknown>[]>([])
const showForm = ref(false)
const saving = ref(false)
const form = reactive<{ domain: string }>({ domain: '' })
const fieldErrors = reactive<Record<string, string>>({})
const toast = useToast()

async function load() {
  loading.value = true
  await bootstrap()
  if (!activeCompany.value) {
    loading.value = false
    return
  }
  const res = await adminRequest<Record<string, unknown[]>>(`/api/v1/companies/${activeCompany.value.id}/domains`)
  const data = res.data as Record<string, unknown[]> | undefined
  rows.value = (data?.domains as Record<string, unknown>[]) ?? []
  loading.value = false
}

function openCreate() {
  form.domain = ''
  Object.keys(fieldErrors).forEach((k) => delete fieldErrors[k])
  showForm.value = true
}

async function save() {
  saving.value = true
  Object.keys(fieldErrors).forEach((k) => delete fieldErrors[k])
  const res = await adminRequest(`/api/v1/companies/${activeCompany.value?.id}/domains`, {
    method: 'POST',
    body: form,
  })
  saving.value = false
  if (!res.success) {
    toast.add({ title: 'Failed', description: res.message, color: 'error' })
    return
  }
  toast.add({ title: 'Domain added', color: 'success' })
  showForm.value = false
  await load()
}

async function remove(id: number) {
  const ok = await confirm.confirm('Remove this domain?')
  if (!ok) return
  const res = await adminRequest(`/api/v1/companies/${activeCompany.value?.id}/domains/${id}`, { method: 'DELETE' })
  if (!res.success) {
    toast.add({ title: 'Delete failed', description: res.message, color: 'error' })
    return
  }
  toast.add({ title: 'Domain removed', color: 'success' })
  await load()
}

onMounted(load)
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <p class="text-sm text-muted">{{ activeCompany ? `Company: ${activeCompany.name}` : 'No active company' }}</p>
      <UButton size="xl" color="primary" icon="i-lucide-plus" label="Add Domain" :disabled="!activeCompany" @click="openCreate" />
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-primary" />
    </div>
    <div v-else-if="!rows.length" class="p-12 text-center text-muted border border-dashed border-[var(--surface-border)] rounded-xl">No custom domains configured.</div>
    <div v-else class="border border-[var(--surface-border)] rounded-xl overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="bg-[var(--surface-muted)] text-muted text-xs uppercase tracking-wider">
            <th class="text-left px-4 py-3 font-medium">Domain</th>
            <th class="text-left px-4 py-3 font-medium">Status</th>
            <th class="text-right px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[var(--surface-border)]">
          <tr v-for="row in rows" :key="String(row.id)" class="hover:bg-[var(--surface-muted)]/50 transition-colors">
            <td class="px-4 py-3 font-medium">{{ row.domain }}</td>
            <td class="px-4 py-3">
              <span :class="[row.verified ? 'text-success' : 'text-warning', 'text-xs font-medium']">
                {{ row.verified ? 'Verified' : 'Pending' }}
              </span>
            </td>
            <td class="px-4 py-3 text-right">
              <UButton size="xl" variant="ghost" color="error" icon="i-lucide-trash-2" @click="remove(row.id as number)" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ConfirmDialog :confirm="confirm" />
    <UModal v-model:open="showForm">
      <template #content>
        <div class="p-6 max-w-md w-full">
          <h3 class="text-lg font-semibold mb-4">Add Custom Domain</h3>
          <UForm :state="form" class="space-y-4" @submit="save">
            <UFormField label="Domain" name="domain" :error="fieldErrors.domain" required>
              <UInput v-model="form.domain" size="xl" placeholder="e.g. www.yourcompany.com" class="w-full" />
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
