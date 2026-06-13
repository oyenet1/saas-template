<script setup lang="ts">
import { z } from 'zod'
import { watch } from 'vue'

definePageMeta({ layout: 'auth' })

const { call } = useApi()
const toast = useToast()

// Resend cooldown: 1 minute (per-attempt)
const RESEND_COOLDOWN_SECONDS = 60

// After this many *attempts* (successes don't count), apply a hard
// 15-minute ban so a user can't brute-force the resend endpoint.
const BAN_AFTER_ATTEMPTS = 3
const BAN_DURATION_SECONDS = 15 * 60

const OTP_STORAGE_PREFIX = 'ls.otp.reset.'
const ATTEMPT_STORAGE_PREFIX = 'ls.otp.reset.attempts.'

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email'),
})

type Schema = z.infer<typeof schema>

const state = reactive<Schema>({
  email: '',
})

const fieldErrors = ref<Record<string, string | undefined>>({})
const submitting = ref(false)

// ── Cooldown + ban state ────────────────────────────────────────────
/** Remaining cooldown in whole seconds (0 = not cooling down). */
const cooldownRemaining = ref(0)
/** Whether the user is currently banned (15-min hard block). */
const isBanned = ref(false)
/** Handle returned by setInterval so we can clear it on unmount. */
let cooldownTimer: ReturnType<typeof setInterval> | null = null

const isCoolingDown = computed(() => cooldownRemaining.value > 0 || isBanned.value)

/** Human-friendly countdown: `0:42`, `4:59`, `14:32`. */
const cooldownLabel = computed(() => {
  const s = Math.max(0, cooldownRemaining.value)
  const mm = Math.floor(s / 60)
  const ss = s % 60
  return `${mm}:${ss.toString().padStart(2, '0')}`
})

function clearCooldownTimer() {
  if (cooldownTimer) {
    clearInterval(cooldownTimer)
    cooldownTimer = null
  }
}

function startCooldown(durationMs: number) {
  clearCooldownTimer()
  const endAt = Date.now() + durationMs
  cooldownRemaining.value = Math.ceil(durationMs / 1000)

  cooldownTimer = setInterval(() => {
    const remaining = Math.max(0, Math.ceil((endAt - Date.now()) / 1000))
    cooldownRemaining.value = remaining
    if (remaining <= 0) {
      clearCooldownTimer()
    }
  }, 250)
}

onBeforeUnmount(() => clearCooldownTimer())

function storageKey(email: string) {
  return `${OTP_STORAGE_PREFIX}${email.toLowerCase()}`
}

function attemptKey(email: string) {
  return `${ATTEMPT_STORAGE_PREFIX}${email.toLowerCase()}`
}

interface OtpStorageState {
  email: string
  cooldownUntil?: number
  verified: boolean
  bannedUntil?: number
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

function persistOtpState(email: string, updates: Partial<OtpStorageState> = {}) {
  if (!import.meta.client) return
  const current: OtpStorageState = readOtpState(email) ?? {
    email: email.toLowerCase(),
    verified: false,
  }
  sessionStorage.setItem(storageKey(email), JSON.stringify({ ...current, ...updates }))
}

/** Read the attempt counter for this email (resets after ban expires). */
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

/**
 * Apply a hard ban for this email: writes bannedUntil = now + 15 min
 * and resets the attempt counter. Returns the ban end timestamp.
 */
function applyBan(email: string): number {
  const bannedUntil = Date.now() + BAN_DURATION_SECONDS * 1000
  persistOtpState(email, {
    bannedUntil,
    cooldownUntil: bannedUntil,
  })
  return bannedUntil
}

/**
 * Restore cooldown + ban state from sessionStorage so a page reload
 * mid-cooldown keeps the timer running. Returns true if either state
 * is active.
 */
function restoreCooldownFromStorage(email: string): boolean {
  if (!import.meta.client || !email) return false
  const stored = readOtpState(email)
  if (!stored) {
    isBanned.value = false
    return false
  }

  const now = Date.now()
  const banRemaining = (stored.bannedUntil ?? 0) - now
  const cooldownRemainingMs = (stored.cooldownUntil ?? 0) - now

  if (banRemaining > 0) {
    // Hard ban — overrides the regular cooldown
    isBanned.value = true
    startCooldown(banRemaining)
    return true
  }

  // Stale ban entry — clear it
  if (stored.bannedUntil && banRemaining <= 0) {
    persistOtpState(email, { bannedUntil: undefined })
  }

  isBanned.value = false
  if (cooldownRemainingMs > 0) {
    startCooldown(cooldownRemainingMs)
    return true
  }

  // Stale cooldown — clear it
  if (stored.cooldownUntil && cooldownRemainingMs <= 0) {
    persistOtpState(email, { cooldownUntil: undefined })
  }
  return false
}

watch(
  () => state.email,
  (email) => {
    if (!email || !import.meta.client) return
    restoreCooldownFromStorage(email.trim().toLowerCase())
  },
)

onMounted(() => {
  if (state.email) {
    restoreCooldownFromStorage(state.email.trim().toLowerCase())
  }
})

async function onSubmit() {
  fieldErrors.value = {}
  if (isCoolingDown.value) return

  submitting.value = true

  // Clear any leftover toasts (e.g. an old error from a previous attempt)
  // so any error toast from this attempt stands alone.
  ;(toast as any).clear?.()

  try {
    const email = state.email.trim().toLowerCase()

    // Suppress both success and error toasts from useApi() — we'll
    // handle the error case ourselves so we can keep the user on the
    // page and show the cooldown. On success we capture the backend
    // message and use it as the toast description.
    const res = await call<{ message?: string } | null>(
      '/v1/auth/send-otp',
      {
        method: 'POST',
        body: { email },
      },
      {
        silentSuccess: true,
        silentError: true,
      },
    )

    // ✅ Success: bump the attempt counter, clear it (success = no ban),
    // persist a 5-min cooldown, fire a success toast, then redirect.
    clearAttemptCount(email)
    persistOtpState(email, {
      cooldownUntil: Date.now() + RESEND_COOLDOWN_SECONDS * 1000,
    })
    startCooldown(RESEND_COOLDOWN_SECONDS * 1000)
    isBanned.value = false

    const serverMessage = String(res?.message ?? '').trim()
    toast.add({
      title: 'Reset code sent',
      description:
        serverMessage ||
        `We sent a verification code to ${email}. Check your inbox (and spam folder) — the code expires in 5 minutes.`,
      icon: 'i-heroicons-envelope',
      color: 'success',
    })

    await navigateTo({
      path: '/forgot-password-otp',
      query: { identifier: email },
    })
  } catch (e: any) {
    // ❌ Error path — bump the attempt counter. After 3 attempts we
    // apply a hard 15-minute ban and lock the button until it expires.
    const email = state.email.trim().toLowerCase()
    const message = String(e?.data?.message || e?.message || 'Could not send verification code.')
    const attemptCount = email ? bumpAttemptCount(email) : 0

    if (email && attemptCount >= BAN_AFTER_ATTEMPTS) {
      // Hard 15-minute ban
      const bannedUntil = applyBan(email)
      isBanned.value = true
      const minutes = Math.ceil((bannedUntil - Date.now()) / 60000)

      toast.add({
        title: 'Too many attempts',
        description: `You've reached the limit of ${BAN_AFTER_ATTEMPTS} attempts. For your security, this email is locked for ${minutes} minute${minutes === 1 ? '' : 's'}.`,
        icon: 'i-heroicons-shield-exclamation',
        color: 'error',
      })
      // Start the cooldown timer for the full 15 minutes
      startCooldown(BAN_DURATION_SECONDS * 1000)
    } else {
      // Regular 5-min resend cooldown
      persistOtpState(email, {
        cooldownUntil: Date.now() + RESEND_COOLDOWN_SECONDS * 1000,
      })
      startCooldown(RESEND_COOLDOWN_SECONDS * 1000)

      const attemptsLeft = Math.max(0, BAN_AFTER_ATTEMPTS - attemptCount)
      toast.add({
        title: attemptsLeft > 0
          ? `Couldn't send code (${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} left)`
          : 'Couldn\'t send code',
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
    submitting.value = false
  }
}

function errorFor(field: keyof Schema): string | undefined {
  return fieldErrors.value[field]
}
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="text-3xl font-bold tracking-tight">Reset password</h1>
      <p class="mt-1.5 text-sm text-muted">
        We’ll send a verification code to your email.
      </p>
    </div>

    <UAlert
      v-if="isBanned"
      color="error"
      variant="soft"
      icon="i-heroicons-shield-exclamation"
      title="Too many attempts — temporarily locked"
      :description="`For your security, this email is locked for 15 minutes. You'll be able to try again when the timer hits 0.`"
      class="mb-5"
    />

    <UForm
      :schema="schema"
      :state="state"
      class="space-y-5"
      @submit="onSubmit"
    >
      <UFormField
        label="Email"
        name="email"
        :error="errorFor('email')"
        :ui="{ root: 'w-full', label: 'text-sm font-medium', container: 'w-full mt-1' }"
      >
        <UInput
          v-model="state.email"
          type="email"
          placeholder="you@yourhotel.com"
          autocomplete="email"
          size="xl"
          :disabled="isBanned"
          :ui="{ base: 'w-full', root: 'w-full' }"
        />
      </UFormField>

      <UButton
        type="submit"
        color="primary"
        size="xl"
        block
        :loading="submitting"
        :disabled="submitting || isCoolingDown"
        class="font-semibold"
      >
        <span v-if="isBanned" class="inline-flex items-center gap-2">
          <UIcon name="i-heroicons-shield-exclamation" class="size-4" />
          Locked for {{ cooldownLabel }}
        </span>
        <span v-else-if="isCoolingDown" class="inline-flex items-center gap-2">
          <UIcon name="i-heroicons-clock" class="size-4" />
          Resend code in {{ cooldownLabel }}
        </span>
        <span v-else>Send reset code</span>
      </UButton>
    </UForm>

    <p class="mt-6 text-center text-sm text-muted">
      Back to
      <ULink to="/sign-in" class="text-primary font-semibold hover:underline">
        Sign in
      </ULink>
    </p>
  </div>
</template>
