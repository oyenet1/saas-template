<script setup lang="ts">
import { adminRequest, mapFieldErrors } from '../../lib/admin-api'
import { useTenant } from '../../composables/useTenant'
import { useConfirm } from '../../composables/useConfirm'
import ConfirmDialog from '../../components/ConfirmDialog.vue'

const props = defineProps<{
  resource: string
  collectionKey: string
  singularKey: string
  title: string
  fields: {
    key: string
    label: string
    type: 'text' | 'textarea' | 'number' | 'url' | 'boolean' | 'select'
    required?: boolean
    options?: { label: string; value: string }[]
  }[]
}>()

const { bootstrap } = useTenant()
const confirm = useConfirm()
const loading = ref(true)
const saving = ref(false)
const rows = ref<Record<string, unknown>[]>([])
const editing = ref<Record<string, unknown> | null>(null)
const showForm = ref(false)
const form = reactive<Record<string, unknown>>({})
const fieldErrors = reactive<Record<string, string>>({})
const toast = useToast()

const apiBase = computed(() => `/api/v1/content/${props.resource}`)

function resetForm(row?: Record<string, unknown>) {
  Object.keys(form).forEach((k) => delete form[k])
  for (const f of props.fields) {
    form[f.key] = row?.[f.key] ?? (f.type === 'boolean' ? true : f.type === 'number' ? 0 : '')
  }
  editing.value = row ?? null
}

async function load() {
  loading.value = true
  await bootstrap()
  const res = await adminRequest<Record<string, unknown>>(`${apiBase.value}?perPage=50`)
  const data = res.data as Record<string, unknown[]> | undefined
  rows.value = (data?.[props.collectionKey] as Record<string, unknown>[]) ?? []
  loading.value = false
}

function openCreate() {
  resetForm()
  showForm.value = true
}

function openEdit(row: Record<string, unknown>) {
  resetForm(row)
  showForm.value = true
}

function applyErrors(errors: unknown) {
  Object.keys(fieldErrors).forEach((k) => delete fieldErrors[k])
  Object.assign(fieldErrors, mapFieldErrors(errors))
}

async function save() {
  saving.value = true
  applyErrors(undefined)
  const id = editing.value?.id as number | undefined
  const res = await adminRequest(apiBase.value + (id ? `/${id}` : ''), {
    method: id ? 'PATCH' : 'POST',
    body: { ...form },
  })
  saving.value = false
  if (!res.success) {
    applyErrors(res.errors)
    toast.add({ title: 'Save failed', description: res.message, color: 'error' })
    return
  }
  toast.add({ title: id ? 'Updated' : 'Created', color: 'success' })
  showForm.value = false
  await load()
}

async function remove(id: number) {
  const ok = await confirm.confirm('Delete this item?')
  if (!ok) return
  const res = await adminRequest(`${apiBase.value}/${id}`, { method: 'DELETE' })
  if (!res.success) {
    toast.add({ title: 'Delete failed', description: res.message, color: 'error' })
    return
  }
  toast.add({ title: 'Deleted', color: 'success' })
  await load()
}

function rowLabel(row: Record<string, unknown>) {
  return String(row.title ?? row.name ?? row.question ?? row.id)
}

onMounted(load)
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <p class="text-sm text-muted">{{ rows.length }} item(s)</p>
      <UButton size="xl" color="primary" icon="i-lucide-plus" :label="`Add ${title.toLowerCase().replace(/s$/, '')}`" @click="openCreate" />
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-primary" />
    </div>
    <div v-else-if="!rows.length" class="surface-card p-12 text-center text-muted">No items yet.</div>
    <div v-else class="surface-card divide-y divide-default">
      <div v-for="row in rows" :key="String(row.id)" class="flex items-center justify-between px-4 py-3">
        <div>
          <p class="font-medium">{{ rowLabel(row) }}</p>
          <p v-if="row.isActive !== undefined" class="text-xs text-muted">{{ row.isActive ? 'Active' : 'Inactive' }}</p>
        </div>
        <div class="flex gap-1">
          <UButton size="xl" variant="ghost" icon="i-lucide-pencil" @click="openEdit(row)" />
          <UButton size="xl" variant="ghost" color="error" icon="i-lucide-trash-2" @click="remove(row.id as number)" />
        </div>
      </div>
    </div>

    <ConfirmDialog :confirm="confirm" />
    <UModal v-model:open="showForm">
      <template #content>
        <div class="p-6 max-w-lg w-full">
          <h3 class="text-lg font-semibold mb-4">{{ editing ? 'Edit' : 'New' }} {{ singularKey }}</h3>
          <UForm :state="form" class="space-y-4" @submit="save">
            <UFormField
              v-for="field in fields"
              :key="field.key"
              :label="field.label"
              :name="field.key"
              :error="fieldErrors[field.key]"
              :required="field.required"
            >
              <UInput v-if="field.type === 'text' || field.type === 'url'" v-model="form[field.key]" size="xl" :type="field.type === 'url' ? 'url' : 'text'" class="w-full" />
              <UTextarea v-else-if="field.type === 'textarea'" v-model="form[field.key]" size="xl" :rows="4" class="w-full" />
              <UInput v-else-if="field.type === 'number'" v-model.number="form[field.key]" size="xl" type="number" class="w-full" />
              <USwitch v-else-if="field.type === 'boolean'" v-model="form[field.key]" />
              <USelect v-else-if="field.type === 'select'" v-model="form[field.key]" size="xl" :items="field.options ?? []" class="w-full" />
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
