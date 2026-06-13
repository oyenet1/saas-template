<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const store = useSettingsStore()
const { fetchSettings, updateProfile } = useSettings()
const fileUploads = useFormFileUpload()

// ── Form State ─────────────────────────────────────────
const isDirty = ref(false)
const formRef = ref<any>(null)
let initialSnapshot = ''

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  jobTitle: '',
  department: '',
  language: 'en',
})

function takeSnapshot() {
  initialSnapshot = JSON.stringify({ ...form })
  isDirty.value = false
}

function checkDirty() {
  isDirty.value = JSON.stringify({ ...form }) !== initialSnapshot
}

const languages = [
  { label: 'English', value: 'en' },
  { label: 'French', value: 'fr' },
  { label: 'Spanish', value: 'es' },
  { label: 'Arabic', value: 'ar' },
  { label: 'Portuguese', value: 'pt' },
  { label: 'Swahili', value: 'sw' },
]

// ── Watchers ───────────────────────────────────────────

watch(
  () => store.profile,
  (profile) => {
    if (profile) {
      Object.assign(form, {
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        phone: profile.phone,
        jobTitle: profile.jobTitle,
        department: profile.department,
        language: profile.language,
      })
      nextTick(() => takeSnapshot())
    }
  },
  { immediate: true },
)

watch(form, () => { checkDirty() }, { deep: true })

// ── Actions ────────────────────────────────────────────

async function handleSubmit() {
  // ✅ Validate the form first — files are NOT uploaded if invalid
  if (formRef.value) {
    const { valid } = await formRef.value.validate().catch(() => ({ valid: false }))
    if (!valid) return
  }

  // ✅ Form passed — now safe to upload the avatar (if any)
  let urls: { avatar?: string } = {}
  if (fileUploads.hasFiles) {
    try {
      urls = await fileUploads.commitAll()
    } catch {
      return
    }
  }

  await updateProfile({
    ...form,
    ...(urls.avatar ? { avatar: urls.avatar } : {}),
  })
  fileUploads.clear()
  takeSnapshot()
}

async function handleAvatarUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !store.profile) return
  try {
    await fileUploads.add('avatar', file, { folder: 'avatars' })
  } catch {
    // Validation error already toasted
  } finally {
    input.value = ''
  }
}

// ── Lifecycle ──────────────────────────────────────────

onMounted(async () => {
  if (!store.profile) {
    await fetchSettings()
  }
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Profile</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your personal information and preferences.
        </p>
      </div>
      <UButton
        v-if="isDirty"
        color="primary"
        :loading="store.saving"
        @click="handleSubmit"
      >
        Save Changes
      </UButton>
    </div>

    <!-- Loading -->
    <div v-if="store.loading" class="flex justify-center py-20">
      <UIcon name="i-heroicons-arrow-path" class="size-8 animate-spin text-gray-400" />
    </div>

    <template v-else-if="store.profile">
      <UForm ref="formRef" :state="form" class="space-y-6">
        <!-- Avatar -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-user-circle" class="size-5 text-gray-400" />
              <span class="font-medium">Avatar</span>
            </div>
          </template>
          <div class="flex items-center gap-6">
            <UAvatar
              :src="fileUploads.get('avatar')?.publicUrl || store.profile.avatar || undefined"
              :alt="`${store.profile.firstName} ${store.profile.lastName}`"
              size="xl"
            />
            <div class="flex flex-col gap-2">
              <label class="cursor-pointer">
                <UButton
                  color="neutral"
                  variant="subtle"
                  size="sm"
                  as="span"
                  :loading="fileUploads.get('avatar')?.status === 'uploading'"
                  :disabled="fileUploads.uploading.value"
                >
                  {{ fileUploads.get('avatar') ? 'Choose another' : 'Upload Photo' }}
                </UButton>
                <input
                  type="file"
                  accept="image/*"
                  class="hidden"
                  :disabled="fileUploads.uploading.value"
                  @change="handleAvatarUpload"
                />
              </label>
              <p
                v-if="fileUploads.get('avatar')?.status === 'error'"
                class="text-xs text-error"
              >
                {{ fileUploads.get('avatar')?.error }}
              </p>
              <p
                v-else-if="fileUploads.get('avatar')?.status === 'uploaded'"
                class="text-xs text-success"
              >
                Ready — click Save Changes below to upload.
              </p>
              <p v-else class="text-xs text-gray-500">PNG or JPG. 256x256px recommended.</p>
            </div>
          </div>
        </UCard>

        <!-- Personal Info -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-identification" class="size-5 text-gray-400" />
              <span class="font-medium">Personal Information</span>
            </div>
          </template>
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <UFormGroup label="First Name" required>
              <UInput v-model="form.firstName" placeholder="First name" />
            </UFormGroup>
            <UFormGroup label="Last Name" required>
              <UInput v-model="form.lastName" placeholder="Last name" />
            </UFormGroup>
            <UFormGroup label="Email Address" required>
              <UInput v-model="form.email" type="email" placeholder="email@example.com" disabled />
            </UFormGroup>
            <UFormGroup label="Phone Number">
              <UInput v-model="form.phone" placeholder="+234 800 123 4567" />
            </UFormGroup>
            <UFormGroup label="Job Title">
              <UInput v-model="form.jobTitle" placeholder="e.g. General Manager" />
            </UFormGroup>
            <UFormGroup label="Department">
              <UInput v-model="form.department" placeholder="e.g. Management" />
            </UFormGroup>
            <UFormGroup label="Language">
              <USelect v-model="form.language" :items="languages" />
            </UFormGroup>
          </div>
        </UCard>

        <!-- Save footer for mobile -->
        <div class="flex justify-end md:hidden">
          <UButton
            v-if="isDirty"
            color="primary"
            size="lg"
            :loading="store.saving"
            @click="handleSubmit"
          >
            Save Changes
          </UButton>
        </div>
      </UForm>
    </template>

    <!-- Empty state -->
    <div v-else class="flex flex-col items-center justify-center py-20">
      <UIcon name="i-heroicons-exclamation-triangle" class="size-12 text-gray-300" />
      <p class="mt-4 text-sm text-gray-500">Unable to load profile.</p>
      <UButton color="primary" variant="subtle" size="sm" class="mt-4" @click="fetchSettings()">
        Retry
      </UButton>
    </div>
  </div>
</template>
