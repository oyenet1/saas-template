<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

definePageMeta({ layout: 'dashboard', middleware: ['platform-staff'] })

const api = usePlatformApi()
const toast = useToast()
const auth = useAuthStore()
const router = useRouter()

const plan = ref<any>(null)
const loading = ref(true)
const submitting = ref(false)
const route = useRoute()
const id = computed(() => String((route.params as any).id))

async function load() {
  loading.value = true
  try {
    plan.value = await api.getPlan(id.value)
  } catch (e: any) {
    toast.add({ title: 'Failed to load plan', description: e?.data?.message || e?.message, color: 'error' })
  } finally {
    loading.value = false
  }
}
onMounted(load)

async function remove() {
  if (!auth.isSuperAdmin) return
  if (!confirm(`Delete plan "${plan.value?.name}"? This cannot be undone.`)) return
  submitting.value = true
  try {
    await api.deletePlan(id.value)
    toast.add({ title: 'Plan deleted', color: 'success' })
    router.push('/platform/plans')
  } catch (e: any) {
    toast.add({ title: 'Failed to delete plan', description: e?.data?.message || e?.message, color: 'error' })
  } finally {
    submitting.value = false
  }
}

const featuresDisplay = computed(() => {
  const f = plan.value?.features
  if (!f) return '—'
  if (typeof f === 'string') return f
  return JSON.stringify(f, null, 2)
})

const NGN: { key: string; label: string }[] = [
  { key: 'price_ngn_monthly', label: 'Monthly' },
  { key: 'price_ngn_half_yearly', label: '6 months' },
  { key: 'price_ngn_yearly', label: 'Yearly' },
  { key: 'price_ngn_2years', label: '2 years' },
  { key: 'price_ngn_4years', label: '4 years' },
]
const USD = NGN.map((r) => ({ ...r, key: r.key.replace('ngn', 'usd') }))
</script>

<template>
  <div class="p-6 lg:p-10 max-w-4xl space-y-6">
    <div class="flex items-center gap-2 text-sm text-muted">
      <UButton to="/platform/plans" variant="link" color="primary" size="sm" icon="i-heroicons-arrow-left">
        Back to plans
      </UButton>
    </div>

    <div v-if="loading" class="py-16 flex justify-center">
      <UIcon name="i-heroicons-arrow-path" class="size-8 animate-spin text-primary" />
    </div>

    <div v-else-if="plan" class="space-y-6">
      <header class="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p class="text-xs font-semibold tracking-[0.2em] uppercase text-primary">Plan</p>
          <h1 class="text-3xl font-bold tracking-tight">{{ plan.name }}</h1>
          <p class="text-sm text-muted mt-1">Display order #{{ plan.sort_order }} · {{ plan.subscribers }} hotels subscribed</p>
        </div>
        <div class="flex items-center gap-2">
          <UBadge :color="plan.is_active ? 'success' : 'neutral'" variant="soft">
            {{ plan.is_active ? 'Active' : 'Inactive' }}
          </UBadge>
          <UButton
            v-if="auth.isSuperAdmin"
            :to="`/platform/plans/${plan.id}/edit`"
            color="primary"
            icon="i-heroicons-pencil"
            variant="soft"
          >
            Edit
          </UButton>
          <UButton
            v-if="auth.isSuperAdmin"
            color="error"
            icon="i-heroicons-trash"
            variant="soft"
            :loading="submitting"
            @click="remove"
          >
            Delete
          </UButton>
        </div>
      </header>

      <div class="grid sm:grid-cols-2 gap-4">
        <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
          <p class="text-xs font-semibold uppercase text-muted mb-3">NGN pricing</p>
          <div class="space-y-2 text-sm">
            <div v-for="r in NGN" :key="r.key" class="flex items-center justify-between">
              <span class="text-muted">{{ r.label }}</span>
              <span class="font-semibold">{{ plan[r.key] ? `₦${Number(plan[r.key]).toLocaleString()}` : '—' }}</span>
            </div>
          </div>
        </div>
        <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
          <p class="text-xs font-semibold uppercase text-muted mb-3">USD pricing</p>
          <div class="space-y-2 text-sm">
            <div v-for="r in USD" :key="r.key" class="flex items-center justify-between">
              <span class="text-muted">{{ r.label }}</span>
              <span class="font-semibold">{{ plan[r.key] ? `$${Number(plan[r.key]).toLocaleString()}` : '—' }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
        <p class="text-xs font-semibold uppercase text-muted mb-2">Features</p>
        <pre class="text-xs font-mono whitespace-pre-wrap break-words">{{ featuresDisplay }}</pre>
      </div>
    </div>
  </div>
</template>
