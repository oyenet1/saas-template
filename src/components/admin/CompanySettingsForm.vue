<script setup lang="ts">
import { adminRequest, mapFieldErrors } from '../../lib/admin-api'
import { useTenant } from '../../composables/useTenant'

const { activeCompany, bootstrap } = useTenant()
const form = reactive({ name: '', slug: '', plan: 'free' })
const loading = ref(false)
const fieldErrors = reactive<Record<string, string>>({})
const toast = useToast()

const planOptions = [
  { label: 'Free', value: 'free' },
  { label: 'Starter', value: 'starter' },
  { label: 'Pro', value: 'pro' },
  { label: 'Enterprise', value: 'enterprise' },
]

onMounted(async () => {
  await bootstrap()
  if (activeCompany.value) {
    form.name = activeCompany.value.name
    form.slug = activeCompany.value.slug
    form.plan = activeCompany.value.plan ?? 'free'
  }
})

function applyErrors(errors: unknown) {
  Object.keys(fieldErrors).forEach((k) => delete fieldErrors[k])
  Object.assign(fieldErrors, mapFieldErrors(errors))
}

async function onSubmit() {
  if (!activeCompany.value) return
  loading.value = true
  applyErrors(undefined)
  const res = await adminRequest<{ company: unknown }>(`/api/v1/companies/${activeCompany.value.id}`, {
    method: 'PATCH',
    body: { name: form.name.trim(), slug: form.slug.trim(), plan: form.plan },
  })
  loading.value = false
  if (!res.success) {
    applyErrors(res.errors)
    toast.add({ title: 'Update failed', description: res.message, color: 'error' })
    return
  }
  toast.add({ title: 'Company updated', color: 'success', icon: 'i-lucide-check-circle-2' })
  await bootstrap()
}
</script>

<template>
  <div class="surface-card p-6 max-w-xl">
    <UForm :state="form" class="space-y-4" @submit="onSubmit">
      <UFormField label="Company name" name="name" :error="fieldErrors.name" required>
        <UInput v-model="form.name" size="xl" class="w-full" />
      </UFormField>
      <UFormField label="Slug" name="slug" :error="fieldErrors.slug" required>
        <UInput v-model="form.slug" size="xl" class="w-full" />
      </UFormField>
      <UFormField label="Plan" name="plan">
        <USelect v-model="form.plan" size="xl" :items="planOptions" class="w-full" />
      </UFormField>
      <UButton type="submit" size="xl" color="primary" label="Save company" icon="i-lucide-save" :loading="loading" />
    </UForm>
  </div>
</template>
