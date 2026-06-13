<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const store = useSettingsStore()
const { fetchSettings, updateNotificationPreferences } = useSettings()

// ── Form State ─────────────────────────────────────────
const isDirty = ref(false)
let initialSnapshot = ''

const quietHours = reactive({
  enabled: false,
  start: '22:00',
  end: '07:00',
})

const emailDigest = ref<'none' | 'daily' | 'weekly'>('daily')

function takeSnapshot() {
  initialSnapshot = JSON.stringify({ quietHours: { ...quietHours }, emailDigest: emailDigest.value })
  isDirty.value = false
}

function checkDirty() {
  const now = JSON.stringify({ quietHours: { ...quietHours }, emailDigest: emailDigest.value })
  isDirty.value = now !== initialSnapshot
}

// ── Watchers ───────────────────────────────────────────

watch(
  () => store.notifications,
  (settings) => {
    if (settings) {
      quietHours.enabled = settings.quietHours.enabled
      quietHours.start = settings.quietHours.start
      quietHours.end = settings.quietHours.end
      emailDigest.value = settings.emailDigest
      nextTick(() => takeSnapshot())
    }
  },
  { immediate: true },
)

watch([quietHours, emailDigest], () => { checkDirty() }, { deep: true })

// ── Actions ────────────────────────────────────────────

function toggleChannel(id: string, field: 'email' | 'inApp' | 'push', value: boolean) {
  store.updateChannel(id, { [field]: value })
  isDirty.value = true
}

async function handleSave() {
  await updateNotificationPreferences({
    quietHours: { ...quietHours },
    emailDigest: emailDigest.value,
  })
  takeSnapshot()
}

// ── Lifecycle ──────────────────────────────────────────

onMounted(async () => {
  if (!store.notifications) {
    await fetchSettings()
  }
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Notifications</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Configure how and when you receive notifications.
        </p>
      </div>
      <UButton
        v-if="isDirty"
        color="primary"
        :loading="store.saving"
        @click="handleSave"
      >
        Save Preferences
      </UButton>
    </div>

    <!-- Loading -->
    <div v-if="store.loading" class="flex justify-center py-20">
      <UIcon name="i-heroicons-arrow-path" class="size-8 animate-spin text-gray-400" />
    </div>

    <template v-else-if="store.notifications">
      <div class="space-y-6">
        <!-- Notification Channels -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-bell-alert" class="size-5 text-gray-400" />
              <span class="font-medium">Notification Channels</span>
            </div>
          </template>

          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th class="pb-3 text-left font-medium text-gray-500">Event</th>
                  <th class="pb-3 text-center font-medium text-gray-500">
                    <span class="hidden sm:inline">Email</span>
                    <UIcon name="i-heroicons-envelope" class="sm:hidden" />
                  </th>
                  <th class="pb-3 text-center font-medium text-gray-500">
                    <span class="hidden sm:inline">In-App</span>
                    <UIcon name="i-heroicons-bell" class="sm:hidden" />
                  </th>
                  <th class="pb-3 text-center font-medium text-gray-500">
                    <span class="hidden sm:inline">Push</span>
                    <UIcon name="i-heroicons-device-phone-mobile" class="sm:hidden" />
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="channel in store.notifications.channels"
                  :key="channel.id"
                  class="border-b border-gray-100 dark:border-gray-800"
                >
                  <td class="py-3 text-gray-900 dark:text-white">{{ channel.label }}</td>
                  <td class="py-3 text-center">
                    <UCheckbox
                      :model-value="channel.email"
                      @update:model-value="(v: any) => toggleChannel(channel.id, 'email', Boolean(v))"
                    />
                  </td>
                  <td class="py-3 text-center">
                    <UCheckbox
                      :model-value="channel.inApp"
                      @update:model-value="(v: any) => toggleChannel(channel.id, 'inApp', Boolean(v))"
                    />
                  </td>
                  <td class="py-3 text-center">
                    <UCheckbox
                      :model-value="channel.push"
                      @update:model-value="(v: any) => toggleChannel(channel.id, 'push', Boolean(v))"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </UCard>

        <!-- Quiet Hours -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-moon" class="size-5 text-gray-400" />
              <span class="font-medium">Quiet Hours</span>
            </div>
          </template>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium text-gray-900 dark:text-white">Enable Quiet Hours</p>
                <p class="text-sm text-gray-500">Suppress non-urgent notifications during specified hours.</p>
              </div>
              <UToggle v-model="quietHours.enabled" />
            </div>
            <div v-if="quietHours.enabled" class="grid grid-cols-2 gap-4">
              <UFormGroup label="Start Time">
                <UInput v-model="quietHours.start" type="time" />
              </UFormGroup>
              <UFormGroup label="End Time">
                <UInput v-model="quietHours.end" type="time" />
              </UFormGroup>
            </div>
          </div>
        </UCard>

        <!-- Email Digest -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-inbox-arrow-down" class="size-5 text-gray-400" />
              <span class="font-medium">Email Digest</span>
            </div>
          </template>
          <div class="space-y-4">
            <p class="text-sm text-gray-500">
              Receive a summary of activity and notifications via email.
            </p>
            <URadioGroup
              v-model="emailDigest"
              :items="[
                { label: 'No digest', value: 'none' },
                { label: 'Daily digest', value: 'daily' },
                { label: 'Weekly digest', value: 'weekly' },
              ]"
            />
          </div>
        </UCard>

        <!-- Save footer for mobile -->
        <div class="flex justify-end md:hidden">
          <UButton
            v-if="isDirty"
            color="primary"
            size="lg"
            :loading="store.saving"
            @click="handleSave"
          >
            Save Preferences
          </UButton>
        </div>
      </div>
    </template>

    <!-- Empty state -->
    <div v-else class="flex flex-col items-center justify-center py-20">
      <UIcon name="i-heroicons-exclamation-triangle" class="size-12 text-gray-300" />
      <p class="mt-4 text-sm text-gray-500">Unable to load notification settings.</p>
      <UButton color="primary" variant="subtle" size="sm" class="mt-4" @click="fetchSettings()">
        Retry
      </UButton>
    </div>
  </div>
</template>
