<script setup lang="ts">
const email = ref('')
const loading = ref(false)
const submitted = ref(false)
const errorMessage = ref<string | null>(null)
const fieldErrors = reactive<{ email?: string }>({})
const toast = useToast()

onMounted(() => {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.search)
  const e = params.get('email')
  if (e) email.value = e
})

function applyFieldErrors(errors: Record<string, unknown> | undefined) {
  fieldErrors.email = undefined
  if (!errors) return
  for (const [key, value] of Object.entries(errors)) {
    if (key === 'email') {
      fieldErrors.email = Array.isArray(value) ? (value as string[]).join(', ') : String(value)
    }
  }
}

async function handleSubmit() {
  errorMessage.value = null
  applyFieldErrors(undefined)
  loading.value = true
  const res = await forgotPassword({ email: email.value })
  loading.value = false

  if (res.success) {
    submitted.value = true
    toast.add({
      title: 'Check your inbox',
      description: 'If that email is registered, a reset code has been sent.',
      color: 'success',
      icon: 'i-lucide-mail-check',
    })
    return
  }

  applyFieldErrors(res.errors as Record<string, unknown> | undefined)
  errorMessage.value = res.message || 'Failed to send reset code'
}
</script>

<template>
  <div v-if="!submitted">
    <UForm :state="{ email }" class="space-y-5" @submit="handleSubmit">
      <UFormField label="Email" name="email" :error="fieldErrors.email" required>
        <UInput
          v-model="email"
          type="email"
          placeholder="you@example.com"
          autocomplete="email"
          class="w-full"
        />
      </UFormField>

      <div v-if="errorMessage" class="text-sm text-error">{{ errorMessage }}</div>

      <UButton
        type="submit"
        :loading="loading"
        :disabled="loading"
        label="Send Reset Code"
        icon="i-lucide-mail"
        color="primary"
        size="lg"
        block
      />

      <p class="text-sm text-muted text-center">
        Remembered it?
        <a href="/login" class="text-primary hover:underline">Back to sign in</a>
      </p>
    </UForm>
  </div>

  <div
    v-else
    class="text-center py-12 px-6 rounded-xl border border-default bg-elevated/50"
  >
    <div class="text-5xl mb-4 text-primary">&#9993;</div>
    <h3 class="text-xl font-semibold">Check your email</h3>
    <p class="text-muted mt-2 max-w-md mx-auto">
      If an account exists for <span class="font-medium">{{ email }}</span>, a reset code has been sent.
      Enter the code on the next page to choose a new password.
    </p>
    <UButton
      class="mt-6"
      color="primary"
      :to="`/reset-password?email=${encodeURIComponent(email)}`"
      label="Enter Reset Code"
      icon="i-lucide-key-round"
    />
  </div>
</template>
