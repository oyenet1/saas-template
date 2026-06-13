<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const store = useSettingsStore()
const toast = useToast()
const { fetchSettings, updateHotelSettings } = useSettings()
const fileUploads = useFormFileUpload()

// ── Settings sub-navigation (matches the rest of the app) ──────────────
const settingsNav = [
  { label: 'General', to: '/admin/settings', icon: 'i-heroicons-building-office-2' },
  { label: 'Profile', to: '/admin/settings/profile', icon: 'i-heroicons-user-circle' },
  { label: 'Billing', to: '/admin/settings/billing', icon: 'i-heroicons-credit-card' },
  { label: 'Notifications', to: '/admin/settings/notifications', icon: 'i-heroicons-bell' },
  { label: 'Security', to: '/admin/settings/security', icon: 'i-heroicons-shield-check' },
]

// ── Form State ─────────────────────────────────────────────────────────
const formRef = ref<any>(null)
const isDirty = ref(false)

// ── Form-aware file uploads (two-step pattern) ──────────────────────
// Files are prepared (validated + signed) when picked, but only
// actually uploaded AFTER form validation passes inside the submit
// handler. This means a form with a missing required field won't
// waste a 15 MB upload.
async function handleHeroUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    await fileUploads.add('hero', file, { folder: 'hotels/hero' })
  } catch {
    // Validation error already toasted by useR2Upload
  } finally {
    input.value = ''
  }
}

async function handleLogoUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    await fileUploads.add('logo', file, { folder: 'hotels/logos' })
  } catch {
    // Validation error already toasted by useR2Upload
  } finally {
    input.value = ''
  }
}

const form = reactive({
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  country: '',
  zipCode: '',
  description: '',
  checkOutTime: '11:00',
  serviceCharge: 0,
  refundSurcharge: 0,
  vatEnabled: true,
  primaryColor: '#0F766E',
  secondaryColor: '#C89B3C',
})

let initialSnapshot = ''

function takeSnapshot() {
  initialSnapshot = JSON.stringify({ ...form })
  isDirty.value = false
}

function checkDirty() {
  isDirty.value = JSON.stringify({ ...form }) !== initialSnapshot
}

// ── Select options ─────────────────────────────────────────────────────

const countries = [
  { label: 'United Kingdom', value: 'United Kingdom' },
  { label: 'United States', value: 'United States' },
  { label: 'France', value: 'France' },
  { label: 'Germany', value: 'Germany' },
  { label: 'Nigeria', value: 'Nigeria' },
  { label: 'South Africa', value: 'South Africa' },
  { label: 'United Arab Emirates', value: 'United Arab Emirates' },
  { label: 'Canada', value: 'Canada' },
]

// ── Watchers ───────────────────────────────────────────────────────────

watch(
  () => store.hotel,
  (hotel) => {
    if (hotel) {
      Object.assign(form, {
        name: hotel.name,
        email: hotel.email,
        phone: hotel.phone,
        address: hotel.address,
        city: hotel.city,
        state: hotel.state ?? '',
        country: hotel.country,
        zipCode: hotel.zipCode ?? '',
        description: hotel.description ?? '',
        checkOutTime: hotel.checkOutTime ?? '11:00',
        serviceCharge: hotel.serviceCharge ?? 0,
        refundSurcharge: hotel.refundSurcharge ?? 0,
        vatEnabled: hotel.vatEnabled ?? true,
        primaryColor: hotel.primaryColor ?? '#0F766E',
        secondaryColor: hotel.secondaryColor ?? '#C89B3C',
      })
      nextTick(() => takeSnapshot())
    }
  },
  { immediate: true },
)

watch(form, () => { checkDirty() }, { deep: true })

// ── Actions ────────────────────────────────────────────────────────────

async function handleSubmit() {
  if (!formRef.value) return
  const { valid } = await formRef.value.validate().catch(() => ({ valid: false }))
  if (!valid) return

  // ✅ Form validation passed — now safe to upload the files.
  // If the form had errors, we'd have returned above and these
  // uploads would never fire, so the user never wastes bandwidth.
  let urls: { hero?: string; logo?: string } = {}
  try {
    urls = await fileUploads.commitAll()
  } catch {
    // commitAll already toasted the per-file error
    return
  }

  await updateHotelSettings({
    ...form,
    // Only send URLs the user actually replaced this session
    ...(urls.hero ? { heroImage: urls.hero } : {}),
    ...(urls.logo ? { logo: urls.logo } : {}),
  })
  fileUploads.clear()
  takeSnapshot()
}

function discardChanges() {
  if (!store.hotel) return
  Object.assign(form, {
    name: store.hotel.name,
    email: store.hotel.email,
    phone: store.hotel.phone,
    address: store.hotel.address,
    city: store.hotel.city,
    state: store.hotel.state ?? '',
    country: store.hotel.country,
    zipCode: store.hotel.zipCode ?? '',
    description: store.hotel.description ?? '',
    checkOutTime: store.hotel.checkOutTime ?? '11:00',
    serviceCharge: store.hotel.serviceCharge ?? 0,
    refundSurcharge: store.hotel.refundSurcharge ?? 0,
    vatEnabled: store.hotel.vatEnabled ?? true,
    primaryColor: store.hotel.primaryColor ?? '#0F766E',
    secondaryColor: store.hotel.secondaryColor ?? '#C89B3C',
  })
  takeSnapshot()
  toast.add({
    title: 'Changes discarded',
    description: 'Your edits were reverted to the last saved version.',
    color: 'neutral',
    icon: 'i-heroicons-arrow-uturn-left',
  })
}

// ── Lifecycle ──────────────────────────────────────────────────────────

onMounted(async () => {
  if (!store.hotel) {
    await fetchSettings()
  }
})
</script>

<template>
  <div class="space-y-6">
    <!-- ── Hero header ───────────────────────────────────────────── -->
    <header class="relative overflow-hidden rounded-2xl border border-default bg-gradient-to-br from-elevated/60 via-elevated/30 to-transparent p-6 sm:p-8">
      <div class="absolute inset-y-0 right-0 hidden w-1/3 bg-gradient-to-l from-primary/10 to-transparent lg:block" />
      <div class="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div class="space-y-2">
          <div class="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-primary">
            <span class="inline-block size-1.5 rounded-full bg-primary" />
            Property Settings
          </div>
          <h1 class="font-headline text-3xl font-bold tracking-tight text-highlighted sm:text-4xl">
            Identity & Operations
          </h1>
          <p class="max-w-2xl text-sm text-muted sm:text-[15px]">
            Configure your hotel's identity, location and operational rules. Changes apply to bookings, invoices and the public storefront.
          </p>
        </div>

        <div v-if="isDirty" class="flex items-center gap-2">
          <UButton
            color="neutral"
            variant="ghost"
            :disabled="store.saving"
            @click="discardChanges"
          >
            Discard
          </UButton>
          <UButton
            color="primary"
            icon="i-heroicons-check"
            :loading="store.saving"
            @click="handleSubmit"
          >
            Save Changes
          </UButton>
        </div>
      </div>

      <!-- Sub-nav strip -->
      <nav class="relative mt-6 -mx-1 flex items-center gap-1 overflow-x-auto pb-1">
        <NuxtLink
          v-for="item in settingsNav"
          :key="item.to"
          :to="item.to"
          class="group inline-flex shrink-0 items-center gap-2 rounded-lg border border-transparent px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-elevated/60 hover:text-highlighted"
          :class="[
            item.to === '/admin/settings'
              ? 'border-default bg-default text-highlighted shadow-sm'
              : '',
          ]"
        >
          <UIcon :name="item.icon" class="size-4 text-primary/80 group-hover:text-primary" />
          {{ item.label }}
        </NuxtLink>
      </nav>
    </header>

    <!-- ── Loading ────────────────────────────────────────────────── -->
    <div v-if="store.loading" class="flex flex-col items-center justify-center gap-3 py-24 text-muted">
      <UIcon name="i-heroicons-arrow-path" class="size-8 animate-spin" />
      <p class="text-sm">Loading your property settings…</p>
    </div>

    <!-- ── Content ────────────────────────────────────────────────── -->
    <UForm
      v-else-if="store.hotel"
      ref="formRef"
      :state="form"
      class="grid grid-cols-1 gap-6 lg:grid-cols-12"
    >
      <!-- LEFT COLUMN — General + Location -->
      <div class="space-y-6 lg:col-span-8">
        <!-- General Information -->
        <UCard
          :ui="{
            root: 'ring-1 ring-default/60 shadow-[0_8px_28px_-12px_rgba(15,23,42,0.08)]',
            body: 'p-6 sm:p-8',
            header: 'px-6 sm:px-8 pt-6 pb-3',
          }"
        >
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <UIcon name="i-heroicons-information-circle" class="size-5" />
                </div>
                <div>
                  <h3 class="font-headline text-lg font-semibold text-highlighted">General Information</h3>
                  <p class="text-xs text-muted">The name and contact details guests and partners will see.</p>
                </div>
              </div>
            </div>
          </template>

          <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
            <UFormField label="Hotel Name" name="name" required class="md:col-span-2">
              <UInput
                v-model="form.name"
                placeholder="e.g. Oakwood Manor"
                size="lg"
                :ui="{ base: 'w-full' }"
              />
            </UFormField>
            <UFormField label="Telephone" name="phone" required>
              <UInput
                v-model="form.phone"
                type="tel"
                placeholder="+1 (555) 012-3456"
                size="lg"
                :ui="{ base: 'w-full' }"
              />
            </UFormField>
            <UFormField label="Email Address" name="email" required>
              <UInput
                v-model="form.email"
                type="email"
                placeholder="concierge@oakwoodmanor.com"
                size="lg"
                :ui="{ base: 'w-full' }"
              />
            </UFormField>
            <UFormField label="Description" name="description" class="md:col-span-2" :ui="{ container: 'w-full' }">
              <UTextarea
                v-model="form.description"
                placeholder="A historic 17th-century country manor offering quiet luxury…"
                :rows="3"
                autoresize
                :ui="{ base: 'w-full' }"
              />
            </UFormField>
          </div>
        </UCard>

        <!-- Location -->
        <UCard
          :ui="{
            root: 'ring-1 ring-default/60 shadow-[0_8px_28px_-12px_rgba(15,23,42,0.08)]',
            body: 'p-6 sm:p-8',
            header: 'px-6 sm:px-8 pt-6 pb-3',
          }"
        >
          <template #header>
            <div class="flex items-center gap-3">
              <div class="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <UIcon name="i-heroicons-map-pin" class="size-5" />
              </div>
              <div>
                <h3 class="font-headline text-lg font-semibold text-highlighted">Location</h3>
                <p class="text-xs text-muted">Used for check-in directions, tax calculation and public search.</p>
              </div>
            </div>
          </template>

          <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
            <UFormField label="Country" name="country" required>
              <USelect
                v-model="form.country"
                :items="countries"
                size="lg"
                :ui="{ base: 'w-full' }"
              />
            </UFormField>
            <UFormField label="State / Province" name="state">
              <UInput
                v-model="form.state"
                placeholder="Cotswolds"
                size="lg"
                :ui="{ base: 'w-full' }"
              />
            </UFormField>
            <UFormField label="City / Town" name="city" required>
              <UInput
                v-model="form.city"
                placeholder="Bibury"
                size="lg"
                :ui="{ base: 'w-full' }"
              />
            </UFormField>
            <UFormField label="Zip / Postal Code" name="zipCode">
              <UInput
                v-model="form.zipCode"
                placeholder="GL7 5NW"
                size="lg"
                :ui="{ base: 'w-full' }"
              />
            </UFormField>
            <UFormField label="Full Address" name="address" class="md:col-span-2">
              <UTextarea
                v-model="form.address"
                placeholder="Street, building, neighborhood…"
                :rows="3"
                autoresize
                :ui="{ base: 'w-full' }"
              />
            </UFormField>
          </div>
        </UCard>
      </div>

      <!-- RIGHT COLUMN — Operational + Media -->
      <div class="space-y-6 lg:col-span-4">
        <!-- Operational -->
        <UCard
          :ui="{
            root: 'ring-1 ring-default/60 shadow-[0_8px_28px_-12px_rgba(15,23,42,0.08)]',
            body: 'p-6 sm:p-8',
            header: 'px-6 sm:px-8 pt-6 pb-3',
          }"
        >
          <template #header>
            <div class="flex items-center gap-3">
              <div class="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <UIcon name="i-heroicons-clock" class="size-5" />
              </div>
              <div>
                <h3 class="font-headline text-lg font-semibold text-highlighted">Operational</h3>
                <p class="text-xs text-muted">Daily rhythm and booking economics.</p>
              </div>
            </div>
          </template>

          <div class="space-y-5">
            <UFormField label="Check-out Time" name="checkOutTime">
              <UInput
                v-model="form.checkOutTime"
                type="time"
                size="lg"
                :ui="{ base: 'w-full' }"
              />
            </UFormField>

            <div class="grid grid-cols-2 gap-4">
              <UFormField label="Service Charge (%)" name="serviceCharge" :ui="{ container: 'w-full' }">
                <UInputNumber
                  v-model="form.serviceCharge"
                  :min="0"
                  :max="100"
                  :step="0.5"
                  :ui="{ base: 'w-full' }"
                />
              </UFormField>
              <UFormField label="Refund Surcharge (%)" name="refundSurcharge" :ui="{ container: 'w-full' }">
                <UInputNumber
                  v-model="form.refundSurcharge"
                  :min="0"
                  :max="100"
                  :step="0.5"
                  :ui="{ base: 'w-full' }"
                />
              </UFormField>
            </div>

            <div class="flex items-center justify-between rounded-xl border border-default/60 bg-elevated/40 px-4 py-3">
              <div>
                <p class="text-sm font-medium text-highlighted">Add VAT to room rate</p>
                <p class="text-xs text-muted">Applies to all new bookings.</p>
              </div>
              <USwitch v-model="form.vatEnabled" />
            </div>

            <div class="grid grid-cols-2 gap-4 pt-2">
              <UFormField label="Primary Color" name="primaryColor" :ui="{ container: 'w-full' }">
                <UColorPicker
                  v-model="form.primaryColor"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Accent Color" name="secondaryColor" :ui="{ container: 'w-full' }">
                <UColorPicker
                  v-model="form.secondaryColor"
                  class="w-full"
                />
              </UFormField>
            </div>
          </div>
        </UCard>

        <!-- Media Assets -->
        <UCard
          :ui="{
            root: 'ring-1 ring-default/60 shadow-[0_8px_28px_-12px_rgba(15,23,42,0.08)]',
            body: 'p-6 sm:p-8',
            header: 'px-6 sm:px-8 pt-6 pb-3',
          }"
        >
          <template #header>
            <div class="flex items-center gap-3">
              <div class="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <UIcon name="i-heroicons-photo" class="size-5" />
              </div>
              <div>
                <h3 class="font-headline text-lg font-semibold text-highlighted">Media Assets</h3>
                <p class="text-xs text-muted">Hero image and logo used across the storefront.</p>
              </div>
            </div>
          </template>

          <div class="space-y-6">
            <!-- Hero image -->
            <div>
              <p class="mb-2 text-xs font-semibold uppercase tracking-widest text-muted">Hotel Background Image</p>
              <label class="group relative block cursor-pointer overflow-hidden rounded-xl border border-default/60 bg-elevated/30">
                <input
                  type="file"
                  accept="image/*"
                  class="sr-only"
                  :disabled="fileUploads.pendingCount.value > 0"
                  @change="handleHeroUpload"
                />
                <div class="relative h-36 w-full">
                  <!-- Priority: pending upload preview > saved image > placeholder -->
                  <img
                    v-if="fileUploads.get('hero')?.publicUrl"
                    :src="fileUploads.get('hero')!.publicUrl"
                    :alt="`${form.name} hero (pending upload)`"
                    class="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <img
                    v-else-if="store.hotel.heroImage"
                    :src="store.hotel.heroImage"
                    :alt="`${form.name} hero`"
                    class="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div v-else class="grid size-full place-items-center text-muted">
                    <UIcon name="i-heroicons-photo" class="size-8" />
                  </div>

                  <div class="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/55 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <UIcon
                      v-if="fileUploads.get('hero')?.status !== 'uploading'"
                      name="i-heroicons-arrow-up-tray"
                      class="size-6"
                    />
                    <UIcon
                      v-else
                      name="i-heroicons-arrow-path"
                      class="size-6 animate-spin"
                    />
                    <span class="text-xs font-medium">
                      {{ fileUploads.get('hero')?.status === 'uploading'
                        ? 'Uploading…'
                        : fileUploads.get('hero')
                          ? 'Ready to save'
                          : 'Replace image' }}
                    </span>
                  </div>
                </div>
                <p
                  v-if="fileUploads.get('hero')?.status === 'error'"
                  class="mt-1 text-[11px] text-error"
                >
                  {{ fileUploads.get('hero')?.error }}
                </p>
              </label>
            </div>

            <!-- Logo -->
            <div>
              <p class="mb-2 text-xs font-semibold uppercase tracking-widest text-muted">Hotel Logo</p>
              <div class="flex items-center gap-4">
                <div class="grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl border-2 border-dashed border-default bg-elevated/30">
                  <img
                    v-if="fileUploads.get('logo')?.publicUrl"
                    :src="fileUploads.get('logo')!.publicUrl"
                    :alt="`${form.name} logo (pending upload)`"
                    class="size-12 object-contain"
                  />
                  <img
                    v-else-if="store.hotel.logo"
                    :src="store.hotel.logo"
                    :alt="`${form.name} logo`"
                    class="size-12 object-contain"
                  />
                  <UIcon v-else name="i-heroicons-photo" class="size-7 text-muted" />
                </div>

                <div class="min-w-0 flex-1 space-y-2">
                  <label class="inline-flex items-center gap-1.5 text-xs font-semibold text-primary transition-opacity hover:opacity-80 cursor-pointer">
                    <UIcon name="i-heroicons-pencil-square" class="size-3.5" />
                    <span>
                      {{ fileUploads.get('logo')?.status === 'uploading'
                        ? 'Uploading…'
                        : fileUploads.get('logo')
                          ? 'Ready to save'
                          : 'Change logo' }}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      class="sr-only"
                      :disabled="fileUploads.pendingCount.value > 0"
                      @change="handleLogoUpload"
                    />
                  </label>
                  <p
                    v-if="fileUploads.get('logo')?.status === 'error'"
                    class="text-[11px] text-error"
                  >
                    {{ fileUploads.get('logo')?.error }}
                  </p>
                  <p v-else class="text-[11px] leading-relaxed text-muted">
                    PNG or SVG, max 5MB.<br>Transparent background recommended.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </UCard>
      </div>
    </UForm>

    <!-- ── Empty / error state ──────────────────────────────────── -->
    <div v-else class="flex flex-col items-center justify-center gap-3 py-20 text-muted">
      <UIcon name="i-heroicons-exclamation-triangle" class="size-10 text-warning" />
      <p class="text-sm">Unable to load property settings.</p>
      <UButton color="primary" variant="subtle" size="sm" @click="fetchSettings()">
        Retry
      </UButton>
    </div>

    <!-- ── Floating save button (mobile) ───────────────────────── -->
    <div
      v-if="isDirty"
      class="fixed bottom-24 right-6 z-30 md:hidden"
    >
      <UButton
        color="primary"
        icon="i-heroicons-check"
        size="xl"
        :loading="store.saving"
        class="rounded-full shadow-2xl shadow-primary/30"
        @click="handleSubmit"
      >
        Save
      </UButton>
    </div>
  </div>
</template>
