<script setup lang="ts">
import { adminRequest, mapFieldErrors } from '../../lib/admin-api'
import { useTenant } from '../../composables/useTenant'

interface CategoryRow {
  id: number
  name: string
  slug: string
  isFeatured: boolean
}

const { bootstrap } = useTenant()
const loading = ref(true)
const saving = ref(false)
const rows = ref<CategoryRow[]>([])
const showForm = ref(false)
const editingId = ref<number | null>(null)
const form = reactive({ name: '', slug: '', description: '', isFeatured: false, sortOrder: 0 })
const fieldErrors = reactive<Record<string, string>>({})
const toast = useToast()

async function load() {
  loading.value = true
  await bootstrap()
  const res = await adminRequest<{ categories: CategoryRow[] }>('/api/v1/categories?perPage=100')
  rows.value = res.data?.categories ?? []
  loading.value = false
}

function openCreate() {
  editingId.value = null
  Object.assign(form, { name: '', slug: '', description: '', isFeatured: false, sortOrder: 0 })
  showForm.value = true
}

function openEdit(row: CategoryRow) {
  editingId.value = row.id
  Object.assign(form, row)
  showForm.value = true
}

async function save() {
  saving.value = true
  Object.keys(fieldErrors).forEach((k) => delete fieldErrors[k])
  const path = editingId.value ? `/api/v1/categories/${editingId.value}` : '/api/v1/categories'
  const res = await adminRequest(path, { method: editingId.value ? 'PATCH' : 'POST', body: { ...form } })
  saving.value = false
  if (!res.success) {
    Object.assign(fieldErrors, mapFieldErrors(res.errors))
    toast.add({ title: 'Save failed', description: res.message, color: 'error' })
    return
  }
  toast.add({ title: 'Saved', color: 'success' })
  showForm.value = false
  await load()
}

async function remove(id: number) {
  if (!confirm('Delete this category?')) return
  const res = await adminRequest(`/api/v1/categories/${id}`, { method: 'DELETE' })
  if (!res.success) {
    toast.add({ title: 'Delete failed', description: res.message, color: 'error' })
    return
  }
  await load()
}

onMounted(load)
</script>

<template>
  <div>
    <div class="flex justify-end mb-6">
      <UButton color="primary" icon="i-lucide-plus" label="Add category" @click="openCreate" />
    </div>
    <div v-if="loading" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-primary" />
    </div>
    <div v-else class="surface-card divide-y divide-default">
      <div v-for="row in rows" :key="row.id" class="flex items-center justify-between px-4 py-3">
        <div>
          <p class="font-medium">{{ row.name }}</p>
          <p class="text-xs text-muted">{{ row.slug }}</p>
        </div>
        <div class="flex gap-1">
          <UButton size="xs" variant="ghost" icon="i-lucide-pencil" @click="openEdit(row)" />
          <UButton size="xs" variant="ghost" color="error" icon="i-lucide-trash-2" @click="remove(row.id)" />
        </div>
      </div>
    </div>
    <UModal v-model:open="showForm">
      <template #content>
        <div class="p-6 max-w-md w-full">
          <UForm :state="form" class="space-y-4" @submit="save">
            <UFormField label="Name" name="name" :error="fieldErrors.name" required>
              <UInput v-model="form.name" class="w-full" />
            </UFormField>
            <UFormField label="Slug" name="slug" :error="fieldErrors.slug">
              <UInput v-model="form.slug" class="w-full" />
            </UFormField>
            <UFormField label="Description" name="description">
              <UTextarea v-model="form.description" class="w-full" />
            </UFormField>
            <UFormField label="Featured" name="isFeatured">
              <USwitch v-model="form.isFeatured" />
            </UFormField>
            <UButton type="submit" color="primary" label="Save" :loading="saving" block />
          </UForm>
        </div>
      </template>
    </UModal>
  </div>
</template>
