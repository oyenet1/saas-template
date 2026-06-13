<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: ['platform-staff'] })

const route = useRoute()
const api = usePlatformApi()
const toast = useToast()

const invoice = ref<any>(null)
const loading = ref(true)
const id = computed(() => String((route.params as any).id))

async function load() {
  loading.value = true
  try {
    invoice.value = await api.getInvoice(id.value)
  } catch (e: any) {
    toast.add({ title: 'Failed to load invoice', description: e?.data?.message || e?.message, color: 'error' })
  } finally {
    loading.value = false
  }
}
onMounted(load)

const statusColor = (s: string) =>
  s === 'paid' ? 'success' : s === 'unpaid' ? 'warning' : 'neutral'
</script>

<template>
  <div class="p-6 lg:p-10 max-w-4xl space-y-6">
    <UButton to="/platform/invoices" variant="link" color="primary" size="sm" icon="i-heroicons-arrow-left">
      Back to invoices
    </UButton>

    <div v-if="loading" class="py-16 flex justify-center">
      <UIcon name="i-heroicons-arrow-path" class="size-8 animate-spin text-primary" />
    </div>

    <div v-else-if="invoice" class="space-y-6">
      <header class="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p class="text-xs font-semibold tracking-[0.2em] uppercase text-primary">Invoice</p>
          <h1 class="text-2xl font-bold tracking-tight font-mono">{{ invoice.reference }}</h1>
          <p class="text-sm text-muted mt-1">{{ invoice.description }}</p>
        </div>
        <UBadge :color="statusColor(invoice.status)" variant="soft" size="lg">{{ invoice.status }}</UBadge>
      </header>

      <div class="grid sm:grid-cols-2 gap-4">
        <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-2 text-sm">
          <p class="text-xs font-semibold uppercase text-muted">Amount</p>
          <p class="text-3xl font-bold">{{ invoice.currency === 'USD' ? '$' : '₦' }}{{ Number(invoice.amount).toLocaleString() }}</p>
          <p v-if="invoice.discount_amount" class="text-xs text-muted">After {{ invoice.discount_percent }}% discount: -{{ invoice.currency === 'USD' ? '$' : '₦' }}{{ Number(invoice.discount_amount).toLocaleString() }}</p>
        </div>
        <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 grid grid-cols-2 gap-y-2 text-sm">
          <span class="text-muted">Hotel</span><span>{{ invoice.hotelName || '—' }}</span>
          <span class="text-muted">Gateway</span><span>{{ invoice.gateway || '—' }}</span>
          <span class="text-muted">Currency</span><span>{{ invoice.currency }}</span>
          <span class="text-muted">Subscription</span><span>{{ invoice.subscription || '—' }}</span>
          <span class="text-muted">Period</span><span>{{ invoice.from || '—' }} → {{ invoice.to || '—' }}</span>
          <span class="text-muted">Date paid</span><span>{{ invoice.date_paid || '—' }}</span>
          <span class="text-muted">Created</span><span>{{ invoice.created_at ? new Date(invoice.created_at).toLocaleString() : '—' }}</span>
          <span class="text-muted">Reference</span><span class="font-mono text-xs">{{ invoice.gateway_reference || '—' }}</span>
        </div>
      </div>

      <div v-if="invoice.metadata" class="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
        <p class="text-xs font-semibold uppercase text-muted mb-2">Metadata</p>
        <pre class="text-xs font-mono whitespace-pre-wrap break-words">{{ JSON.stringify(invoice.metadata, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>
