<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: ['platform-staff'] })

const router = useRouter()
const api = usePlatformApi()
const toast = useToast()
const auth = useAuthStore()
const submitting = ref(false)

async function onSubmit(payload: any) {
  if (payload?.__error) {
    toast.add({ title: 'Please fix the errors', description: payload.__error, color: 'error' })
    return
  }
  if (!auth.isSuperAdmin) {
    toast.add({ title: 'Only super-admins can create plans', color: 'error' })
    return
  }
  submitting.value = true
  try {
    await api.createPlan(payload)
    toast.add({ title: 'Plan created', color: 'success' })
    router.push('/platform/plans')
  } catch (e: any) {
    toast.add({
      title: 'Failed to create plan',
      description: e?.data?.message || e?.message,
      color: 'error',
    })
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="p-6 lg:p-10 max-w-3xl space-y-6">
    <div class="flex items-center gap-2 text-sm text-muted">
      <UButton to="/platform/plans" variant="link" color="primary" size="sm" icon="i-heroicons-arrow-left">
        Back to plans
      </UButton>
    </div>
    <header class="space-y-1">
      <p class="text-xs font-semibold tracking-[0.2em] uppercase text-primary">Platform · Commercial</p>
      <h1 class="text-2xl font-bold tracking-tight">New plan</h1>
      <p class="text-sm text-muted">Define a new subscription package.</p>
    </header>
    <PlanForm :submitting="submitting" @submit="onSubmit" />
  </div>
</template>
