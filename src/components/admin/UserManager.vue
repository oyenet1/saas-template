<script setup lang="ts">
import { adminRequest } from '../../lib/admin-api'
import { useTenant } from '../../composables/useTenant'
import { useConfirm } from '../../composables/useConfirm'
import ConfirmDialog from '../../components/ConfirmDialog.vue'

const { bootstrap } = useTenant()
const confirm = useConfirm()
const loading = ref(true)
const saving = ref(false)
const rows = ref<Record<string, unknown>[]>([])
const showForm = ref(false)
const editing = ref<Record<string, unknown> | null>(null)
const form = reactive<{ name: string; email: string; password: string }>({ name: '', email: '', password: '' })
const fieldErrors = reactive<Record<string, string>>({})
const toast = useToast()
const showPassword = ref(false)

async function load() {
  loading.value = true
  await bootstrap()
  const res = await adminRequest<Record<string, unknown>>('/api/v1/users?perPage=100')
  const data = res.data as Record<string, unknown[]> | undefined
  rows.value = (data?.users as Record<string, unknown>[]) ?? []
  loading.value = false
}

function resetForm(row?: Record<string, unknown>) {
  form.name = (row?.name as string) ?? ''
  form.email = (row?.email as string) ?? ''
  form.password = ''
  editing.value = row ?? null
  Object.keys(fieldErrors).forEach((k) => delete fieldErrors[k])
}

function openCreate() {
  resetForm()
  showForm.value = true
}

function openEdit(row: Record<string, unknown>) {
  resetForm(row)
  showForm.value = true
}

async function save() {
  saving.value = true
  Object.keys(fieldErrors).forEach((k) => delete fieldErrors[k])
  const id = editing.value?.id as string | undefined
  const body: Record<string, unknown> = { name: form.name, email: form.email }
  if (form.password) body.password = form.password
  const res = await adminRequest(id ? `/api/v1/users/${id}` : '/api/v1/users', {
    method: id ? 'PATCH' : 'POST',
    body,
  })
  saving.value = false
  if (!res.success) {
    toast.add({ title: 'Save failed', description: res.message, color: 'error' })
    return
  }
  toast.add({ title: id ? 'Updated' : 'Created', color: 'success' })
  showForm.value = false
  await load()
}

async function remove(id: string) {
  const ok = await confirm.confirm('Delete this user?')
  if (!ok) return
  const res = await adminRequest(`/api/v1/users/${id}`, { method: 'DELETE' })
  if (!res.success) {
    toast.add({ title: 'Delete failed', description: res.message, color: 'error' })
    return
  }
  toast.add({ title: 'Deleted', color: 'success' })
  await load()
}

onMounted(load)
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <p class="text-sm text-muted">{{ rows.length }} user(s)</p>
      <UButton size="xl" color="primary" icon="i-lucide-plus" label="Add User" @click="openCreate" />
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-primary" />
    </div>
    <div v-else-if="!rows.length" class="p-12 text-center text-muted border border-dashed border-[var(--surface-border)] rounded-xl">No users yet.</div>
    <div v-else class="border border-[var(--surface-border)] rounded-xl overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="bg-[var(--surface-muted)] text-muted text-xs uppercase tracking-wider">
            <th class="text-left px-4 py-3 font-medium">Name</th>
            <th class="text-left px-4 py-3 font-medium">Email</th>
            <th class="text-left px-4 py-3 font-medium hidden sm:table-cell">Created</th>
            <th class="text-right px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[var(--surface-border)]">
          <tr v-for="row in rows" :key="String(row.id)" class="hover:bg-[var(--surface-muted)]/50 transition-colors">
            <td class="px-4 py-3 font-medium">{{ (row.name as string) || '—' }}</td>
            <td class="px-4 py-3 text-muted">{{ row.email }}</td>
            <td class="px-4 py-3 text-xs text-muted hidden sm:table-cell">{{ (row.createdAt as string)?.split('T')[0] }}</td>
            <td class="px-4 py-3 text-right">
              <div class="flex gap-1 justify-end">
                <UButton size="xl" variant="ghost" icon="i-lucide-pencil" @click="openEdit(row)" />
                <UButton size="xl" variant="ghost" color="error" icon="i-lucide-trash-2" @click="remove(row.id as string)" />
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
          <h3 class="text-lg font-semibold mb-4">{{ editing ? 'Edit' : 'New' }} User</h3>
          <UForm :state="form" class="space-y-4" @submit="save">
            <UFormField label="Name" name="name" :error="fieldErrors.name" required>
              <UInput v-model="form.name" size="xl" placeholder="Full name" class="w-full" />
            </UFormField>
            <UFormField label="Email" name="email" :error="fieldErrors.email" required>
              <UInput v-model="form.email" size="xl" type="email" placeholder="email@example.com" class="w-full" />
            </UFormField>
            <UFormField
              label="Password"
              name="password"
              :error="fieldErrors.password"
              :required="!editing"
              :help="editing ? 'Leave blank to keep current' : 'At least 8 characters'"
            >
              <UInput
                v-model="form.password"
                size="xl"
                :type="showPassword ? 'text' : 'password'"
                :placeholder="editing ? 'Leave blank' : 'Strong password'"
                autocomplete="new-password"
                class="w-full"
              >
                <template #trailing>
                  <button type="button" tabindex="-1" @click="showPassword = !showPassword" aria-label="Toggle password visibility">
                    <UIcon :name="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'" class="w-4 h-4 text-muted" />
                  </button>
                </template>
              </UInput>
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
