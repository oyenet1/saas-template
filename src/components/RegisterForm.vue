<script setup lang="ts">
const props = defineProps<{ next?: string }>()

const form = reactive({ name: '', email: '', password: '' })
const loading = ref(false)
const errorMessage = ref<string | null>(null)
const fieldErrors = reactive<{ name?: string; email?: string; password?: string }>({})
const toast = useToast()

onMounted(() => {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.search)
  const email = params.get('email')
  if (email) form.email = email
  const name = params.get('name')
  if (name) form.name = name
})

function applyFieldErrors(errors: Record<string, unknown> | undefined) {
  fieldErrors.name = undefined
  fieldErrors.email = undefined
  fieldErrors.password = undefined
  if (!errors) return
  for (const [key, value] of Object.entries(errors)) {
    if (key === 'name' || key === 'email' || key === 'password') {
      fieldErrors[key as 'name' | 'email' | 'password'] = Array.isArray(value)
        ? (value as string[]).join(', ')
        : String(value)
    }
  }
}

async function handleSubmit() {
  errorMessage.value = null
  applyFieldErrors(undefined)
  loading.value = true
  const res = await register({ name: form.name, email: form.email, password: form.password })
  loading.value = false

  if (res.success) {
    toast.add({
      title: 'Account created',
      description: 'Welcome to TopVilla.',
      color: 'success',
      icon: 'i-lucide-check-circle-2',
    })
    const dest = props.next && props.next.startsWith('/') ? props.next : '/dashboard'
    if (typeof window !== 'undefined') window.location.assign(dest)
    return
  }

  applyFieldErrors(res.errors as Record<string, unknown> | undefined)
  errorMessage.value = res.message || 'Could not create account'
}
</script>

<template>
  <UForm :state="form" class="space-y-5" @submit="handleSubmit">
    <UFormField label="Full Name" name="name" :error="fieldErrors.name" required>
      <UInput
        v-model="form.name"
        placeholder="Your name"
        autocomplete="name"
        class="w-full"
      />
    </UFormField>
    <UFormField label="Email" name="email" :error="fieldErrors.email" required>
      <UInput
        v-model="form.email"
        type="email"
        placeholder="you@example.com"
        autocomplete="email"
        class="w-full"
      />
    </UFormField>
    <UFormField label="Password" name="password" :error="fieldErrors.password" required help="At least 8 characters">
      <UInput
        v-model="form.password"
        type="password"
        placeholder="Choose a strong password"
        autocomplete="new-password"
        class="w-full"
      />
    </UFormField>

    <div v-if="errorMessage" class="text-sm text-error">{{ errorMessage }}</div>

    <UButton
      type="submit"
      :loading="loading"
      :disabled="loading"
      label="Create Account"
      icon="i-lucide-user-plus"
      color="primary"
      size="lg"
      block
    />

    <p class="text-sm text-muted text-center">
      Already have an account?
      <a href="/login" class="text-primary hover:underline">Sign in</a>
    </p>
  </UForm>
</template>
