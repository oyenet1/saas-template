<script setup lang="ts">
import { useNewsletter } from '../composables/useNewsletter'

const { subscribed, loading, error, subscribe, reset } = useNewsletter()
const email = ref('')

async function handleSubmit() {
  if (!email.value) return
  reset()
  await subscribe({ email: email.value })
}
</script>

<template>
  <div class="max-w-lg mx-auto">
    <div v-if="subscribed" class="text-center py-6">
      <div class="text-4xl mb-3">&#9993;</div>
      <p class="text-lg font-semibold">You're subscribed!</p>
      <p class="text-sm text-muted mt-1">We'll send you the latest luxury listings.</p>
    </div>
    <UForm v-else :state="{ email }" class="flex gap-3" @submit="handleSubmit">
      <UFormField name="email" class="flex-1">
        <UInput
          v-model="email"
          type="email"
          size="xl"
          placeholder="Enter your email"
          autocomplete="email"
          class="w-full"
        />
      </UFormField>
      <UButton
        type="submit"
        label="Subscribe"
        color="primary"
        size="xl"
        :loading="loading"
        :disabled="loading || !email"
      />
    </UForm>
    <p v-if="error" class="text-xs text-error mt-2">{{ error }}</p>
  </div>
</template>
