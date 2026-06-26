<script setup lang="ts">
import { adminRequest, mapFieldErrors } from '../../lib/admin-api'
import { useTenant } from '../../composables/useTenant'

interface MemberRow {
  id: number
  userId: string
  role: string
  email?: string
  name?: string
  isSuspended?: boolean
}

const { bootstrap, activeCompany } = useTenant()
const loading = ref(true)
const saving = ref(false)
const rows = ref<MemberRow[]>([])
const showForm = ref(false)
const form = reactive({ userId: '', role: 'agent' })
const fieldErrors = reactive<Record<string, string>>({})
const toast = useToast()

const roleOptions = [
  { label: 'Admin', value: 'admin' },
  { label: 'Agent', value: 'agent' },
  { label: 'Editor', value: 'editor' },
  { label: 'Viewer', value: 'viewer' },
]

async function load() {
  loading.value = true
  await bootstrap()
  if (!activeCompany.value) {
    loading.value = false
    return
  }
  const res = await adminRequest<{ members: MemberRow[] }>(
    `/companies/${activeCompany.value.id}/members?perPage=50`,
  )
  rows.value = res.data?.members ?? []
  loading.value = false
}

async function invite() {
  if (!activeCompany.value) return
  saving.value = true
  Object.keys(fieldErrors).forEach((k) => delete fieldErrors[k])
  const res = await adminRequest(`/companies/${activeCompany.value.id}/members`, {
    method: 'POST',
    body: { ...form },
  })
  saving.value = false
  if (!res.success) {
    Object.assign(fieldErrors, mapFieldErrors(res.errors))
    toast.add({ title: 'Invite failed', description: res.message, color: 'error' })
    return
  }
  toast.add({ title: 'Member added', color: 'success' })
  showForm.value = false
  form.userId = ''
  await load()
}

async function remove(userId: string) {
  if (!activeCompany.value || !confirm('Remove this member?')) return
  const res = await adminRequest(`/companies/${activeCompany.value.id}/members/${userId}`, { method: 'DELETE' })
  if (!res.success) {
    toast.add({ title: 'Remove failed', description: res.message, color: 'error' })
    return
  }
  await load()
}

onMounted(load)
</script>

<template>
  <div>
    <div class="flex justify-end mb-6">
      <UButton color="primary" icon="i-lucide-user-plus" label="Add member" @click="showForm = true" />
    </div>
    <div v-if="loading" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-primary" />
    </div>
    <div v-else class="surface-card divide-y divide-default">
      <div v-for="row in rows" :key="row.userId" class="flex items-center justify-between px-4 py-3">
        <div>
          <p class="font-medium">{{ row.name || row.email || row.userId }}</p>
          <p class="text-xs text-muted capitalize">{{ row.role }}</p>
        </div>
        <UButton
          v-if="row.role !== 'owner'"
          size="xs"
          variant="ghost"
          color="error"
          icon="i-lucide-user-minus"
          @click="remove(row.userId)"
        />
      </div>
    </div>
    <UModal v-model:open="showForm">
      <template #content>
        <div class="p-6 max-w-md w-full">
          <h3 class="font-semibold mb-4">Invite staff member</h3>
          <UForm :state="form" class="space-y-4" @submit="invite">
            <UFormField label="User ID" name="userId" :error="fieldErrors.userId" hint="Better Auth user id" required>
              <UInput v-model="form.userId" class="w-full" />
            </UFormField>
            <UFormField label="Role" name="role">
              <USelect v-model="form.role" :items="roleOptions" class="w-full" />
            </UFormField>
            <UButton type="submit" color="primary" label="Add member" :loading="saving" block />
          </UForm>
        </div>
      </template>
    </UModal>
  </div>
</template>
