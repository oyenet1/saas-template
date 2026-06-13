<script setup lang="ts">
import { z } from 'zod'

/**
 * Dedicated forgot-password OTP page.
 *
 * Flow (separate from /otp which is for registration):
 *   1. User arrives here from /forgot-password with ?identifier=<email>
 *   2. Enters the 6-digit code we sent
 *   3. Resend button has a 1-minute cooldown (button disabled with countdown)
 *   4. After verification, the password fields appear
 *   5. User picks a new password and submits
 *   6. Redirects to /sign-in
 *
 * Storage prefix is intentionally distinct from registration OTP
 * (`mrs.otp.*` and `ls.otp.reset.*`) so the two flows can never collide.
 */
definePageMeta({ layout: 'auth' })

const { call } = useApi()
const route = useRoute()
const toast = useToast()
const router = useRouter()

const OTP_LENGTH = 6
const RESEND_COOLDOWN_SECONDS = 60

const STORAGE_PREFIX = 'ls.otp.reset.'

// Lenient schema — we only care that the OTP array is the right
// length. Per-element type checks would block submission if
// UPinInput ever emits numbers or empty strings while typing.
const otpSchema = z.object({
  otp: z.array(z.unknown()).length(OTP_LENGTH),
})

const passwordSchema = z
  .object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

const otpState = reactive({ otp: Array.from({ length: OTP_LENGTH }, () => '') })
const passwordState = reactive({ password: '', confirmPassword: '' })

const otpFieldErrors = ref<Record<string, string | undefined>>({})
const passwordFieldErrors = ref<Record<string, string | undefined>>({})

const verifying = ref(false)
const resetting = ref(false)
const resending = ref(false)
const otpVerified = ref(false)
const success = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const identifier = computed(() =>
  typeof route.query.identifier === 'string' ? route.query.identifier.trim().toLowerCase() : '',
)

const otpValue = computed(() =>
  otpState.otp.join('').replace(/\D/g, '').slice(0, OTP_LENGTH),
)

/** Resend cooldown: countdown in whole seconds, 0 = ready to resend. */
const cooldownRemaining = ref(0)
let cooldownTimer: ReturnType<typeof setInterval> | null = null

/** Human-friendly countdown: `0:42`. */
const cooldownLabel = computed(() => {
  const s = Math.max(0, cooldownRemaining.value)
  const mm = Math.floor(s / 60)
  const ss = s % 60
  return `${mm}:${ss.toString().padStart(2, '0')}`
})

const isCoolingDown = computed(() => cooldownRemaining.value > 0)

function clearCooldownTimer() {
  if (cooldownTimer) {
    clearInterval(cooldownTimer)
    cooldownTimer = null
  }
}

function startCooldown(seconds: number) {
  clearCooldownTimer()
  const endAt = Date.now() + seconds * 1000
  cooldownRemaining.value = seconds

  cooldownTimer = setInterval(() => {
    const remaining = Math.max(0, Math.ceil((endAt - Date.now()) / 1000))
    cooldownRemaining.value = remaining
    if (remaining <= 0) clearCooldownTimer()
  }, 250)
}

function storageKey(email: string) {
  return `${STORAGE_PREFIX}${email.toLowerCase()}`
}

interface ResetOtpState {
  email: string
  cooldownUntil: number
  verified: boolean
  verifiedAt?: number
  otp?: string
}

function persistState(email: string, updates: Partial<ResetOtpState>) {
  if (!import.meta.client || !email) return
  const current: ResetOtpState = readState(email) ?? {
    email: email.toLowerCase(),
    cooldownUntil: 0,
    verified: false,
  }
  sessionStorage.setItem(storageKey(email), JSON.stringify({ ...current, ...updates }))
}

function readState(email: string): ResetOtpState | null {
  if (!import.meta.client || !email) return null
  const raw = sessionStorage.getItem(storageKey(email))
  if (!raw) return null
  try {
    return JSON.parse(raw) as ResetOtpState
  } catch {
    sessionStorage.removeItem(storageKey(email))
    return null
  }
}

function restoreFromStorage(email: string) {
  if (!import.meta.client || !email) return
  const stored = readState(email)
  if (!stored) {
    cooldownRemaining.value = 0
    otpVerified.value = false
    return
  }
  const remaining = Math.max(0, Math.ceil(((stored.cooldownUntil ?? 0) - Date.now()) / 1000))
  cooldownRemaining.value = remaining
  if (remaining > 0) startCooldown(remaining)
  otpVerified.value = stored.verified === true
}

onMounted(() => {
  if (!identifier.value) {
    toast.add({
      title: 'Start from the forgot password page',
      description: 'Enter the email you want to reset, and we will send a code.',
      color: 'warning',
    })
    router.replace('/forgot-password')
    return
  }
  restoreFromStorage(identifier.value)
})

onBeforeUnmount(() => clearCooldownTimer())

function clearOtpError(field: 'otp') {
  if (otpFieldErrors.value[field]) {
    otpFieldErrors.value = { ...otpFieldErrors.value, [field]: undefined }
  }
}

function clearPasswordError(field: 'password' | 'confirmPassword') {
  if (passwordFieldErrors.value[field]) {
    passwordFieldErrors.value = { ...passwordFieldErrors.value, [field]: undefined }
  }
}

async function verifyOtp() {
  otpFieldErrors.value = {}

  if (!identifier.value) {
    otpFieldErrors.value = { otp: 'Start from the forgot password page so we know which email to verify.' }
    return
  }
  if (otpValue.value.length !== OTP_LENGTH) {
    otpFieldErrors.value = { otp: `Please enter the complete ${OTP_LENGTH}-digit code.` }
    return
  }

  verifying.value = true
  ;(toast as any).clear?.()

  try {
    const res = await call(
      '/v1/auth/verify-reset-otp',
      {
        method: 'POST',
        body: {
          email: identifier.value,
          otp: otpValue.value,
        },
      },
      { silentSuccess: true, silentError: true },
    )

    // ✅ Verified — persist the verified state and reveal the password fields
    persistState(identifier.value, {
      verified: true,
      verifiedAt: Date.now(),
      otp: otpValue.value,
    })
    otpVerified.value = true

    const serverMessage = String((res as any)?.message ?? '').trim()
    toast.add({
      title: 'Code verified',
      description:
        serverMessage && serverMessage !== 'Code verified'
          ? serverMessage
          : 'Now choose the password you want to use going forward.',
      icon: 'i-heroicons-check-circle',
      color: 'success',
    })
  } catch (e: any) {
    const message = String(e?.data?.message || e?.message || 'That code isn\u2019t right. Please try again.')
    otpFieldErrors.value = { otp: message }
    toast.add({
      title: 'Code not verified',
      description: message,
      icon: 'i-heroicons-exclamation-triangle',
      color: 'error',
    })
  } finally {
    verifying.value = false
  }
}

async function submitNewPassword() {
  passwordFieldErrors.value = {}

  const parsed = passwordSchema.safeParse({
    password: passwordState.password,
    confirmPassword: passwordState.confirmPassword,
  })
  if (!parsed.success) {
    const issues: Record<string, string> = {}
    for (const i of parsed.error.issues) {
      const key = (i.path[0] as string) || 'password'
      if (!issues[key]) issues[key] = i.message
    }
    passwordFieldErrors.value = issues
    return
  }

  resetting.value = true
  ;(toast as any).clear?.()

  try {
    const res = await call(
      '/v1/auth/reset-password',
      {
        method: 'PATCH',
        body: {
          email: identifier.value,
          password: passwordState.password,
          confirmPassword: passwordState.confirmPassword,
        },
      },
      // Suppress both auto toasts — we fire our own success toast on
      // resolve and our own error toast in the catch block below.
      { success: false, silentError: true },
    )

    success.value = true

    if (import.meta.client && identifier.value) {
      sessionStorage.removeItem(storageKey(identifier.value))
    }

    const title = 'Password updated'
    const desc = (res as any)?.message
    toast.add({
      title,
      description: desc && desc !== title ? desc : undefined,
      icon: 'i-heroicons-check-circle',
      color: 'success',
    })
  } catch (e: any) {
    const message = String(e?.data?.message || e?.message || 'We couldn\u2019t reset your password. Please try again.')
    passwordFieldErrors.value = { password: message }
    toast.add({
      title: 'Couldn\u2019t reset password',
      description: message,
      icon: 'i-heroicons-exclamation-triangle',
      color: 'error',
    })
  } finally {
    resetting.value = false
  }
}

async function resendCode() {
  if (isCoolingDown.value || !identifier.value) return

  resending.value = true
  ;(toast as any).clear?.()

  try {
    const res = await call(
      '/v1/auth/send-otp',
      {
        method: 'POST',
        body: { email: identifier.value },
      },
      { silentSuccess: true, silentError: true },
    )

    // ✅ Reset cooldown and OTP input
    persistState(identifier.value, {
      cooldownUntil: Date.now() + RESEND_COOLDOWN_SECONDS * 1000,
      verified: false,
      verifiedAt: undefined,
      otp: undefined,
    })
    otpState.otp = Array.from({ length: OTP_LENGTH }, () => '')
    startCooldown(RESEND_COOLDOWN_SECONDS)

    const title = 'New code sent'
    const desc = (res as any)?.message
    toast.add({
      title,
      description: desc && desc !== title ? desc : undefined,
      icon: 'i-heroicons-paper-airplane',
      color: 'success',
    })
  } catch (e: any) {
    const message = String(e?.data?.message || e?.message || 'Could not resend code.')
    startCooldown(RESEND_COOLDOWN_SECONDS)
    persistState(identifier.value, {
      cooldownUntil: Date.now() + RESEND_COOLDOWN_SECONDS * 1000,
    })
    toast.add({
      title: 'Couldn\u2019t resend code',
      description: message,
      icon: 'i-heroicons-exclamation-triangle',
      color: 'error',
    })
  } finally {
    resending.value = false
  }
}

function errorForOtp(field: 'otp') {
  return otpFieldErrors.value[field]
}

function errorForPassword(field: 'password' | 'confirmPassword') {
  return passwordFieldErrors.value[field]
}

watch(otpValue, () => clearOtpError('otp'))
watch(() => passwordState.password, () => clearPasswordError('password'))
watch(() => passwordState.confirmPassword, () => clearPasswordError('confirmPassword'))

// Auto-submit the verify request as soon as the user finishes
// entering the 6th digit. Most modern OTP UIs do this; it removes
// a class of bugs where the user types the code, hits Verify, and
// nothing happens (form submit, button click, focus loss, etc).
let autoSubmitting = false
watch(otpValue, async (value) => {
  if (autoSubmitting) return
  if (value.length !== OTP_LENGTH) return
  if (verifying.value || otpVerified.value || success.value) return
  if (!identifier.value) return
  autoSubmitting = true
  try {
    await verifyOtp()
  } finally {
    // Allow re-trigger if the user edits the OTP after a failure.
    autoSubmitting = false
  }
})
</script>

<template>
  <div>
    <div v-if="!success" class="mb-8">
      <p class="text-xs font-semibold tracking-[0.2em] uppercase text-primary">Reset password</p>
      <h1 class="text-3xl font-bold tracking-tight">Enter the code we sent</h1>
      <p class="mt-1.5 text-sm text-muted">
        We sent a 6-digit verification code to your email. Enter it below to set a new password.
      </p>
      <p v-if="identifier" class="mt-2 text-xs text-muted">
        Destination: <span class="font-semibold text-gray-900 dark:text-white">{{ identifier }}</span>
      </p>
    </div>

    <!-- Success state -->
    <div v-if="success" class="space-y-5 text-center">
      <div class="mx-auto grid size-14 place-items-center rounded-full bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-400">
        <UIcon name="i-heroicons-check" class="size-7" />
      </div>
      <p class="text-lg font-semibold">Password updated</p>
      <p class="text-sm text-muted">Your password was reset successfully. You can sign in with your new password now.</p>
      <ULink to="/sign-in" class="font-medium text-primary hover:underline">
        Go to sign in →
      </ULink>
    </div>

    <!-- OTP entry (step 1) -->
    <UForm
      v-else-if="!otpVerified"
      :schema="otpSchema"
      :state="otpState"
      class="space-y-5"
      @submit="verifyOtp"
    >
      <UFormField
        label="Verification code"
        name="otp"
        :error="errorForOtp('otp')"
        :ui="{ root: 'w-full', label: 'text-sm font-medium', container: 'w-full mt-2' }"
      >
        <UPinInput
          v-model="otpState.otp as unknown as number[]"
          :length="OTP_LENGTH"
          otp
          autofocus
          type="number"
          size="xl"
          class="justify-between"
          :disabled="verifying"
          :ui="{
            root: 'w-full gap-2 sm:gap-3',
            base: 'h-13 w-11 rounded-lg border border-default text-center text-lg font-semibold sm:h-14 sm:w-12'
          }"
        />
      </UFormField>

      <UButton
        type="submit"
        color="primary"
        size="xl"
        block
        :loading="verifying"
        :disabled="verifying || otpValue.length !== OTP_LENGTH"
        class="font-semibold"
      >
        Verify code
      </UButton>

      <div class="text-center text-sm text-muted">
        <span>Didn’t receive it?</span>
        <UButton
          type="button"
          :color="isCoolingDown ? 'neutral' : 'primary'"
          :variant="isCoolingDown ? 'soft' : 'link'"
          class="ml-1 p-0 font-semibold"
          :disabled="isCoolingDown || resending"
          :loading="resending"
          @click="resendCode"
        >
          <span v-if="isCoolingDown" class="inline-flex items-center gap-2">
            <UIcon name="i-heroicons-clock" class="size-4" />
            Resend in {{ cooldownLabel }}
          </span>
          <span v-else>Resend code</span>
        </UButton>
      </div>
    </UForm>

    <!-- New password (step 2) -->
    <UForm
      v-else
      :schema="passwordSchema"
      :state="passwordState"
      class="space-y-5"
      @submit="submitNewPassword"
    >
      <UFormField
        label="New password"
        name="password"
        :error="errorForPassword('password')"
        :ui="{ root: 'w-full', label: 'text-sm font-medium', container: 'w-full mt-1' }"
      >
        <UInput
          v-model="passwordState.password"
          :type="showPassword ? 'text' : 'password'"
          placeholder="At least 6 characters"
          autocomplete="new-password"
          size="lg"
          :disabled="resetting"
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
        label="Confirm new password"
        name="confirmPassword"
        :error="errorForPassword('confirmPassword')"
        :ui="{ root: 'w-full', label: 'text-sm font-medium', container: 'w-full mt-1' }"
      >
        <UInput
          v-model="passwordState.confirmPassword"
          :type="showConfirmPassword ? 'text' : 'password'"
          placeholder="Repeat password"
          autocomplete="new-password"
          size="lg"
          :disabled="resetting"
          :ui="{ base: 'w-full', root: 'w-full' }"
        >
          <template #trailing>
            <UButton
              type="button"
              color="neutral"
              variant="ghost"
              size="sm"
              :icon="showConfirmPassword ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
              :aria-label="showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'"
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
        :loading="resetting"
        :disabled="resetting"
        class="font-semibold"
      >
        Reset password
      </UButton>
    </UForm>

    <p v-if="!success" class="mt-6 text-center text-sm text-muted">
      Wrong email?
      <ULink to="/forgot-password" class="font-semibold text-primary hover:underline">
        Start again
      </ULink>
    </p>
  </div>
</template>
