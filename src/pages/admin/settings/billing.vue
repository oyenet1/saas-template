<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const store = useSettingsStore()
const { fetchSettings } = useSettings()

// ── Modal State ────────────────────────────────────────
const showChangePlan = ref(false)
const showPaymentMethod = ref(false)

// ── Plan Options ───────────────────────────────────────

const plans = [
  {
    id: 'plan_starter',
    name: 'Starter',
    price: 19000,
    interval: 'monthly' as const,
    description: 'For small hotels getting started.',
    features: ['Up to 10 rooms', 'Basic reporting', 'Email support'],
    popular: false,
  },
  {
    id: 'plan_pro',
    name: 'Professional',
    price: 49000,
    interval: 'monthly' as const,
    description: 'For growing hotels with more needs.',
    features: ['Up to 50 rooms', 'Advanced analytics', 'Channel manager', 'Priority support'],
    popular: true,
  },
  {
    id: 'plan_enterprise',
    name: 'Enterprise',
    price: 149000,
    interval: 'monthly' as const,
    description: 'For large properties and chains.',
    features: ['Unlimited rooms', 'All features', 'Dedicated support', 'Custom integrations', 'SLA guarantee'],
    popular: false,
  },
]

// ── Status display ─────────────────────────────────────

const statusColor: Record<string, string> = {
  paid: 'success',
  pending: 'warning',
  failed: 'error',
}

const statusLabel: Record<string, string> = {
  paid: 'Paid',
  pending: 'Pending',
  failed: 'Failed',
}

const invoiceColumns = [
  { accessorKey: 'date', header: 'Date' },
  { accessorKey: 'description', header: 'Description' },
  { accessorKey: 'amount', header: 'Amount' },
  { accessorKey: 'status', header: 'Status' },
]

// ── Actions ────────────────────────────────────────────

async function handlePlanSelect(planId: string) {
  await store.updatePlan(planId)
  showChangePlan.value = false
}

// ── Lifecycle ──────────────────────────────────────────

onMounted(async () => {
  if (!store.billing) {
    await fetchSettings()
  }
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Billing</h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Manage your subscription plan and payment methods.
      </p>
    </div>

    <!-- Loading -->
    <div v-if="store.loading" class="flex justify-center py-20">
      <UIcon name="i-heroicons-arrow-path" class="size-8 animate-spin text-gray-400" />
    </div>

    <template v-else-if="store.billing">
      <div class="space-y-6">
        <!-- Current Plan -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-credit-card" class="size-5 text-gray-400" />
                <span class="font-medium">Current Plan</span>
              </div>
              <UBadge color="primary" variant="subtle">{{ store.billing.plan.name }}</UBadge>
            </div>
          </template>
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p class="text-3xl font-bold text-gray-900 dark:text-white">
                {{ store.billing.plan.price.toLocaleString() }}
                <span class="text-sm font-normal text-gray-500">/{{ store.billing.plan.interval }}</span>
              </p>
              <p class="mt-1 text-sm text-gray-500">
                Next billing: {{ store.billing.nextBillingDate }}
              </p>
            </div>
            <UButton color="primary" variant="subtle" @click="showChangePlan = true">
              Change Plan
            </UButton>
          </div>

          <!-- Features -->
          <div class="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div
              v-for="feature in store.billing.plan.features"
              :key="feature"
              class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
            >
              <UIcon name="i-heroicons-check" class="size-4 text-primary-500" />
              {{ feature }}
            </div>
          </div>
        </UCard>

        <!-- Payment Method -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-wallet" class="size-5 text-gray-400" />
                <span class="font-medium">Payment Method</span>
              </div>
              <UButton color="neutral" variant="subtle" size="sm" @click="showPaymentMethod = true">
                Update
              </UButton>
            </div>
          </template>
          <div v-if="store.billing.paymentMethod" class="flex items-center gap-4">
            <div class="flex size-12 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
              <UIcon name="i-heroicons-credit-card" class="size-6 text-gray-500" />
            </div>
            <div>
              <p class="font-medium text-gray-900 dark:text-white">
                {{ store.billing.paymentMethod.brand }} ending in {{ store.billing.paymentMethod.last4 }}
              </p>
              <p class="text-sm text-gray-500">
                Expires {{ String(store.billing.paymentMethod.expMonth).padStart(2, '0') }}/{{ store.billing.paymentMethod.expYear }}
              </p>
            </div>
          </div>
          <div v-else class="text-sm text-gray-500">
            No payment method on file.
          </div>
        </UCard>

        <!-- Invoice History -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-document-text" class="size-5 text-gray-400" />
              <span class="font-medium">Invoice History</span>
            </div>
          </template>
          <UTable
            :data="store.billing.invoices"
            :columns="invoiceColumns"
            :ui="{ td: 'py-3' }"
          >
            <template #amount-cell="{ row }">
              <span class="font-mono text-sm">₦{{ (row as any).amount.toLocaleString() }}</span>
            </template>
            <template #status-cell="{ row }">
              <UBadge :color="(statusColor as any)[(row as any).status]" variant="subtle" size="xs">
                {{ (statusLabel as any)[(row as any).status] }}
              </UBadge>
            </template>
          </UTable>
        </UCard>
      </div>
    </template>

    <!-- Empty state -->
    <div v-else class="flex flex-col items-center justify-center py-20">
      <UIcon name="i-heroicons-exclamation-triangle" class="size-12 text-gray-300" />
      <p class="mt-4 text-sm text-gray-500">Unable to load billing info.</p>
      <UButton color="primary" variant="subtle" size="sm" class="mt-4" @click="fetchSettings()">
        Retry
      </UButton>
    </div>

    <!-- Change Plan Modal -->
    <UModal v-model="showChangePlan">
      <div class="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700 sm:p-6">
        <span class="text-lg font-medium">Choose a Plan</span>
        <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark" @click="showChangePlan = false" />
      </div>
      <div class="grid gap-4 p-4 sm:p-6">
        <div
          v-for="plan in plans"
          :key="plan.id"
          class="cursor-pointer rounded-lg border p-4 transition-all hover:ring-2 hover:ring-primary-500"
          :class="store.billing?.plan.id === plan.id ? 'ring-2 ring-primary-500' : 'border-gray-200 dark:border-gray-700'"
          @click="handlePlanSelect(plan.id)"
        >
          <div class="flex items-center justify-between">
            <div>
              <div class="flex items-center gap-2">
                <span class="font-semibold">{{ plan.name }}</span>
                <UBadge v-if="plan.popular" color="primary" variant="solid" size="xs">Popular</UBadge>
              </div>
              <p class="text-sm text-gray-500">{{ plan.description }}</p>
            </div>
            <p class="text-lg font-bold">
              ₦{{ plan.price.toLocaleString() }}
              <span class="text-xs font-normal text-gray-500">/{{ plan.interval }}</span>
            </p>
          </div>
          <ul class="mt-3 space-y-1">
            <li v-for="feature in plan.features" :key="feature" class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <UIcon name="i-heroicons-check-circle" class="size-4 text-primary-500" />
              {{ feature }}
            </li>
          </ul>
        </div>
      </div>
    </UModal>

    <!-- Update Payment Method Modal -->
    <UModal v-model="showPaymentMethod">
      <div class="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700 sm:p-6">
        <span class="text-lg font-medium">Update Payment Method</span>
        <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark" @click="showPaymentMethod = false" />
      </div>
      <div class="space-y-4 p-4 sm:p-6">
        <UFormGroup label="Card Number">
          <UInput placeholder="4242 4242 4242 4242" />
        </UFormGroup>
        <div class="grid grid-cols-2 gap-4">
          <UFormGroup label="Expiry">
            <UInput placeholder="MM/YY" />
          </UFormGroup>
          <UFormGroup label="CVC">
            <UInput placeholder="123" />
          </UFormGroup>
        </div>
        <UFormGroup label="Cardholder Name">
          <UInput placeholder="John Doe" />
        </UFormGroup>
      </div>
      <div class="flex justify-end gap-3 border-t border-gray-200 p-4 dark:border-gray-700 sm:p-6">
        <UButton color="neutral" variant="subtle" @click="showPaymentMethod = false">Cancel</UButton>
        <UButton color="primary" @click="showPaymentMethod = false">Save</UButton>
      </div>
    </UModal>
  </div>
</template>
