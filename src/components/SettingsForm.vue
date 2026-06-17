<script setup lang="ts">
const state = reactive({
  emailAlerts: true,
  smsAlerts: false,
  weeklyDigest: true,
  profileVisibility: true,
  activityStatus: false,
})
</script>

<template>
  <div class="space-y-6 max-w-2xl">
    <div class="surface-card p-6">
      <h2 class="font-semibold mb-4">Notification Settings</h2>
      <div class="space-y-4">
        <div class="flex items-center justify-between gap-4">
          <div><p class="text-sm font-medium">Email Alerts</p><p class="text-xs text-muted">New property notifications</p></div>
          <USwitch v-model="state.emailAlerts" color="primary" />
        </div>
        <div class="flex items-center justify-between gap-4">
          <div><p class="text-sm font-medium">SMS Alerts</p><p class="text-xs text-muted">Price drop and offer updates</p></div>
          <USwitch v-model="state.smsAlerts" color="primary" />
        </div>
        <div class="flex items-center justify-between gap-4">
          <div><p class="text-sm font-medium">Weekly Digest</p><p class="text-xs text-muted">Weekly market insights email</p></div>
          <USwitch v-model="state.weeklyDigest" color="primary" />
        </div>
      </div>
    </div>

    <div class="surface-card p-6">
      <h2 class="font-semibold mb-4">Privacy</h2>
      <div class="space-y-4">
        <div class="flex items-center justify-between gap-4">
          <div><p class="text-sm font-medium">Profile Visibility</p><p class="text-xs text-muted">Show my profile to agents</p></div>
          <USwitch v-model="state.profileVisibility" color="primary" />
        </div>
        <div class="flex items-center justify-between gap-4">
          <div><p class="text-sm font-medium">Activity Status</p><p class="text-xs text-muted">Show when I'm active</p></div>
          <USwitch v-model="state.activityStatus" color="primary" />
        </div>
      </div>
    </div>

    <div class="surface-card p-6">
      <h2 class="font-semibold mb-4">Account</h2>
      <div class="space-y-3">
        <UButton to="#" color="neutral" variant="outline" label="Change Password" icon="i-lucide-key" block class="justify-start" />
        <UButton to="#" color="neutral" variant="outline" label="Download My Data" icon="i-lucide-download" block class="justify-start" />
        <UButton to="#" color="error" variant="outline" label="Delete Account" icon="i-lucide-trash-2" block class="justify-start" />
      </div>
    </div>
  </div>
</template>
