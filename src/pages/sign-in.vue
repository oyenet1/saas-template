<script setup lang="ts">
import { z } from 'zod'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'auth' })

const auth = useAuthStore()
const route = useRoute()
const toast = useToast()

/**
 * Sanitises any error that bubbles up from `auth.login()` or the raw
 * `$fetch` resend-otp call so we never leak the API URL, the HTTP method,
 * or raw browser fetch strings ("Failed to fetch", "NetworkError …", etc.)
 * in a user-facing toast.
 */
function cleanLoginErrorMessage(raw: string, status?: number): string {
  const fallback = status === 0
    ? "Can't reach the server. Please check your connection and try again."
    : 'Sign-in failed. Please try again.'
  const text = (raw || '').trim()
  if (!text) return fallback
  if (/\bhttps?:\/\//i.test(text)) return fallback
  const lc = text.toLowerCase()
  if (
    lc.includes('failed to fetch')
    || lc.includes('networkerror')
    || lc.includes('network error when attempting')
    || lc.includes('load failed')
    || lc.includes('fetch failed')
    || lc.includes('TypeError: fetch')
  ) return fallback
  return text
}

const defaultRedirect = '/admin'

function redirectForRole(): string {
  if (auth.isPlatformStaff) return '/platform'
  return defaultRedirect
}

const schema = z.object({
  identifier: z.string().min(1, 'Email or phone is required'),
  password: z.string().min(1, 'Password is required'),
})

type Schema = z.infer<typeof schema>

const state = reactive<Schema>({
  identifier: typeof route.query.email === 'string' ? route.query.email : '',
  password: '',
})

const fieldErrors = ref<Record<string, string | undefined>>({})
const submitting = ref(false)
const showPassword = ref(false)
const passwordInputId = 'signin-password'

const needsVerification = ref(false)
const resendingVerification = ref(false)

async function onSubmit() {
  fieldErrors.value = {}
  needsVerification.value = false
  submitting.value = true

  try {
    const loggedInUser = await auth.login({
      identifier: state.identifier,
      password: state.password,
    })

    // The login endpoint returns a slim user (no associatedHotels,
    // currentHotel, plan, or subscription). The dashboard layout
    // depends on those fields to render the active plan badge, so we
    // must await the full profile fetch BEFORE navigating — otherwise
    // the dashboard flashes "No active plan" and only recovers if the
    // background fetch happens to succeed. This await also turns
    // a silent profile-fetch failure into a visible error.
    try {
      await auth.fetchProfile()
    } catch (profileErr: any) {
      // eslint-disable-next-line no-console
      console.error("Post-login profile fetch failed", profileErr?.message)
      // Force a sign-out so we don't leave the user in a half-state
      // where the dashboard can't render plan/billing info.
      await auth.logout({ silent: true })
      toast.add({
        title: 'Sign-in incomplete',
        description: 'We could not load your account details. Please try again.',
        icon: 'i-heroicons-exclamation-triangle',
        color: 'error',
      })
      return
    }

    const welcomeTitle = 'Welcome back'
    // Use the freshly-fetched profile (with plan + hotels) when
    // building the welcome line; fall back to the slim login user.
    const displayUser = auth.user ?? loggedInUser
    const welcomeDesc = (auth.fullName || displayUser?.email)
      ? `Signed in as ${auth.fullName || displayUser?.email}.`
      : undefined
    toast.add({
      title: welcomeTitle,
      description: welcomeDesc && welcomeDesc !== welcomeTitle ? welcomeDesc : undefined,
      icon: 'i-heroicons-check-circle',
      color: 'success',
    })

    const redirect =
      typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/')
        ? route.query.redirect
        : redirectForRole()

    await navigateTo(redirect)
  } catch (e: any) {
    const rawMessage = String(e?.data?.message || e?.message || '')
    const message = cleanLoginErrorMessage(rawMessage, e?.status)
    const isVerificationError =
      e?.status === 403 && /verify|not yet verified/i.test(rawMessage)

    if (isVerificationError) {
      // The inline <UAlert> already communicates the verification
      // requirement — suppress the error toast to avoid showing it
      // alongside the resend success toast later.
      needsVerification.value = true
    } else if (message) {
      toast.add({
        title: 'Error',
        description: message,
        icon: 'i-heroicons-exclamation-triangle',
        color: 'error',
      })
    }

    if (e?.status === 422) {
      const fe = e?.data?.errors ?? e?.data?.fieldErrors ?? e?.fieldErrors
      if (fe && Object.keys(fe).length > 0) {
        fieldErrors.value = fe
        if (fe.email && !fe.identifier) {
          fieldErrors.value.identifier = fe.email
        }
      }
    }
  } finally {
    submitting.value = false
  }
}

const identifierForVerification = computed(() =>
  state.identifier.includes('@') ? state.identifier.trim().toLowerCase() : '',
)

async function resendVerification() {
  if (resendingVerification.value || !identifierForVerification.value) return

  resendingVerification.value = true

  try {
    const res = await $fetch('/v1/auth/resend-otp', {
      baseURL: getApiBase() || undefined,
      method: 'POST',
      body: { email: identifierForVerification.value },
    })

    // Clear any lingering toasts from a previous failed login attempt
    // so the success toast stands alone and doesn't overlap.
    ;(toast as any).clear?.()

    const sentTitle = 'Code sent'
    const sentDesc = (res as any)?.message || 'A new verification code has been sent to your email.'
    toast.add({
      title: sentTitle,
      description: sentDesc && sentDesc !== sentTitle ? sentDesc : undefined,
      icon: 'i-heroicons-check-circle',
      color: 'success',
    })

    await navigateTo({
      path: '/otp',
      query: {
        identifier: identifierForVerification.value,
        purpose: 'registration',
      },
    })
  } catch (e: any) {
    const errTitle = 'Error'
    const errDesc = String(e?.data?.message || e?.message || 'Could not send verification code.')
    toast.add({
      title: errTitle,
      description: errDesc && errDesc !== errTitle ? errDesc : undefined,
      icon: 'i-heroicons-exclamation-triangle',
      color: 'error',
    })
  } finally {
    resendingVerification.value = false
  }
}

function errorFor(field: keyof Schema): string | undefined {
  return fieldErrors.value[field]
}
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="text-3xl font-bold tracking-tight">Welcome back</h1>
      <p class="mt-1.5 text-sm text-muted">Sign in to manage your property.</p>
    </div>

    <UAlert
      v-if="route.query.registered === '1'"
      color="success"
      variant="soft"
      icon="i-heroicons-check-circle"
      title="Account created successfully"
      description="You can sign in now with your email or phone and password."
      class="mb-5"
    />

    <UForm
      :schema="schema"
      :state="state"
      class="space-y-5"
      @submit="onSubmit"
    >
      <UFormField
        label="Email / Username"
        name="identifier"
        :error="errorFor('identifier')"
        :ui="{ root: 'w-full', label: 'text-sm font-medium', container: 'w-full mt-1' }"
      >
        <UInput
          v-model="state.identifier"
          type="text"
          placeholder="you@yourhotel.com"
          autocomplete="username"
          size="xl"
          :ui="{ base: 'w-full', root: 'w-full' }"
        />
      </UFormField>

      <UFormField
        label="Password"
        name="password"
        :error="errorFor('password')"
        :ui="{ root: 'w-full', label: 'text-sm font-medium', container: 'w-full mt-1' }"
      >
        <UInput
          :id="passwordInputId"
          v-model="state.password"
          :type="showPassword ? 'text' : 'password'"
          placeholder="Enter your password"
          autocomplete="current-password"
          size="xl"
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
              :aria-controls="passwordInputId"
              @click="showPassword = !showPassword"
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
        class="mt-2 font-semibold"
      >
        Sign in
      </UButton>
    </UForm>

    <UAlert
      v-if="needsVerification"
      color="warning"
      variant="soft"
      icon="i-heroicons-exclamation-triangle"
      title="Email not verified"
      description="Your account is registered but not yet verified. Resend the verification code to your email."
      class="mt-5"
    >
      <template #actions>
        <UButton
          color="warning"
          variant="solid"
          size="sm"
          :loading="resendingVerification"
          :disabled="resendingVerification || !identifierForVerification"
          @click="resendVerification"
        >
          Resend code
        </UButton>
      </template>
    </UAlert>

    <div class="mt-4 text-center">
      <ULink to="/forgot-password" class="text-sm text-primary hover:underline">
        Forgot password?
      </ULink>
    </div>

    <p class="mt-6 text-center text-sm text-muted">
      Don't have an account?
      <ULink to="/sign-up" class="text-primary font-semibold hover:underline">
        Create one
      </ULink>
    </p>
  </div>
</template>
