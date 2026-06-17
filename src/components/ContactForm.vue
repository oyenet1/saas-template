<script setup lang="ts">
const form = reactive({
  name: '',
  email: '',
  phone: '',
  message: '',
  type: 'general',
})

const submitted = ref(false)
const loading = ref(false)
const toast = useToast()

const inquiryTypes = [
  { label: 'General Inquiry', value: 'general' },
  { label: 'Buying a Property', value: 'buying' },
  { label: 'Selling a Property', value: 'selling' },
  { label: 'Investment Advice', value: 'investment' },
  { label: 'Schedule a Viewing', value: 'viewing' },
]

async function handleSubmit() {
  loading.value = true
  await new Promise((r) => setTimeout(r, 1000))
  submitted.value = true
  loading.value = false
  toast.add({
    title: 'Message sent',
    description: 'Our team will reach out within 24 hours.',
    color: 'success',
    icon: 'i-lucide-check-circle-2',
  })
}

function resetForm() {
  submitted.value = false
  form.name = ''
  form.email = ''
  form.phone = ''
  form.message = ''
  form.type = 'general'
}
</script>

<template>
  <div>
    <UForm
      v-if="!submitted"
      :state="form"
      class="space-y-5"
      @submit="handleSubmit"
    >
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <UFormField label="Full Name" name="name" required>
          <UInput
            v-model="form.name"
            color="primary"
            placeholder="John Doe"
            autocomplete="name"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Email" name="email" required>
          <UInput
            v-model="form.email"
            color="primary"
            type="email"
            placeholder="john@example.com"
            autocomplete="email"
            class="w-full"
          />
        </UFormField>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <UFormField label="Phone" name="phone">
          <UInput
            v-model="form.phone"
            color="primary"
            type="tel"
            placeholder="+1 (555) 000-0000"
            autocomplete="tel"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Inquiry Type" name="type">
          <USelect
            v-model="form.type"
            color="primary"
            :items="inquiryTypes"
            value-key="value"
            class="w-full"
          />
        </UFormField>
      </div>

      <UFormField label="Message" name="message" required>
        <UTextarea
          v-model="form.message"
          color="primary"
          :rows="5"
          placeholder="Tell us about your real estate needs..."
          :ui="{ base: 'resize-none' }"
          class="w-full"
        />
      </UFormField>

      <UButton
        type="submit"
        :loading="loading"
        :disabled="loading"
        label="Send Message"
        icon="i-lucide-send"
        color="primary"
        size="lg"
      />
    </UForm>

    <div
      v-else
      class="text-center py-16 px-6 rounded-xl border border-default bg-elevated/50"
    >
      <div class="text-5xl mb-4 text-primary">&#10003;</div>
      <h3 class="text-xl font-semibold">Message Sent!</h3>
      <p class="text-muted mt-2 max-w-md mx-auto">
        Thank you for reaching out. One of our luxury property advisors will contact you within 24 hours.
      </p>
      <UButton
        class="mt-6"
        color="neutral"
        variant="outline"
        label="Send Another Message"
        @click="resetForm"
      />
    </div>
  </div>
</template>
