<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: ['platform-staff'] })

const router = useRouter()
const api = usePlatformApi()
const toast = useToast()
const auth = useAuthStore()
const route = useRoute()
const id = computed(() => String((route.params as any).id))

const plan = ref<any>(null)
const loading = ref(true)
const submitting = ref(false)

onMounted(async () => {
  try {
    plan.value = await api.getPlan(id.value)
  } catch (e: any) {
    toast.add({ title: 'Failed to load plan', description: e?.data?.message || e?.message, color: 'error' })
  } finally {
    loading.value = false
  }
})

async function onSubmit(payload: any) {
  if (payload?.__error) {
    toast.add({ title: 'Please fix the errors', description: payload.__error, color: 'error' })
    return
  }
  if (!auth.isSuperAdmin) {
    toast.add({ title: 'Only super-admins can edit plans', color: 'error' })
    return
  }
  submitting.value = true
  try {
    await api.updatePlan(id.value, payload)
    toast.add({ title: 'Plan updated', color: 'success' })
    router.push(`/platform/plans/${id.value}`)
  } catch (e: any) {
    toast.add({ title: 'Failed to update plan', description: e?.data?.message || e?.message, color: 'error' })
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="p-6 lg:p-10 max-w-3xl space-y-6">
    <div class="flex items-center gap-2 text-sm text-muted">
      <UButton :to="`/platform/plans/${id}`" variant="link" color="primary" size="sm" icon="i-heroicons-arrow-left">
        Back to plan
      </UButton>
    </div>
    <header class="space-y-1">
      <p class="text-xs font-semibold tracking-[0.2em] uppercase text-primary">Platform · Commercial</p>
      <h1 class="text-2xl font-bold tracking-tight">Edit plan</h1>
      <p class="text-sm text-muted">Update the plan details.</p>
    </header>

    <div v-if="loading" class="py-16 flex justify-center">
      <UIcon name="i-heroicons-arrow-path" class="size-8 animate-spin text-primary" />
    </div>

    <PlanForm
      v-else-if="plan"
      :initial="plan"
      :submitting="submitting"
      is-edit
      @submit="onSubmit"
    />
  </div>
</template>
