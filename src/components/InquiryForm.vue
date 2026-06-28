<script setup lang="ts">
interface Props {
  propertyTitle: string
}

const props = defineProps<Props>()

const form = reactive({
  name: '',
  email: '',
  phone: '',
  message: '',
})

const submitted = ref(false)
const loading = ref(false)
const toast = useToast()

async function onSubmit() {
  loading.value = true
  await new Promise((r) => setTimeout(r, 800))
  loading.value = false
  submitted.value = true
  toast.add({
    title: 'Inquiry sent',
    description: `Our team will contact you about ${props.propertyTitle}.`,
    color: 'success',
    icon: 'i-lucide-check-circle-2',
  })
}

function reset() {
  submitted.value = false
  form.name = ''
  form.email = ''
  form.phone = ''
  form.message = ''
}
</script>

<template>
  <UForm
    v-if="!submitted"
    :state="form"
    class="space-y-3"
    @submit="onSubmit"
  >
    <UFormField name="name" required>
      <UInput
        v-model="form.name"
        placeholder="Your Name"
        autocomplete="name"
        size="xl"
        class="w-full"
      />
    </UFormField>
    <UFormField name="email" required>
      <UInput
        v-model="form.email"
        type="email"
        placeholder="Your Email"
        autocomplete="email"
        size="xl"
        class="w-full"
      />
    </UFormField>
    <UFormField name="phone">
      <UInput
        v-model="form.phone"
        type="tel"
        placeholder="Phone Number"
        autocomplete="tel"
        size="xl"
        class="w-full"
      />
    </UFormField>
    <UFormField name="message">
      <UTextarea
        v-model="form.message"
        :rows="3"
        :placeholder="`I'm interested in ${propertyTitle}...`"
        :ui="{ base: 'resize-none' }"
        size="xl"
        class="w-full"
      />
    </UFormField>
    <UButton
      type="submit"
      color="primary"
      :loading="loading"
      :disabled="loading"
      label="Send Inquiry"
      icon="i-lucide-send"
      size="xl"
      block
      class="justify-center"
    />
  </UForm>

  <div v-else class="text-center py-8">
    <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-3">
      <UIcon name="i-lucide-check" class="w-6 h-6" />
    </div>
    <h3 class="font-semibold">Inquiry sent</h3>
    <p class="text-sm text-muted mt-1">Our team will reach out shortly.</p>
      <UButton
        class="mt-4"
        size="xl"
        color="neutral"
        variant="outline"
        label="Send another"
        @click="reset"
      />
  </div>
</template>
