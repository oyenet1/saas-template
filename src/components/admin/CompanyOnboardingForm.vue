<script setup lang="ts">
import { adminRequest, mapFieldErrors } from '../../lib/admin-api'
import { useTenant } from '../../composables/useTenant'

const form = reactive({ name: '', slug: '' })
const loading = ref(false)
const fieldErrors = reactive<Record<string, string>>({})
const toast = useToast()
const { createCompany } = useTenant()

function applyErrors(errors: unknown) {
  Object.keys(fieldErrors).forEach((k) => delete fieldErrors[k])
  Object.assign(fieldErrors, mapFieldErrors(errors))
}

async function onSubmit() {
  loading.value = true
  applyErrors(undefined)
  const result = await createCompany({
    name: form.name.trim(),
    slug: form.slug.trim() || undefined,
  })
  loading.value = false
  if (!result.ok) {
    applyErrors(result.errors)
    toast.add({ title: 'Could not create company', description: result.message, color: 'error' })
    return
  }
  toast.add({ title: 'Company created', description: 'Your workspace is ready.', color: 'success', icon: 'i-lucide-check-circle-2' })
  window.location.assign('/admin')
}
</script>

<template>
  <div class="max-w-lg mx-auto surface-card p-8">
    <h1 class="text-2xl font-bold mb-2">Create your company</h1>
    <p class="text-sm text-muted mb-6">
      Set up your real estate business on Top Villa to manage listings, leads, and website content.
    </p>
    <UForm :state="form" class="space-y-4" @submit="onSubmit">
      <UFormField label="Company name" name="name" :error="fieldErrors.name" required>
        <UInput v-model="form.name" placeholder="Acme Realty" class="w-full" />
      </UFormField>
      <UFormField label="URL slug" name="slug" :error="fieldErrors.slug" hint="Optional — used for your subdomain">
        <UInput v-model="form.slug" placeholder="acme-realty" class="w-full" />
      </UFormField>
      <UButton type="submit" color="primary" label="Create company" icon="i-lucide-building-2" :loading="loading" block />
    </UForm>
  </div>
</template>
