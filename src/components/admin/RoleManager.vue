<script setup lang="ts">
import { adminRequest } from '../../lib/admin-api'
import { useTenant } from '../../composables/useTenant'
import { useConfirm } from '../../composables/useConfirm'
import ConfirmDialog from '../../components/ConfirmDialog.vue'

const { bootstrap } = useTenant()
const confirm = useConfirm()
const loading = ref(true)
const roles = ref<Record<string, unknown>[]>([])
const permissions = ref<Record<string, unknown>[]>([])
const showForm = ref(false)
const editing = ref<Record<string, unknown> | null>(null)
const saving = ref(false)
const form = reactive<{ name: string; description?: string }>({ name: '' })
const fieldErrors = reactive<Record<string, string>>({})
const toast = useToast()

async function load() {
  loading.value = true
  await bootstrap()
  const [roleRes, permRes] = await Promise.all([
    adminRequest<Record<string, unknown>>('/api/v1/rbac/roles?perPage=100'),
    adminRequest<Record<string, unknown>>('/api/v1/rbac/permissions?perPage=200'),
  ])
  const rd = roleRes.data as Record<string, unknown[]> | undefined
  const pd = permRes.data as Record<string, unknown[]> | undefined
  roles.value = (rd?.roles as Record<string, unknown>[]) ?? []
  permissions.value = (pd?.permissions as Record<string, unknown>[]) ?? []
  loading.value = false
}

function openCreate() {
  editing.value = null
  form.name = ''
  form.description = ''
  Object.keys(fieldErrors).forEach((k) => delete fieldErrors[k])
  showForm.value = true
}

function openEdit(role: Record<string, unknown>) {
  editing.value = role
  form.name = role.name as string
  form.description = role.description as string | undefined
  Object.keys(fieldErrors).forEach((k) => delete fieldErrors[k])
  showForm.value = true
}

async function save() {
  saving.value = true
  Object.keys(fieldErrors).forEach((k) => delete fieldErrors[k])
  const id = editing.value?.id as number | undefined
  const res = await adminRequest(id ? `/api/v1/rbac/roles/${id}` : '/api/v1/rbac/roles', {
    method: id ? 'PATCH' : 'POST',
    body: form,
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

async function remove(id: number) {
  const ok = await confirm.confirm('Delete this role?')
  if (!ok) return
  const res = await adminRequest(`/api/v1/rbac/roles/${id}`, { method: 'DELETE' })
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
      <p class="text-sm text-muted">{{ roles.length }} role(s)</p>
      <UButton size="xl" color="primary" icon="i-lucide-plus" label="Add Role" @click="openCreate" />
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-primary" />
    </div>
    <div v-else-if="!roles.length" class="p-12 text-center text-muted border border-dashed border-[var(--surface-border)] rounded-xl">No roles yet.</div>
    <div v-else class="space-y-3">
      <div v-for="role in roles" :key="String(role.id)" class="flex items-center justify-between p-4 rounded-xl border border-[var(--surface-border)] bg-elevated">
        <div>
          <p class="font-medium">{{ role.name }}</p>
          <p v-if="role.description" class="text-xs text-muted mt-0.5">{{ role.description }}</p>
          <p class="text-xs text-muted mt-0.5">{{ role.guardName }} · {{ (role as any).permissions_count ?? 0 }} permission(s)</p>
        </div>
        <div class="flex gap-1">
          <UButton size="xl" variant="ghost" icon="i-lucide-pencil" @click="openEdit(role)" />
          <UButton size="xl" variant="ghost" color="error" icon="i-lucide-trash-2" @click="remove(role.id as number)" />
        </div>
      </div>

      <details class="mt-8">
        <summary class="text-sm font-medium text-muted cursor-pointer hover:text-default transition-colors">
          All Permissions ({{ permissions.length }})
        </summary>
        <div class="mt-3 flex flex-wrap gap-2">
          <span
            v-for="perm in permissions"
            :key="String(perm.id)"
            class="px-2.5 py-1 rounded-md text-xs font-medium bg-primary/5 text-primary"
          >
            {{ perm.name }}
          </span>
        </div>
      </details>
    </div>

    <ConfirmDialog :confirm="confirm" />
    <UModal v-model:open="showForm">
      <template #content>
        <div class="p-6 max-w-md w-full">
          <h3 class="text-lg font-semibold mb-4">{{ editing ? 'Edit' : 'New' }} Role</h3>
          <UForm :state="form" class="space-y-4" @submit="save">
            <UFormField label="Name" name="name" :error="fieldErrors.name" required>
              <UInput v-model="form.name" size="xl" placeholder="e.g. editor" class="w-full" />
            </UFormField>
            <UFormField label="Description" name="description">
              <UInput v-model="form.description" size="xl" placeholder="Optional description" class="w-full" />
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
