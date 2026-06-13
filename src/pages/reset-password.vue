<script setup lang="ts">
import { z } from 'zod'

definePageMeta({ layout: 'auth' })

const { call } = useApi()
const route = useRoute()
const toast = useToast()

const RESET_OTP_STORAGE_PREFIX = 'ls.otp.reset.'

const schema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type Schema = z.infer<typeof schema>

type OtpStorageState = {
  email: string
  cooldownUntil: number
  verified: boolean
  verifiedAt?: number
  otp?: string
}

const state = reactive<Schema>({
  password: '',
  confirmPassword: '',
})

const fieldErrors = ref<Record<string, string | undefined>>({})
const submitting = ref(false)
const success = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const identifier = computed(() =>
  typeof route.query.identifier === 'string' ? route.query.identifier.trim().toLowerCase() : '',
)
const resetToken = computed(() =>
  typeof route.query.token === 'string' ? route.query.token.trim() : '',
)

const hasVerifiedOtp = computed(() => {
  if (resetToken.value) return true
  if (!import.meta.client || !identifier.value) return false

  const raw = sessionStorage.getItem(`${RESET_OTP_STORAGE_PREFIX}${identifier.value}`)
  if (!raw) return false

  try {
    const parsed = JSON.parse(raw) as OtpStorageState
    return parsed.verified === true
  } catch {
    return false
  }
})

const verifiedOtp = computed(() => {
  if (resetToken.value) return ''
  if (!import.meta.client || !identifier.value) return ''

  const raw = sessionStorage.getItem(`${RESET_OTP_STORAGE_PREFIX}${identifier.value}`)
  if (!raw) return ''

  try {
    const parsed = JSON.parse(raw) as OtpStorageState
    return parsed.otp?.replace(/\D/g, '').slice(0, 6) ?? ''
  } catch {
    return ''
  }
})

async function onSubmit() {
  fieldErrors.value = {}

  if (!hasVerifiedOtp.value) {
    fieldErrors.value = { password: 'Verify your reset code first to continue.' }
    return
  }

  submitting.value = true

  try {
    const result = resetToken.value
      ? await call(
          '/v1/auth/reset-password-token',
          {
            method: 'POST',
            body: {
              token: resetToken.value,
              password: state.password,
              confirmPassword: state.confirmPassword,
            },
          },
          { success: false },
        )
      : await call(
          '/v1/auth/reset-password',
          {
            method: 'PATCH',
            body: {
              email: identifier.value,
              otp: verifiedOtp.value,
              password: state.password,
              confirmPassword: state.confirmPassword,
            },
          },
          { success: false },
        )

    success.value = true

    if (import.meta.client && identifier.value) {
      sessionStorage.removeItem(`${RESET_OTP_STORAGE_PREFIX}${identifier.value}`)
    }

    const resetTitle = 'Password updated'
    const resetDesc = result.message
    toast.add({
      title: resetTitle,
      description: resetDesc && resetDesc !== resetTitle ? resetDesc : undefined,
      icon: 'i-heroicons-check-circle',
      color: 'success',
    })
  } catch (e: any) {
    if (e?.fieldErrors && Object.keys(e.fieldErrors).length > 0) fieldErrors.value = e.fieldErrors
  } finally {
    submitting.value = false
  }
}

function errorFor(field: keyof Schema): string | undefined {
  return fieldErrors.value[field]
}
</script>

<template>
  <div>
    <div v-if="!success" class="mb-8">
      <h1 class="text-3xl font-bold tracking-tight">Set a new password</h1>
      <p class="mt-1.5 text-sm text-muted">Choose a new password to finish your reset.</p>
      <p v-if="resetToken" class="mt-2 text-xs text-muted">
        Reset link confirmed. Set the password you want to use next.
      </p>
      <p v-if="identifier" class="mt-2 text-xs text-muted">
        Reset destination: {{ identifier }}
      </p>
    </div>

    <div v-if="success" class="space-y-5 text-center">
      <div class="mx-auto grid size-14 place-items-center rounded-full bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-400">
        <UIcon name="i-heroicons-check" class="size-7" />
      </div>
      <p class="text-lg font-semibold">Password updated</p>
      <p class="text-sm text-muted">Your password was reset successfully.</p>
      <ULink to="/sign-in" class="font-medium text-primary hover:underline">
        Sign in →
      </ULink>
    </div>

    <div v-else-if="!hasVerifiedOtp" class="space-y-5">
      <UAlert
        color="warning"
        variant="soft"
        icon="i-heroicons-shield-exclamation"
        title="Reset code required"
        description="Verify your OTP before setting a new password."
      />

      <ULink
        :to="{ path: '/otp', query: identifier ? { identifier, channel: 'email', purpose: 'reset' } : undefined }"
        class="font-medium text-primary hover:underline"
      >
        Go to OTP page →
      </ULink>
    </div>

    <UForm
      v-else
      :schema="schema"
      :state="state"
      class="space-y-5"
      @submit="onSubmit"
    >
      <UAlert
        color="primary"
        variant="soft"
        icon="i-heroicons-shield-check"
        title="Code confirmed"
        description="Now choose the password you want to use going forward."
      />

      <UFormField
        label="New password"
        name="password"
        :error="errorFor('password')"
        :ui="{ root: 'w-full', label: 'text-sm font-medium', container: 'w-full mt-1' }"
      >
        <UInput
          v-model="state.password"
          :type="showPassword ? 'text' : 'password'"
          placeholder="At least 6 characters"
          autocomplete="new-password"
          size="lg"
          :ui="{ base: 'w-full', root: 'w-full' }"
        >
          <template #trailing>
            <UButton
              type="button"
              color="neutral"
              variant="ghost"
              size="sm"
              :icon="showPassword ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
              :aria-pressed="showPassword"
              @click="showPassword = !showPassword"
            />
          </template>
        </UInput>
      </UFormField>

      <UFormField
        label="Confirm password"
        name="confirmPassword"
        :error="errorFor('confirmPassword')"
        :ui="{ root: 'w-full', label: 'text-sm font-medium', container: 'w-full mt-1' }"
      >
        <UInput
          v-model="state.confirmPassword"
          :type="showConfirmPassword ? 'text' : 'password'"
          placeholder="Repeat password"
          autocomplete="new-password"
          size="lg"
          :ui="{ base: 'w-full', root: 'w-full' }"
        >
          <template #trailing>
            <UButton
              type="button"
              color="neutral"
              variant="ghost"
              size="sm"
              :icon="showConfirmPassword ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
              :aria-label="showConfirmPassword ? 'Hide password' : 'Show password'"
              :aria-pressed="showConfirmPassword"
              @click="showConfirmPassword = !showConfirmPassword"
            />
          </template>
        </UInput>
      </UFormField>

      <UButton
        type="submit"
        color="primary"
        size="xl"
        block
        :loading="submitting"
        :disabled="submitting"
        class="font-semibold"
      >
        Reset password
      </UButton>
    </UForm>
  </div>
</template>
