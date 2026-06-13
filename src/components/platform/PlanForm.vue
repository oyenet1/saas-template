<script setup lang="ts">
import { z } from 'zod'

const props = defineProps<{
  initial?: any
  submitting?: boolean
  isEdit?: boolean
}>()

const emit = defineEmits<{
  (e: 'submit', payload: any): void
}>()

const step = ref(1)
const totalSteps = 3

const form = reactive({
  name: props.initial?.name ?? '',
  amount: Number(props.initial?.amount ?? 0),
  isActive: props.initial?.is_active ?? true,
  sortOrder: Number(props.initial?.sort_order ?? 0),
  featuresInput: props.initial?.features
    ? (typeof props.initial.features === 'string'
        ? props.initial.features
        : JSON.stringify(props.initial.features, null, 2))
    : '',
  price_ngn_monthly: numOrNull(props.initial?.price_ngn_monthly),
  price_ngn_half_yearly: numOrNull(props.initial?.price_ngn_half_yearly),
  price_ngn_yearly: numOrNull(props.initial?.price_ngn_yearly),
  price_ngn_2years: numOrNull(props.initial?.price_ngn_2years),
  price_ngn_4years: numOrNull(props.initial?.price_ngn_4years),
  price_usd_monthly: numOrNull(props.initial?.price_usd_monthly),
  price_usd_half_yearly: numOrNull(props.initial?.price_usd_half_yearly),
  price_usd_yearly: numOrNull(props.initial?.price_usd_yearly),
  price_usd_2years: numOrNull(props.initial?.price_usd_2years),
  price_usd_4years: numOrNull(props.initial?.price_usd_4years),
})

function numOrNull(v: any): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

const schema = z.object({
  name: z.string().min(2, 'At least 2 characters'),
  amount: z.number().int().nonnegative('Required'),
})

const steps = [
  { title: 'Basics', description: 'Name, price, visibility' },
  { title: 'Pricing', description: 'Multi-currency, multi-interval' },
  { title: 'Features', description: 'Plan features & summary' },
]

function next() {
  if (step.value === 1) {
    const parsed = schema.safeParse({ name: form.name, amount: Number(form.amount) })
    if (!parsed.success) {
      emit('submit', { __error: parsed.error.issues[0]?.message })
      return
    }
  }
  if (step.value < totalSteps) step.value += 1
}

function back() {
  if (step.value > 1) step.value -= 1
}

function submit() {
  const features = form.featuresInput?.trim()
    ? (() => {
        try { return JSON.parse(form.featuresInput) } catch { return form.featuresInput }
      })()
    : {}
  emit('submit', {
    name: form.name,
    amount: Number(form.amount),
    isActive: form.isActive,
    sortOrder: Number(form.sortOrder || 0),
    features,
    price_ngn_monthly: form.price_ngn_monthly,
    price_ngn_half_yearly: form.price_ngn_half_yearly,
    price_ngn_yearly: form.price_ngn_yearly,
    price_ngn_2years: form.price_ngn_2years,
    price_ngn_4years: form.price_ngn_4years,
    price_usd_monthly: form.price_usd_monthly,
    price_usd_half_yearly: form.price_usd_half_yearly,
    price_usd_yearly: form.price_usd_yearly,
    price_usd_2years: form.price_usd_2years,
    price_usd_4years: form.price_usd_4years,
  })
}
</script>

<template>
  <div class="space-y-5">
    <ol class="grid grid-cols-3 gap-2">
      <li
        v-for="(s, i) in steps"
        :key="i"
        class="rounded-lg border p-3 transition-colors"
        :class="step === i + 1
          ? 'border-primary bg-primary/5'
          : step > i + 1
            ? 'border-emerald-300 bg-emerald-50/40'
            : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900'"
      >
        <div class="flex items-center gap-2">
          <div
            class="size-7 rounded-full grid place-items-center text-xs font-bold shrink-0"
            :class="step > i + 1 ? 'bg-emerald-500 text-white' : step === i + 1 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'"
          >
            <UIcon v-if="step > i + 1" name="i-heroicons-check" class="size-4" />
            <span v-else>{{ i + 1 }}</span>
          </div>
          <div class="min-w-0">
            <p class="text-sm font-semibold leading-tight truncate">{{ s.title }}</p>
            <p class="text-xs text-muted leading-tight truncate">{{ s.description }}</p>
          </div>
        </div>
      </li>
    </ol>

    <form class="space-y-5" @submit.prevent="submit">
      <div v-if="step === 1" class="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-4">
        <UFormField label="Name" name="name" required>
          <UInput v-model="form.name" placeholder="e.g. Enterprise" size="md" />
        </UFormField>
        <div class="grid sm:grid-cols-2 gap-4">
          <UFormField label="Monthly base price (NGN)" name="amount" required>
            <UInput v-model.number="form.amount" type="number" min="0" size="md" />
          </UFormField>
          <UFormField label="Display order" name="sortOrder" help="Lower numbers appear first">
            <UInput v-model.number="form.sortOrder" type="number" min="0" size="md" />
          </UFormField>
        </div>
        <UFormField label="Status" name="isActive">
          <USwitch v-model="form.isActive" />
        </UFormField>
      </div>

      <div v-if="step === 2" class="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-5">
        <div>
          <p class="text-sm font-semibold mb-3">NGN pricing</p>
          <div class="grid sm:grid-cols-5 gap-3">
            <UFormField label="Monthly" name="price_ngn_monthly"><UInput v-model.number="form.price_ngn_monthly" type="number" min="0" size="sm" /></UFormField>
            <UFormField label="6 months" name="price_ngn_half_yearly"><UInput v-model.number="form.price_ngn_half_yearly" type="number" min="0" size="sm" /></UFormField>
            <UFormField label="Yearly" name="price_ngn_yearly"><UInput v-model.number="form.price_ngn_yearly" type="number" min="0" size="sm" /></UFormField>
            <UFormField label="2 years" name="price_ngn_2years"><UInput v-model.number="form.price_ngn_2years" type="number" min="0" size="sm" /></UFormField>
            <UFormField label="4 years" name="price_ngn_4years"><UInput v-model.number="form.price_ngn_4years" type="number" min="0" size="sm" /></UFormField>
          </div>
        </div>
        <div>
          <p class="text-sm font-semibold mb-3">USD pricing</p>
          <div class="grid sm:grid-cols-5 gap-3">
            <UFormField label="Monthly" name="price_usd_monthly"><UInput v-model.number="form.price_usd_monthly" type="number" min="0" size="sm" /></UFormField>
            <UFormField label="6 months" name="price_usd_half_yearly"><UInput v-model.number="form.price_usd_half_yearly" type="number" min="0" size="sm" /></UFormField>
            <UFormField label="Yearly" name="price_usd_yearly"><UInput v-model.number="form.price_usd_yearly" type="number" min="0" size="sm" /></UFormField>
            <UFormField label="2 years" name="price_usd_2years"><UInput v-model.number="form.price_usd_2years" type="number" min="0" size="sm" /></UFormField>
            <UFormField label="4 years" name="price_usd_4years"><UInput v-model.number="form.price_usd_4years" type="number" min="0" size="sm" /></UFormField>
          </div>
        </div>
      </div>

      <div v-if="step === 3" class="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-3">
        <UFormField label="Features" name="features" help="JSON object describing the plan features, or plain text.">
          <UTextarea
            v-model="form.featuresInput"
            :rows="8"
            :placeholder='`{&quot;bookings&quot;: true, &quot;rooms&quot;: 50, &quot;support&quot;: &quot;priority&quot;}`'
            class="font-mono text-xs"
          />
        </UFormField>
      </div>

      <div class="flex items-center justify-between gap-2">
        <UButton
          v-if="step > 1"
          color="neutral"
          variant="soft"
          icon="i-heroicons-arrow-left"
          @click="back"
        >
          Back
        </UButton>
        <div class="flex items-center gap-2 ml-auto">
          <UButton
            v-if="step < totalSteps"
            color="primary"
            trailing-icon="i-heroicons-arrow-right"
            @click="next"
          >
            Next
          </UButton>
          <UButton
            v-else
            type="submit"
            color="primary"
            :loading="submitting"
            icon="i-heroicons-check"
          >
            {{ isEdit ? 'Save changes' : 'Create plan' }}
          </UButton>
        </div>
      </div>
    </form>
  </div>
</template>
