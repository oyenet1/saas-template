<script setup lang="ts">
const form = reactive({
  firstName: 'Alexander',
  lastName: 'Voss',
  email: 'alex@example.com',
  phone: '+1 (310) 555-0100',
  emailNotifications: true,
  propertyAlerts: false,
  newsletter: true,
})

const loading = ref(false)
const toast = useToast()

async function onSubmit() {
  loading.value = true
  await new Promise((r) => setTimeout(r, 600))
  loading.value = false
  toast.add({
    title: 'Profile updated',
    description: 'Your changes have been saved.',
    color: 'success',
    icon: 'i-lucide-check-circle-2',
  })
}

function onCancel() {
  form.firstName = 'Alexander'
  form.lastName = 'Voss'
  form.email = 'alex@example.com'
  form.phone = '+1 (310) 555-0100'
}
</script>

<template>
  <div class="space-y-6">
    <div class="surface-card p-6">
      <h2 class="font-semibold mb-5">Personal Information</h2>
      <UForm :state="form" class="space-y-4 max-w-xl" @submit="onSubmit">
        <div class="flex items-center gap-6 mb-6">
          <div class="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">AV</div>
          <div>
            <p class="font-medium">Alexander Voss</p>
            <p class="text-xs text-muted">Member since March 2025</p>
            <UButton to="#" variant="link" color="primary" size="xl" label="Change photo" class="mt-1 p-0" />
          </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField label="First Name" name="firstName">
            <UInput v-model="form.firstName" size="xl" class="w-full" />
          </UFormField>
          <UFormField label="Last Name" name="lastName">
            <UInput v-model="form.lastName" size="xl" class="w-full" />
          </UFormField>
        </div>
        <UFormField label="Email" name="email">
          <UInput v-model="form.email" type="email" size="xl" class="w-full" />
        </UFormField>
        <UFormField label="Phone" name="phone">
          <UInput v-model="form.phone" type="tel" size="xl" class="w-full" />
        </UFormField>
        <div class="flex gap-3 pt-2">
          <UButton
            type="submit"
            size="xl"
            color="primary"
            label="Save Changes"
            icon="i-lucide-save"
            :loading="loading"
            :disabled="loading"
          />
          <UButton
            type="button"
            size="xl"
            color="neutral"
            variant="outline"
            label="Cancel"
            @click="onCancel"
          />
        </div>
      </UForm>
    </div>

    <div class="surface-card p-6">
      <h2 class="font-semibold mb-5">Preferences</h2>
      <div class="space-y-4 max-w-xl">
        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="text-sm font-medium">Email Notifications</p>
            <p class="text-xs text-muted">Receive updates about new properties and inquiries</p>
          </div>
          <USwitch v-model="form.emailNotifications" color="primary" />
        </div>
        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="text-sm font-medium">Property Alerts</p>
            <p class="text-xs text-muted">Get notified when new listings match your preferences</p>
          </div>
          <USwitch v-model="form.propertyAlerts" color="primary" />
        </div>
        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="text-sm font-medium">Newsletter</p>
            <p class="text-xs text-muted">Monthly market insights and luxury property highlights</p>
          </div>
          <USwitch v-model="form.newsletter" color="primary" />
        </div>
      </div>
    </div>
  </div>
</template>
