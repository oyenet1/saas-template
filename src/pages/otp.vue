<script setup lang="ts">
import { z } from 'zod'
import { useAuthStore, type LoginResponse } from '~/stores/auth'

definePageMeta({ layout: 'auth' })

const auth = useAuthStore()
const { call } = useApi()
const route = useRoute()
const toast = useToast()

const OTP_LENGTH = 6

// Resend cooldown: 1 minute
const OTP_COOLDOWN_SECONDS = 60
// After 3 failed resend attempts, hard 15-minute ban
const BAN_AFTER_ATTEMPTS = 3
const BAN_DURATION_SECONDS = 15 * 60

const OTP_STORAGE_PREFIX = 'mrs.otp.'
const ATTEMPT_STORAGE_PREFIX = 'mrs.otp.attempts.'

const schema = z.object({
  otp: z.array(z.string()).length(OTP_LENGTH),
})

type Schema = z.infer<typeof schema>
type OtpStorageState = {
  email: string
  cooldownUntil: number
  bannedUntil?: number
  verified: boolean
  verifiedAt?: number
  otp?: string
}

const state = reactive<Schema>({
  otp: Array.from({ length: OTP_LENGTH }, () => ''),
})

const fieldErrors = ref<Record<string, string | undefined>>({})
const submitting = ref(false)
const resending = ref(false)
const cooldownRemaining = ref(0)
const isBanned = ref(false)

const identifier = computed(() =>
  typeof route.query.identifier === 'string' ? route.query.identifier.trim().toLowerCase() : '',
)
const purpose = computed(() =>
  route.query.purpose === 'registration' ? 'registration' : 'reset',
)
const pageTitle = computed(() =>
  purpose.value === 'registration' ? 'Verify your account' : 'Enter reset code',
)
const pageDescription = computed(() =>
  purpose.value === 'registration'
    ? 'Enter the 6-digit OTP we sent to your email to activate your account.'
    : 'Enter the 6-digit OTP we sent to your email.',
)
const successDescription = computed(() =>
  purpose.value === 'registration'
    ? 'Your account is verified and ready to use.'
    : 'Set your new password to complete the reset.',
)
const registrationSubmissionMessage = computed(() =>
  typeof route.query.message === 'string' ? route.query.message : '',
)

let cooldownTimer: ReturnType<typeof setInterval> | null = null

// ── Storage helpers ───────────────────────────────────────────────────
function storageKey(email: string) {
  return `${OTP_STORAGE_PREFIX}${purpose.value}.${email.toLowerCase()}`
}

function attemptKey(email: string) {
  return `${ATTEMPT_STORAGE_PREFIX}${purpose.value}.${email.toLowerCase()}`
}

function readOtpState(email: string): OtpStorageState | null {
  if (!import.meta.client || !email) return null
  const raw = sessionStorage.getItem(storageKey(email))
  if (!raw) return null
  try {
    return JSON.parse(raw) as OtpStorageState
  } catch {
    sessionStorage.removeItem(storageKey(email))
    return null
  }
}

function writeOtpState(email: string, updates: Partial<OtpStorageState>) {
  if (!import.meta.client || !email) return
  const current: OtpStorageState = readOtpState(email) ?? {
    email,
    cooldownUntil: 0,
    verified: false,
  }
  sessionStorage.setItem(storageKey(email), JSON.stringify({ ...current, ...updates }))
}

function readAttemptCount(email: string): number {
  if (!import.meta.client) return 0
  const raw = sessionStorage.getItem(attemptKey(email))
  if (!raw) return 0
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? n : 0
}

function bumpAttemptCount(email: string): number {
  if (!import.meta.client) return 0
  const next = readAttemptCount(email) + 1
  sessionStorage.setItem(attemptKey(email), String(next))
  return next
}

function clearAttemptCount(email: string) {
  if (!import.meta.client) return
  sessionStorage.removeItem(attemptKey(email))
}

function applyBan(email: string): number {
  const bannedUntil = Date.now() + BAN_DURATION_SECONDS * 1000
  writeOtpState(email, {
    bannedUntil,
    cooldownUntil: bannedUntil,
  })
  return bannedUntil
}

// ── Cooldown ticker ───────────────────────────────────────────────────
function refreshCooldown() {
  const stored = readOtpState(identifier.value)
  const now = Date.now()
  const banMs = (stored?.bannedUntil ?? 0) - now
  const cdMs = (stored?.cooldownUntil ?? 0) - now

  if (banMs > 0) {
    isBanned.value = true
    cooldownRemaining.value = Math.max(0, Math.ceil(banMs / 1000))
    return
  }
  if (stored?.bannedUntil && banMs <= 0) {
    writeOtpState(identifier.value, { bannedUntil: undefined })
  }
  isBanned.value = false
  if (cdMs > 0) {
    cooldownRemaining.value = Math.max(0, Math.ceil(cdMs / 1000))
    return
  }
  if (stored?.cooldownUntil && cdMs <= 0) {
    writeOtpState(identifier.value, { cooldownUntil: 0 })
  }
  cooldownRemaining.value = 0
}

function startCooldownTicker() {
  refreshCooldown()
  if (cooldownTimer) clearInterval(cooldownTimer)
  cooldownTimer = setInterval(() => {
    refreshCooldown()
    if (cooldownRemaining.value <= 0 && cooldownTimer && !isBanned.value) {
      clearInterval(cooldownTimer)
      cooldownTimer = null
    }
  }, 1000)
}

// ── UI helpers ────────────────────────────────────────────────────────
const otpValue = computed(() => state.otp.join('').replace(/\D/g, '').slice(0, OTP_LENGTH))

/** Display the countdown as `0:42`, `1:23`, `14:32` etc. */
const resendLabel = computed(() => {
  if (isBanned.value) return `Locked for ${cooldownLabel.value}`
  if (cooldownRemaining.value > 0) return `Resend in ${cooldownLabel.value}`
  return 'Resend code'
})

const cooldownLabel = computed(() => {
  const s = Math.max(0, cooldownRemaining.value)
  const mm = Math.floor(s / 60)
  const ss = s % 60
  return `${mm}:${ss.toString().padStart(2, '0')}`
})

const isCoolingDown = computed(() => cooldownRemaining.value > 0 || isBanned.value)

function clearFieldError(field: keyof Schema) {
  if (fieldErrors.value[field]) {
    fieldErrors.value = { ...fieldErrors.value, [field]: undefined }
  }
}

// ── Submit (verify OTP) ───────────────────────────────────────────────
async function onSubmit() {
  fieldErrors.value = {}

  if (otpValue.value.length !== OTP_LENGTH) {
    fieldErrors.value = {
      otp: `Please enter the complete ${OTP_LENGTH}-digit code sent to your email.`,
    }
    return
  }

  if (!identifier.value) {
    fieldErrors.value = {
      otp: purpose.value === 'registration'
        ? 'Start from sign up so we know which account to verify.'
        : 'Start from the forgot password page so we know which email to verify.',
    }
    return
  }

  submitting.value = true

  try {
    const response = await call<LoginResponse>(
      '/v1/auth/verify-otp',
      {
        method: 'POST',
        body: {
          email: identifier.value,
          otp: otpValue.value,
        },
      },
      { success: false },
    )

    // ✅ Verification success — clear attempts + cooldown storage
    clearAttemptCount(identifier.value)
    writeOtpState(identifier.value, {
      verified: true,
      verifiedAt: Date.now(),
      otp: otpValue.value,
    })

    const verifyTitle = purpose.value === 'registration' ? 'Account verified' : 'Code verified'
    const verifyDesc = (response as any)?.message
    toast.add({
      title: verifyTitle,
      description: verifyDesc && verifyDesc !== verifyTitle ? verifyDesc : undefined,
      icon: 'i-heroicons-check-circle',
      color: 'success',
    })

    if (purpose.value === 'registration') {
      const session = response.data

      if (session?.accessToken && session?.user) {
        await auth.acceptLoginResponse(session)
        if (import.meta.client) {
          sessionStorage.removeItem(storageKey(identifier.value))
        }
        const target = auth.isPlatformStaff ? '/platform' : '/admin'
        await navigateTo(target)
        return
      }

      await navigateTo({ path: '/sign-in', query: { registered: '1' } })
      return
    }

    await navigateTo({
      path: '/reset-password',
      query: { identifier: identifier.value, channel: 'email' },
    })
  } catch (e: any) {
    if (e?.fieldErrors && Object.keys(e.fieldErrors).length > 0) {
      fieldErrors.value = e.fieldErrors
    }
  } finally {
    submitting.value = false
  }
}

// ── Resend code (with 1-min cooldown + 3-attempt → 15-min ban) ───────
async function resendCode() {
  if (isCoolingDown.value || !identifier.value) return

  resending.value = true
  fieldErrors.value = {}
  ;(toast as any).clear?.()

  try {
    // Suppress both toasts from useApi — we show our own
    const res = await call(
      '/v1/auth/resend-otp',
      {
        method: 'POST',
        body: { email: identifier.value },
      },
      { silentSuccess: true, silentError: true },
    )

    // ✅ Success — clear attempts and start the 1-min cooldown
    clearAttemptCount(identifier.value)
    writeOtpState(identifier.value, {
      cooldownUntil: Date.now() + OTP_COOLDOWN_SECONDS * 1000,
      bannedUntil: undefined,
      verified: false,
      verifiedAt: undefined,
      otp: undefined,
    })
    isBanned.value = false
    state.otp = Array.from({ length: OTP_LENGTH }, () => '')
    startCooldownTicker()

    const resendTitle = 'New code sent'
    const resendDesc = (res as any)?.message
    toast.add({
      title: resendTitle,
      description: resendDesc && resendDesc !== resendTitle ? resendDesc : undefined,
      icon: 'i-heroicons-paper-airplane',
      color: 'success',
    })
  } catch (e: any) {
    // ❌ Error — bump the attempt counter; after 3 attempts apply the
    // hard 15-minute ban.
    const message = String(e?.data?.message || e?.message || 'Could not resend code.')
    const attemptCount = bumpAttemptCount(identifier.value)

    if (attemptCount >= BAN_AFTER_ATTEMPTS) {
      const bannedUntil = applyBan(identifier.value)
      isBanned.value = true
      const minutes = Math.ceil((bannedUntil - Date.now()) / 60000)
      toast.add({
        title: 'Too many attempts',
        description: `You've reached the limit of ${BAN_AFTER_ATTEMPTS} attempts. For your security, this email is locked for ${minutes} minute${minutes === 1 ? '' : 's'}.`,
        icon: 'i-heroicons-shield-exclamation',
        color: 'error',
      })
      startCooldownTicker()
    } else {
      // Regular 1-min cooldown
      writeOtpState(identifier.value, {
        cooldownUntil: Date.now() + OTP_COOLDOWN_SECONDS * 1000,
      })
      startCooldownTicker()
      const attemptsLeft = Math.max(0, BAN_AFTER_ATTEMPTS - attemptCount)
      toast.add({
        title: attemptsLeft > 0
          ? `Couldn\'t resend (${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} left)`
          : 'Couldn\'t resend code',
        description: attemptsLeft > 0
          ? message
          : `${message} After one more attempt this email will be locked for 15 minutes.`,
        icon: 'i-heroicons-exclamation-triangle',
        color: 'error',
      })
    }

    if (e?.fieldErrors && Object.keys(e.fieldErrors).length > 0) {
      fieldErrors.value = e.fieldErrors
    }
  } finally {
    resending.value = false
  }
}

function errorFor(field: keyof Schema): string | undefined {
  return fieldErrors.value[field]
}

watch(otpValue, async (value, previousValue) => {
  clearFieldError('otp')

  if (
    value.length === OTP_LENGTH
    && previousValue !== value
    && !submitting.value
    && Boolean(identifier.value)
  ) {
    await onSubmit()
  }
})

onMounted(() => {
  startCooldownTicker()
})

onBeforeUnmount(() => {
  if (cooldownTimer) clearInterval(cooldownTimer)
})
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="text-3xl font-bold tracking-tight">{{ pageTitle }}</h1>
      <p class="mt-1.5 text-sm text-muted">{{ pageDescription }}</p>
      <p v-if="identifier" class="mt-2 text-xs text-muted">
        Destination: {{ identifier }}
      </p>
    </div>

    <UAlert
      v-if="isBanned"
      color="error"
      variant="soft"
      icon="i-heroicons-shield-exclamation"
      title="Too many attempts — temporarily locked"
      description="For your security, this email is locked for 15 minutes. You'll be able to resend once the timer hits 0."
      class="mb-5"
    />

    <UForm
      :schema="schema"
      :state="state"
      class="space-y-5"
      @submit="onSubmit"
    >
      <UFormField
        label="OTP code"
        name="otp"
        :error="errorFor('otp')"
        :ui="{ root: 'w-full', label: 'text-sm font-medium', container: 'w-full mt-2' }"
      >
        <UPinInput
          v-model="state.otp as unknown as number[]"
          :length="OTP_LENGTH"
          otp
          autofocus
          type="number"
          size="xl"
          class="justify-between"
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
        :loading="submitting"
        :disabled="submitting"
        class="font-semibold"
      >
        Verify code
      </UButton>
    </UForm>

    <div class="mt-6 text-center text-sm text-muted">
      <span>Didn’t receive it?</span>
      <UButton
        type="button"
        :color="isBanned ? 'error' : 'neutral'"
        :variant="isBanned ? 'subtle' : 'link'"
        class="ml-1 p-0 font-semibold"
        :class="{ 'text-primary': !isBanned, 'text-error': isBanned }"
        :disabled="isCoolingDown || resending"
        :loading="resending"
        @click="resendCode"
      >
        <span v-if="isBanned" class="inline-flex items-center gap-2">
          <UIcon name="i-heroicons-shield-exclamation" class="size-4" />
          {{ resendLabel }}
        </span>
        <span v-else-if="cooldownRemaining > 0" class="inline-flex items-center gap-2">
          <UIcon name="i-heroicons-clock" class="size-4" />
          {{ resendLabel }}
        </span>
        <span v-else>{{ resendLabel }}</span>
      </UButton>
    </div>

    <p class="mt-4 text-center text-sm text-muted">
      Wrong email?
      <ULink
        :to="purpose === 'registration' ? '/sign-up' : '/forgot-password'"
        class="font-semibold text-primary hover:underline"
      >
        {{ purpose === 'registration' ? 'Return to sign up' : 'Start again' }}
      </ULink>
    </p>
  </div>
</template>
