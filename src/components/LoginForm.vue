<script setup lang="ts">
const props = defineProps<{
  next?: string
}>()

const form = reactive({ email: '', password: '' })
const loading = ref(false)
const errorMessage = ref<string | null>(null)
const fieldErrors = reactive<{ email?: string; password?: string }>({})
const showPassword = ref(false)
const toast = useToast()

// Pre-fill the form when a dev `email` query param is supplied so
// manual smoke tests on localhost don't require copy-paste.
onMounted(() => {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.search)
  const email = params.get('email')
  const password = params.get('password')
  if (email) form.email = email
  if (password) form.password = password
})

function applyFieldErrors(errors: Record<string, unknown> | undefined) {
  fieldErrors.email = undefined
  fieldErrors.password = undefined
  if (!errors) return
  for (const [key, value] of Object.entries(errors)) {
    if (key === 'email' || key === 'password') {
      fieldErrors[key] = Array.isArray(value) ? (value as string[]).join(', ') : String(value)
    }
  }
}

async function handleSubmit() {
  errorMessage.value = null
  applyFieldErrors(undefined)
  loading.value = true
  const res = await login({ email: form.email, password: form.password })
  loading.value = false

  if (res.success) {
    toast.add({
      title: 'Welcome back',
      description: 'You are now signed in.',
      color: 'success',
      icon: 'i-lucide-check-circle-2',
    })
    const dest = props.next && props.next.startsWith('/') ? props.next : '/admin'
    if (typeof window !== 'undefined') window.location.assign(dest)
    return
  }

  applyFieldErrors(res.errors as Record<string, unknown> | undefined)
  errorMessage.value = res.message || 'Invalid email or password'
}
</script>

<template>
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

    <UFormField label="Password" name="password" :error="fieldErrors.password" required>
      <UInput
        v-model="form.password"
        size="xl"
        :type="showPassword ? 'text' : 'password'"
        placeholder="Your password"
        autocomplete="current-password"
        class="w-full"
      >
        <template #trailing>
          <button type="button" tabindex="-1" @click="showPassword = !showPassword" aria-label="Toggle password visibility">
            <UIcon :name="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'" class="w-4 h-4 text-muted" />
          </button>
        </template>
      </UInput>
    </UFormField>

    <div v-if="errorMessage" class="text-sm text-error">
      {{ errorMessage }}
    </div>

      <UButton
        type="submit"
        size="xl"
        :loading="loading"
        :disabled="loading"
        label="Sign In"
        icon="i-lucide-log-in"
        color="primary"
        block
      />

    <div class="flex items-center justify-between text-sm">
      <a href="/forgot-password" class="text-muted hover:text-primary">Forgot password?</a>
      <a href="/admin" class="text-muted hover:text-primary">Admin panel</a>
    </div>
  </UForm>
</template>
