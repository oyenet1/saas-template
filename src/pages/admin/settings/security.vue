<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const store = useSettingsStore()
const { fetchSettings, updateSecurity } = useSettings()

// ── Form State ─────────────────────────────────────────
const isDirty = ref(false)
let initialSnapshot = ''
const showRevokeModal = ref(false)
const sessionToRevoke = ref<string | null>(null)

const form = reactive({
  twoFactorEnabled: false,
  twoFactorMethod: 'app' as 'app' | 'sms' | 'email',
  sessionTimeout: 30,
  passwordMinLength: 8,
  requireSpecialChars: true,
  loginNotifications: true,
})

function takeSnapshot() {
  initialSnapshot = JSON.stringify({ ...form })
  isDirty.value = false
}

function checkDirty() {
  isDirty.value = JSON.stringify({ ...form }) !== initialSnapshot
}

// ── Watchers ───────────────────────────────────────────

watch(
  () => store.security,
  (security) => {
    if (security) {
      Object.assign(form, {
        twoFactorEnabled: security.twoFactorEnabled,
        twoFactorMethod: security.twoFactorMethod,
        sessionTimeout: security.sessionTimeout,
        passwordMinLength: security.passwordMinLength,
        requireSpecialChars: security.requireSpecialChars,
        loginNotifications: security.loginNotifications,
      })
      nextTick(() => takeSnapshot())
    }
  },
  { immediate: true },
)

watch(form, () => { checkDirty() }, { deep: true })

// ── Actions ────────────────────────────────────────────

async function handleSave() {
  await updateSecurity({ ...form })
  takeSnapshot()
}

function confirmRevoke(sessionId: string) {
  sessionToRevoke.value = sessionId
  showRevokeModal.value = true
}

async function handleRevokeSession() {
  if (!sessionToRevoke.value) return
  await store.revokeSession(sessionToRevoke.value)
  showRevokeModal.value = false
  sessionToRevoke.value = null
  isDirty.value = true
}

function cancelRevoke() {
  showRevokeModal.value = false
  sessionToRevoke.value = null
}

// ── Lifecycle ──────────────────────────────────────────

onMounted(async () => {
  if (!store.security) {
    await fetchSettings()
  }
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Security</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your account security and authentication settings.
        </p>
      </div>
      <UButton
        v-if="isDirty"
        color="primary"
        :loading="store.saving"
        @click="handleSave"
      >
        Save Changes
      </UButton>
    </div>

    <!-- Loading -->
    <div v-if="store.loading" class="flex justify-center py-20">
      <UIcon name="i-heroicons-arrow-path" class="size-8 animate-spin text-gray-400" />
    </div>

    <template v-else-if="store.security">
      <div class="space-y-6">
        <!-- Two-Factor Authentication -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-shield-check" class="size-5 text-gray-400" />
              <span class="font-medium">Two-Factor Authentication</span>
            </div>
          </template>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium text-gray-900 dark:text-white">Enable 2FA</p>
                <p class="text-sm text-gray-500">Add an extra layer of security to your account.</p>
              </div>
              <UToggle v-model="form.twoFactorEnabled" />
            </div>
            <div v-if="form.twoFactorEnabled" class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
              <UFormGroup label="Authentication Method" class="mb-0">
                <URadioGroup
                  v-model="form.twoFactorMethod"
                  :items="[
                    { label: 'Authenticator App', value: 'app' },
                    { label: 'SMS', value: 'sms' },
                    { label: 'Email', value: 'email' },
                  ]"
                />
              </UFormGroup>
            </div>
          </div>
        </UCard>

        <!-- Password Policy -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-key" class="size-5 text-gray-400" />
              <span class="font-medium">Password Policy</span>
            </div>
          </template>
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <UFormGroup label="Minimum Password Length">
              <USelect
                v-model="form.passwordMinLength"
                :items="[6, 8, 10, 12, 16].map(n => ({ label: `${n} characters`, value: n }))"
              />
            </UFormGroup>
            <UFormGroup label="Session Timeout (minutes)">
              <USelect
                v-model="form.sessionTimeout"
                :items="[15, 30, 60, 120, 240].map(n => ({ label: `${n} minutes`, value: n }))"
              />
            </UFormGroup>
            <UFormGroup label="Require Special Characters">
              <UToggle v-model="form.requireSpecialChars" />
            </UFormGroup>
            <UFormGroup label="Login Notifications">
              <div class="flex items-center justify-between">
                <p class="text-sm text-gray-500">Email me when a new device logs in</p>
                <UToggle v-model="form.loginNotifications" />
              </div>
            </UFormGroup>
          </div>
        </UCard>

        <!-- Active Sessions -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-computer-desktop" class="size-5 text-gray-400" />
              <span class="font-medium">Active Sessions</span>
            </div>
          </template>
          <ul class="divide-y divide-gray-200 dark:divide-gray-700">
            <li
              v-for="session in store.security.activeSessions"
              :key="session.id"
              class="flex items-center justify-between py-3"
            >
              <div class="flex items-start gap-3">
                <UIcon name="i-heroicons-device-phone-mobile" class="mt-0.5 size-5 text-gray-400" />
                <div>
                  <div class="flex items-center gap-2">
                    <p class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ session.device }}
                    </p>
                    <UBadge v-if="session.isCurrent" color="success" variant="subtle" size="xs">Current</UBadge>
                  </div>
                  <p class="text-xs text-gray-500">
                    {{ session.browser }} · {{ session.location }}
                  </p>
                  <p class="text-xs text-gray-400">
                    IP: {{ session.ip }} · Last active: {{ session.lastActive }}
                  </p>
                </div>
              </div>
              <UButton
                v-if="!session.isCurrent"
                color="error"
                variant="ghost"
                size="xs"
                @click="confirmRevoke(session.id)"
              >
                Revoke
              </UButton>
            </li>
          </ul>
        </UCard>

        <!-- Audit Log -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-clipboard-document-list" class="size-5 text-gray-400" />
              <span class="font-medium">Recent Security Activity</span>
            </div>
          </template>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th class="pb-2 text-left font-medium text-gray-500">Action</th>
                  <th class="pb-2 text-left font-medium text-gray-500">Date & Time</th>
                  <th class="pb-2 text-left font-medium text-gray-500">IP Address</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="entry in store.security.auditLog"
                  :key="entry.id"
                  class="border-b border-gray-100 dark:border-gray-800"
                >
                  <td class="py-2 text-gray-900 dark:text-white">{{ entry.action }}</td>
                  <td class="py-2 text-gray-500">{{ entry.timestamp }}</td>
                  <td class="py-2 font-mono text-xs text-gray-400">{{ entry.ip }}</td>
                </tr>
              </tbody>
            </table>
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
            Save Changes
          </UButton>
        </div>
      </div>
    </template>

    <!-- Empty state -->
    <div v-else class="flex flex-col items-center justify-center py-20">
      <UIcon name="i-heroicons-exclamation-triangle" class="size-12 text-gray-300" />
      <p class="mt-4 text-sm text-gray-500">Unable to load security settings.</p>
      <UButton color="primary" variant="subtle" size="sm" class="mt-4" @click="fetchSettings()">
        Retry
      </UButton>
    </div>

    <!-- Revoke Session Confirmation -->
    <UModal v-model="showRevokeModal">
      <div class="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700 sm:p-6">
        <span class="text-lg font-medium">Revoke Session</span>
        <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark" @click="cancelRevoke" />
      </div>
      <div class="p-4 sm:p-6">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Are you sure you want to revoke this session? The device will be signed out immediately.
        </p>
      </div>
      <div class="flex justify-end gap-3 border-t border-gray-200 p-4 dark:border-gray-700 sm:p-6">
        <UButton color="neutral" variant="subtle" @click="cancelRevoke">Cancel</UButton>
        <UButton color="error" @click="handleRevokeSession">
          Revoke Session
        </UButton>
      </div>
    </UModal>
  </div>
</template>
