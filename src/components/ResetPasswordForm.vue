<script setup lang="ts">
const form = reactive({ email: '', code: '', password: '' })
const loading = ref(false)
const submitted = ref(false)
const errorMessage = ref<string | null>(null)
const fieldErrors = reactive<{ email?: string; code?: string; password?: string }>({})
const showPassword = ref(false)
const toast = useToast()

onMounted(() => {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.search)
  const e = params.get('email')
  const c = params.get('devCode') ?? params.get('code')
  if (e) form.email = e
  if (c) form.code = c
})

function applyFieldErrors(errors: Record<string, unknown> | undefined) {
  fieldErrors.email = undefined
  fieldErrors.code = undefined
  fieldErrors.password = undefined
  if (!errors) return
  for (const [key, value] of Object.entries(errors)) {
    if (key === 'email' || key === 'code' || key === 'password') {
      fieldErrors[key as 'email' | 'code' | 'password'] = Array.isArray(value)
        ? (value as string[]).join(', ')
        : String(value)
    }
  }
}

async function handleSubmit() {
  errorMessage.value = null
  applyFieldErrors(undefined)
  loading.value = true
  const res = await resetPassword({ email: form.email, code: form.code, password: form.password })
  loading.value = false

  if (res.success) {
    submitted.value = true
    toast.add({
      title: 'Password updated',
      description: 'You can now sign in with the new password.',
      color: 'success',
      icon: 'i-lucide-check-circle-2',
    })
    return
  }

  applyFieldErrors(res.errors as Record<string, unknown> | undefined)
  errorMessage.value = res.message || 'Failed to reset password'
}
</script>

<template>
  <div v-if="!submitted">
    <UForm :state="form" class="space-y-5" @submit="handleSubmit">
      <UFormField label="Email" name="email" :error="fieldErrors.email" required>
        <UInput
          v-model="form.email"
          size="xl"
          type="email"
          placeholder="you@example.com"
          autocomplete="email"
          class="w-full"
        />
      </UFormField>
      <UFormField label="Reset Code" name="code" :error="fieldErrors.code" required>
        <UInput
          v-model="form.code"
          size="xl"
          inputmode="numeric"
          placeholder="6-digit code"
          class="w-full"
        />
      </UFormField>
      <UFormField
        label="New Password"
        name="password"
        :error="fieldErrors.password"
        required
        help="At least 8 characters"
      >
        <UInput
          v-model="form.password"
          size="xl"
          :type="showPassword ? 'text' : 'password'"
          placeholder="Choose a strong password"
          autocomplete="new-password"
          class="w-full"
        >
          <template #trailing>
            <button type="button" tabindex="-1" @click="showPassword = !showPassword" aria-label="Toggle password visibility">
              <UIcon :name="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'" class="w-4 h-4 text-muted" />
            </button>
          </template>
        </UInput>
      </UFormField>

      <div v-if="errorMessage" class="text-sm text-error">{{ errorMessage }}</div>

      <UButton
        type="submit"
        size="xl"
        :loading="loading"
        :disabled="loading"
        label="Update Password"
        icon="i-lucide-key-round"
        color="primary"
        block
      />
    </UForm>
  </div>

  <div
    v-else
    class="text-center py-12 px-6 rounded-xl border border-default bg-elevated/50"
  >
    <div class="text-5xl mb-4 text-primary">&#10003;</div>
    <h3 class="text-xl font-semibold">Password updated</h3>
    <p class="text-muted mt-2 max-w-md mx-auto">
      You can now sign in with the new password.
    </p>
      <UButton
        class="mt-6"
        size="xl"
        color="primary"
        to="/login"
        label="Sign In"
        icon="i-lucide-log-in"
      />
  </div>
</template>
