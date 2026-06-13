<script setup lang="ts">
import { z } from 'zod'
import { useLocations, type LocationOption } from '~/composables/useLocations'

definePageMeta({ layout: 'auth' })

const { call } = useApi()
const { DEFAULT_COUNTRY_ID, getCountries, getStates, getCitiesByState } = useLocations()
const OTP_COOLDOWN_SECONDS = 60
const REGISTRATION_OTP_STORAGE_PREFIX = 'mrs.otp.registration.'
const DUPLICATE_HOTEL_EMAIL_MESSAGE = 'there is an hotel with this email address kindly login instead.'
const DUPLICATE_EMAIL_FIELD_MESSAGES = [
  'The email has already been taken.',
  'There is a hotel with this email address, kindly login instead.',
]

const schema = z.object({
  hotelName: z.string().min(3, 'Hotel name must be at least 3 characters'),
  hotelAddress: z.string().min(3, 'Hotel address must be at least 3 characters'),
  hotelDescription: z.string().max(500, 'Description is too long').optional().or(z.literal('')),
  hotelZipCode: z.string().optional(),
  countryId: z.number().int().positive('Country is required'),
  stateId: z.number().int().positive('State is required'),
  cityId: z.number().int().positive('City is required'),
  firstname: z.string().min(2, 'Owner first name must be at least 2 characters'),
  lastname: z.string().min(2, 'Owner last name must be at least 2 characters'),
  email: z.string().min(1, 'Email is required').email('Please enter a valid email'),
  phone: z.string().min(7, 'Phone number is too short'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
})
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type Schema = z.infer<typeof schema>

type RegistrationStep = 'hotel' | 'owner'
type SelectOption = Omit<LocationOption, 'id'> & { id: string }

const state = reactive<Schema>({
  hotelName: '',
  hotelAddress: '',
  hotelDescription: '',
  hotelZipCode: '',
  countryId: DEFAULT_COUNTRY_ID,
  stateId: 0,
  cityId: 0,
  firstname: '',
  lastname: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
})

const registrationTabs = ref([
  { label: 'Business Form', value: 'hotel', icon: 'i-lucide-building-2' },
  { label: 'Owner Form', value: 'owner', icon: 'i-lucide-user-round' },
])

const activeTab = ref<RegistrationStep>('hotel')
const fieldErrors = ref<Record<string, string | undefined>>({})
const submitting = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const countrySearch = ref('')
const stateSearch = ref('')
const citySearch = ref('')

const countries = ref<SelectOption[]>([])
const states = ref<SelectOption[]>([])
const cities = ref<SelectOption[]>([])

const loadingCountries = ref(false)
const loadingStates = ref(false)
const loadingCities = ref(false)

// Two-step file upload state for the hotel logo.
// The logo is prepared (validated + signed) when the user picks a
// file, but the actual upload + R2 commit only happens AFTER the
// full registration form passes validation. This way a user with a
// bad email or short password never wastes bandwidth on a logo.
const fileUploads = useFormFileUpload()

async function handleLogoUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    await fileUploads.add('logo', file, { folder: 'hotels/logos' })
  } catch {
    // Validation error already toasted
  } finally {
    input.value = ''
  }
}

let countrySearchTimer: ReturnType<typeof setTimeout> | null = null
let stateSearchTimer: ReturnType<typeof setTimeout> | null = null
let citySearchTimer: ReturnType<typeof setTimeout> | null = null

const selectedCountryId = computed<string | undefined>({
  get: () => (state.countryId ? String(state.countryId) : undefined),
  set: (value) => {
    state.countryId = value ? Number(value) : DEFAULT_COUNTRY_ID
  },
})

const selectedStateId = computed<string | undefined>({
  get: () => (state.stateId ? String(state.stateId) : undefined),
  set: (value) => {
    state.stateId = value ? Number(value) : 0
  },
})

const selectedCityId = computed<string | undefined>({
  get: () => (state.cityId ? String(state.cityId) : undefined),
  set: (value) => {
    state.cityId = value ? Number(value) : 0
  },
})

const canContinueToOwner = computed(() =>
  Boolean(
    state.hotelName.trim()
    && state.hotelAddress.trim()
    && state.countryId
    && state.stateId
    && state.cityId,
  ),
)

const hotelFields: Array<keyof Schema> = [
  'hotelName',
  'hotelAddress',
  'countryId',
  'stateId',
  'cityId',
]

function errorFor(field: keyof Schema): string | undefined {
  return fieldErrors.value[field]
}

function hasDuplicateEmailError(e: any) {
  if (e?.message === DUPLICATE_HOTEL_EMAIL_MESSAGE) return true

  const fieldErrors = e?.fieldErrors ?? e?.data?.errors ?? e?.data?.fieldErrors
  if (!fieldErrors || typeof fieldErrors !== 'object') return false

  return Object.values(fieldErrors).some((value) => {
    if (Array.isArray(value)) return value.some(message => DUPLICATE_EMAIL_FIELD_MESSAGES.includes(String(message)))
    return DUPLICATE_EMAIL_FIELD_MESSAGES.includes(String(value))
  })
}

function storageKey(email: string) {
  return `${REGISTRATION_OTP_STORAGE_PREFIX}${email.toLowerCase()}`
}

function persistOtpState(email: string) {
  if (!import.meta.client) return

  sessionStorage.setItem(storageKey(email), JSON.stringify({
    email: email.toLowerCase(),
    cooldownUntil: Date.now() + OTP_COOLDOWN_SECONDS * 1000,
    verified: false,
  }))
}

function touchHotelStepErrors() {
  if (hotelFields.some(field => fieldErrors.value[field])) {
    activeTab.value = 'hotel'
  }
}

function clearFieldError(field: keyof Schema) {
  if (fieldErrors.value[field]) {
    fieldErrors.value = { ...fieldErrors.value, [field]: undefined }
  }
}

function toSelectOption(option: LocationOption): SelectOption {
  return {
    ...option,
    id: String(option.id),
  }
}

async function loadCountries(search = '') {
  loadingCountries.value = true

  try {
    countries.value = (await getCountries({
      page: 1,
      perPage: 300,
      search,
      sortBy: 'name',
      order: 'asc',
    })).map(toSelectOption)

    if (!countries.value.find(country => country.id === String(state.countryId))) {
      const nigeria = countries.value.find(country => country.id === String(DEFAULT_COUNTRY_ID))
      if (nigeria) {
        state.countryId = Number(nigeria.id)
      }
    }
  } finally {
    loadingCountries.value = false
  }
}

async function loadStates(search = '') {
  if (!state.countryId) {
    states.value = []
    return
  }

  loadingStates.value = true

  try {
    states.value = (await getStates({
      page: 1,
      perPage: 80,
      search,
      countryId: state.countryId,
      sortBy: 'name',
      order: 'asc',
    })).map(toSelectOption)
  } finally {
    loadingStates.value = false
  }
}

async function loadCities(search = '') {
  if (!state.stateId) {
    cities.value = []
    return
  }

  loadingCities.value = true

  try {
    cities.value = (await getCitiesByState({
      page: 1,
      perPage: 120,
      search,
      countryId: state.countryId,
      stateId: state.stateId,
    })).map(toSelectOption)
  } finally {
    loadingCities.value = false
  }
}

function scheduleCountrySearch(value: string) {
  if (countrySearchTimer) clearTimeout(countrySearchTimer)
  countrySearchTimer = setTimeout(() => loadCountries(value), 250)
}

function scheduleStateSearch(value: string) {
  if (stateSearchTimer) clearTimeout(stateSearchTimer)
  stateSearchTimer = setTimeout(() => loadStates(value), 250)
}

function scheduleCitySearch(value: string) {
  if (citySearchTimer) clearTimeout(citySearchTimer)
  citySearchTimer = setTimeout(() => loadCities(value), 250)
}

function goToOwnerStep() {
  touchHotelStepErrors()

  if (!canContinueToOwner.value) {
    fieldErrors.value = {
      ...fieldErrors.value,
      hotelName: errorFor('hotelName'),
      hotelAddress: errorFor('hotelAddress'),
      countryId: errorFor('countryId'),
      stateId: errorFor('stateId'),
      cityId: errorFor('cityId'),
    }
    return
  }

  activeTab.value = 'owner'
}

async function onSubmit() {
  fieldErrors.value = {}
  submitting.value = true

  try {
    const email = state.email.trim().toLowerCase()

    // ✅ Form validation passed — now safe to upload the logo.
    // If the form had errors, we'd have returned above and the logo
    // would never be uploaded, saving bandwidth on rejected submissions.
    let urls: { logo?: string } = {}
    if (fileUploads.hasFiles) {
      try {
        urls = await fileUploads.commitAll()
      } catch {
        return
      }
    }

    const response = await call(
      '/v1/auth/register',
      {
        method: 'POST',
        body: {
          firstname: state.firstname.trim(),
          lastname: state.lastname.trim(),
          email,
          password: state.password,
          phone: state.phone.trim(),
          hotelName: state.hotelName.trim(),
          hotelAddress: state.hotelAddress.trim(),
          hotelDescription: state.hotelDescription?.trim() || undefined,
          hotelZipCode: state.hotelZipCode?.trim() || undefined,
          hotelCountryId: state.countryId || undefined,
          hotelStateId: state.stateId || undefined,
          hotelCityId: state.cityId || undefined,
          hotelEmail: email,
          hotelPhone: state.phone.trim(),
          primaryColor: '#0F766E',
          secondaryColor: '#C89B3C',
          ...(urls.logo ? { hotelLogo: urls.logo } : {}),
        },
      },
      { success: false },
    )

    persistOtpState(email)
    fileUploads.clear()

    const regTitle = 'Registration received'
    const regDesc = response.message
    const toast = useToast()
    toast.add({
      title: regTitle,
      description: regDesc && regDesc !== regTitle ? regDesc : undefined,
      icon: 'i-heroicons-check-circle',
      color: 'success',
    })

    await navigateTo({
      path: '/otp',
      query: {
        identifier: email,
        purpose: 'registration',
        submitted: '1',
        message: regDesc ?? 'Registration successful. OTP sent to your email.',
      },
    })
  } catch (e: any) {
    if (hasDuplicateEmailError(e)) {
      await navigateTo({ path: '/sign-in', query: { email: state.email } })
      return
    }

    if (e?.fieldErrors && Object.keys(e.fieldErrors).length > 0) {
      const raw = e.fieldErrors as Record<string, string>
      const normalized: Record<string, string | undefined> = {}
      for (const [key, msg] of Object.entries(raw)) {
        const mapped = (
          { hotelCityId: 'cityId', hotelStateId: 'stateId', hotelCountryId: 'countryId' } as Record<string, string>
        )[key] ?? key
        normalized[mapped] = msg
      }
      fieldErrors.value = normalized
      touchHotelStepErrors()
    }
  } finally {
    submitting.value = false
  }
}

watch(() => state.countryId, async () => {
  clearFieldError('countryId')
  stateSearch.value = ''
  citySearch.value = ''
  await loadStates()
})

watch(() => state.stateId, async () => {
  clearFieldError('stateId')
  citySearch.value = ''
  await loadCities()
})

watch(() => state.cityId, () => clearFieldError('cityId'))
watch(() => state.hotelName, () => clearFieldError('hotelName'))
watch(() => state.hotelAddress, () => clearFieldError('hotelAddress'))
watch(() => state.firstname, () => clearFieldError('firstname'))
watch(() => state.lastname, () => clearFieldError('lastname'))
watch(() => state.email, () => clearFieldError('email'))
watch(() => state.phone, () => clearFieldError('phone'))
watch(() => state.password, () => clearFieldError('password'))
watch(() => state.confirmPassword, () => clearFieldError('confirmPassword'))

watch(countrySearch, scheduleCountrySearch)
watch(stateSearch, scheduleStateSearch)
watch(citySearch, scheduleCitySearch)
watch(() => state.countryId, (nextCountryId, previousCountryId) => {
  if (nextCountryId === previousCountryId) return
  state.stateId = 0
  state.cityId = 0
  states.value = []
  cities.value = []
})
watch(() => state.stateId, (nextStateId, previousStateId) => {
  if (nextStateId === previousStateId) return
  state.cityId = 0
  cities.value = []
})

onMounted(async () => {
  await loadCountries()
  await loadStates()
})

onBeforeUnmount(() => {
  if (countrySearchTimer) clearTimeout(countrySearchTimer)
  if (stateSearchTimer) clearTimeout(stateSearchTimer)
  if (citySearchTimer) clearTimeout(citySearchTimer)
})
</script>

<template>
  <div>
    <div class="mb-8">
      <div>
        <p class="text-sm font-semibold uppercase tracking-[0.24em] text-primary/80">Registration</p>
        <h1 class="mt-2 text-3xl font-semibold tracking-tight text-highlighted">Create your account</h1>
      </div>
    </div>

    <UForm
      :schema="schema"
      :state="state"
      class="mt-8 space-y-6"
      @submit="onSubmit"
    >
      <UTabs
        v-model="activeTab"
        :items="registrationTabs"
        color="primary"
        variant="pill"
        :content="false"
        :ui="{
          root: 'w-full',
          list: 'grid w-full grid-cols-2 rounded-xl border border-default bg-elevated/30 p-1',
          indicator: 'rounded-lg bg-primary shadow-none',
          trigger: 'min-h-9 rounded-lg px-3 py-1.5 text-sm font-semibold text-muted'
        }"
      />

      <div v-if="activeTab === 'hotel'" class="space-y-6">
        <UFormField
          name="hotelName"
          :error="errorFor('hotelName')"
          :ui="{ root: 'w-full', container: 'mt-1' }"
        >
          <UInput
            v-model="state.hotelName"
            size="xl"
            icon="i-lucide-building-2"
            placeholder=""
            autocomplete="organization"
            :ui="{ root: 'w-full', base: 'peer' }"
          >
            <label class="pointer-events-none absolute left-8 top-1/2 -translate-y-1/2 px-1.5 text-sm font-normal text-dimmed transition-all peer-focus:-top-2.5 peer-focus:translate-y-0 peer-focus:text-sm peer-focus:font-medium peer-focus:text-highlighted peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-placeholder-shown:text-dimmed peer-[&:not(:placeholder-shown)]:-top-2.5 peer-[&:not(:placeholder-shown)]:translate-y-0 peer-[&:not(:placeholder-shown)]:text-sm peer-[&:not(:placeholder-shown)]:font-medium peer-[&:not(:placeholder-shown)]:text-highlighted">
              <span class="inline-flex bg-default px-1">Hotel name</span>
            </label>
          </UInput>
        </UFormField>

        <UFormField
          name="hotelAddress"
          :error="errorFor('hotelAddress')"
          :ui="{ root: 'w-full', container: 'mt-1' }"
        >
          <UTextarea
            v-model="state.hotelAddress"
            :rows="3"
            icon="i-lucide-map-pinned"
            placeholder="14 Marina Road, Victoria Island, Lagos"
            :ui="{ root: 'w-full', base: 'w-full' }"
          />
        </UFormField>

        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField
            name="countryId"
            :error="errorFor('countryId')"
            :ui="{ root: 'w-full', container: 'mt-1' }"
          >
            <USelectMenu
              v-model="selectedCountryId"
              v-model:search-term="countrySearch"
              :items="countries"
              icon="i-lucide-globe"
              value-key="id"
              label-key="label"
              size="xl"
              searchable
              :search-input="{ placeholder: 'Search countries' }"
              :loading="loadingCountries"
              placeholder="Select country"
              :filter-fields="['label', 'description']"
              :ui="{ root: 'w-full', base: 'w-full' }"
            />
          </UFormField>

          <UFormField
            name="stateId"
            :error="errorFor('stateId')"
            :ui="{ root: 'w-full', container: 'mt-1' }"
          >
            <USelectMenu
              v-model="selectedStateId"
              v-model:search-term="stateSearch"
              :items="states"
              icon="i-lucide-map"
              value-key="id"
              label-key="label"
              size="xl"
              searchable
              :search-input="{ placeholder: state.countryId ? 'Search states' : 'Select country first' }"
              :loading="loadingStates"
              :disabled="!state.countryId"
              placeholder="Select state"
              :ui="{ root: 'w-full', base: 'w-full' }"
            />
          </UFormField>
        </div>

        <UFormField
          name="cityId"
          :error="errorFor('cityId')"
          :ui="{ root: 'w-full', container: 'mt-1' }"
        >
          <USelectMenu
            v-model="selectedCityId"
            v-model:search-term="citySearch"
            :items="cities"
            icon="i-lucide-building"
            value-key="id"
            label-key="label"
            size="xl"
            searchable
            :search-input="{ placeholder: state.stateId ? 'Search cities' : 'Select state first' }"
            :loading="loadingCities"
            :disabled="!state.stateId"
            placeholder="Select city"
            :ui="{ root: 'w-full', base: 'w-full' }"
          />
        </UFormField>

        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-center gap-3">
            <label
              for="hotel-logo"
              :class="[
                'group relative inline-flex h-20 w-20 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition',
                fileUploads.get('logo')?.status === 'error'
                  ? 'border-error bg-error/10 text-error'
                  : 'border-default bg-elevated/40 text-muted hover:border-primary hover:bg-primary/10 hover:text-primary',
              ]"
              aria-label="Upload hotel logo"
            >
              <img
                v-if="fileUploads.get('logo')?.publicUrl"
                :src="fileUploads.get('logo')!.publicUrl"
                alt="Hotel logo preview"
                class="size-full object-contain"
              />
              <UIcon
                v-else-if="fileUploads.get('logo')?.status === 'uploading'"
                name="i-heroicons-arrow-path"
                class="size-9 animate-spin"
              />
              <UIcon
                v-else
                name="i-lucide-image-plus"
                class="size-9"
              />
            </label>
            <div class="flex flex-col gap-1">
              <span class="text-xs font-medium text-muted">
                {{ fileUploads.get('logo')?.status === 'uploaded'
                  ? 'Logo ready — will upload on submit'
                  : fileUploads.get('logo')?.status === 'uploading'
                    ? 'Uploading logo…'
                    : 'Hotel logo (optional)' }}
              </span>
              <span
                v-if="fileUploads.get('logo')?.status === 'error'"
                class="text-[11px] text-error"
              >
                {{ fileUploads.get('logo')?.error }}
              </span>
              <span v-else class="text-[11px] text-muted">PNG, JPG or SVG, max 5MB.</span>
            </div>
            <input
              id="hotel-logo"
              type="file"
              accept=".png,.jpg,.jpeg,.svg"
              class="sr-only"
              :disabled="fileUploads.uploading.value"
              @change="handleLogoUpload"
            >
          </div>

          <UButton
            type="button"
            size="lg"
            color="primary"
            class="px-5 w-full sm:w-auto"
            :disabled="!canContinueToOwner"
            @click="goToOwnerStep"
          >
            Continue
          </UButton>
        </div>
      </div>

      <div v-else class="space-y-6">
        <div>
          <h2 class="text-lg font-semibold text-highlighted">Owner form</h2>
          <p class="mt-1 text-sm text-muted">Set the owner login details for this hotel.</p>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField
            name="firstname"
            :error="errorFor('firstname')"
            :ui="{ root: 'w-full', container: 'mt-1' }"
          >
            <UInput
              v-model="state.firstname"
              size="xl"
              icon="i-lucide-user-round"
              placeholder="Amina"
              autocomplete="given-name"
              :ui="{ root: 'w-full', base: 'w-full' }"
            />
          </UFormField>

          <UFormField
            name="lastname"
            :error="errorFor('lastname')"
            :ui="{ root: 'w-full', container: 'mt-1' }"
          >
            <UInput
              v-model="state.lastname"
              size="xl"
              icon="i-lucide-user-round"
              placeholder="Bello"
              autocomplete="family-name"
              :ui="{ root: 'w-full', base: 'w-full' }"
            />
          </UFormField>
        </div>

        <UFormField
          name="email"
          :error="errorFor('email')"
          :ui="{ root: 'w-full', container: 'mt-1' }"
        >
          <UInput
            v-model="state.email"
            type="email"
            size="xl"
            icon="i-lucide-mail"
            placeholder="owner@hotel.com"
            autocomplete="email"
            :ui="{ root: 'w-full', base: 'w-full' }"
          />
        </UFormField>

        <UFormField
          name="phone"
          :error="errorFor('phone')"
          :ui="{ root: 'w-full', container: 'mt-1' }"
        >
          <UInput
            v-model="state.phone"
            type="tel"
            size="xl"
            icon="i-lucide-phone"
            placeholder="+234 800 000 0000"
            autocomplete="tel"
            :ui="{ root: 'w-full', base: 'w-full' }"
          />
        </UFormField>

        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField
            name="password"
            :error="errorFor('password')"
            :ui="{ root: 'w-full', container: 'mt-1' }"
          >
            <UInput
              v-model="state.password"
              :type="showPassword ? 'text' : 'password'"
              size="xl"
              icon="i-lucide-lock-keyhole"
              placeholder="At least 6 characters"
              autocomplete="new-password"
              :ui="{ root: 'w-full', base: 'w-full' }"
            >
              <template #trailing>
                <UButton
                  type="button"
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  :icon="showPassword ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
                  :aria-label="showPassword ? 'Hide password' : 'Show password'"
                  :aria-pressed="showPassword"
                  @click="showPassword = !showPassword"
                />
              </template>
            </UInput>
          </UFormField>

          <UFormField
            name="confirmPassword"
            :error="errorFor('confirmPassword')"
            :ui="{ root: 'w-full', container: 'mt-1' }"
          >
            <UInput
              v-model="state.confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              size="xl"
              icon="i-lucide-shield-check"
              placeholder="Repeat password"
              autocomplete="new-password"
              :ui="{ root: 'w-full', base: 'w-full' }"
            >
              <template #trailing>
                <UButton
                  type="button"
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  :icon="showConfirmPassword ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
                  :aria-label="showConfirmPassword ? 'Hide password' : 'Show password'"
                  :aria-pressed="showConfirmPassword"
                  @click="showConfirmPassword = !showConfirmPassword"
                />
              </template>
            </UInput>
          </UFormField>
        </div>

        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <UButton
            type="button"
            color="neutral"
            variant="soft"
            size="lg"
            icon="i-lucide-arrow-left"
            @click="activeTab = 'hotel'"
          >
            Back to business form
          </UButton>

          <UButton
            type="submit"
            color="primary"
            size="xl"
            :loading="submitting"
            :disabled="submitting"
            class="px-6 font-semibold"
          >
            Create account
          </UButton>
        </div>
      </div>
    </UForm>

    <p class="mt-6 text-center text-sm text-muted">
      Already have an account?
      <ULink to="/sign-in" class="font-semibold text-primary hover:underline">
        Sign in
      </ULink>
    </p>

    <!-- ─── What you get ─────────────────────────────────────── -->
    <section class="mt-10 border-t border-default/60 pt-8">
      <div class="mb-5 text-center">
        <p class="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">What you get</p>
        <h2 class="mt-1 text-xl font-semibold text-highlighted">
          Everything you need to run a modern hotel — on day one.
        </h2>
        <p class="mt-1.5 text-sm text-muted">
          No add-ons, no upsells. Every account ships with the full platform.
        </p>
      </div>

      <div class="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        <!-- Smart TV realtime -->
        <div class="relative flex items-start gap-2.5 rounded-lg border border-emerald-200/60 bg-gradient-to-br from-white to-emerald-50/40 p-3">
          <div class="grid size-8 shrink-0 place-items-center rounded-md bg-emerald-600 text-sm text-white">📺</div>
          <div class="min-w-0">
            <div class="flex items-center gap-1.5">
              <p class="text-xs font-semibold text-highlighted">Smart TV Alerts</p>
              <span class="rounded-full bg-emerald-100 px-1.5 py-px text-[8px] font-bold uppercase tracking-wider text-emerald-700">Live</span>
            </div>
            <p class="mt-0.5 text-[11px] leading-snug text-muted">Bookings, orders, reminders — pushed to the room TV in real time.</p>
          </div>
        </div>

        <!-- QR-code orders -->
        <div class="relative flex items-start gap-2.5 rounded-lg border border-blue-200/60 bg-gradient-to-br from-white to-blue-50/40 p-3">
          <div class="grid size-8 shrink-0 place-items-center rounded-md bg-blue-700 text-sm text-white">🔳</div>
          <div class="min-w-0">
            <div class="flex items-center gap-1.5">
              <p class="text-xs font-semibold text-highlighted">QR Orders</p>
              <span class="rounded-full bg-blue-100 px-1.5 py-px text-[8px] font-bold uppercase tracking-wider text-blue-700">New</span>
            </div>
            <p class="mt-0.5 text-[11px] leading-snug text-muted">Guests scan a code in their room to order or request service.</p>
          </div>
        </div>

        <!-- Bookings -->
        <div class="flex items-start gap-2.5 rounded-lg border border-default/60 bg-elevated/30 p-3">
          <div class="grid size-8 shrink-0 place-items-center rounded-md bg-emerald-50 text-sm text-emerald-700">📅</div>
          <div class="min-w-0">
            <p class="text-xs font-semibold text-highlighted">Bookings</p>
            <p class="mt-0.5 text-[11px] leading-snug text-muted">Reservations, walk-ins, check-in/out, folios.</p>
          </div>
        </div>

        <!-- Property -->
        <div class="flex items-start gap-2.5 rounded-lg border border-default/60 bg-elevated/30 p-3">
          <div class="grid size-8 shrink-0 place-items-center rounded-md bg-blue-50 text-sm text-blue-700">🏨</div>
          <div class="min-w-0">
            <p class="text-xs font-semibold text-highlighted">Property</p>
            <p class="mt-0.5 text-[11px] leading-snug text-muted">Rooms, rates, channel manager, smart-TV setup.</p>
          </div>
        </div>

        <!-- Guests -->
        <div class="flex items-start gap-2.5 rounded-lg border border-default/60 bg-elevated/30 p-3">
          <div class="grid size-8 shrink-0 place-items-center rounded-md bg-amber-50 text-sm text-amber-700">👥</div>
          <div class="min-w-0">
            <p class="text-xs font-semibold text-highlighted">Guest CRM</p>
            <p class="mt-0.5 text-[11px] leading-snug text-muted">Profiles, favourites, ratings, visitor logs.</p>
          </div>
        </div>

        <!-- Finance -->
        <div class="flex items-start gap-2.5 rounded-lg border border-default/60 bg-elevated/30 p-3">
          <div class="grid size-8 shrink-0 place-items-center rounded-md bg-pink-50 text-sm text-pink-700">💳</div>
          <div class="min-w-0">
            <p class="text-xs font-semibold text-highlighted">Finance</p>
            <p class="mt-0.5 text-[11px] leading-snug text-muted">Multi-gateway payments, POS, payouts, refunds.</p>
          </div>
        </div>

        <!-- Operations -->
        <div class="flex items-start gap-2.5 rounded-lg border border-default/60 bg-elevated/30 p-3">
          <div class="grid size-8 shrink-0 place-items-center rounded-md bg-violet-50 text-sm text-violet-700">🛠</div>
          <div class="min-w-0">
            <p class="text-xs font-semibold text-highlighted">Operations</p>
            <p class="mt-0.5 text-[11px] leading-snug text-muted">Housekeeping, maintenance, suppliers.</p>
          </div>
        </div>

        <!-- Team -->
        <div class="flex items-start gap-2.5 rounded-lg border border-default/60 bg-elevated/30 p-3">
          <div class="grid size-8 shrink-0 place-items-center rounded-md bg-rose-50 text-sm text-rose-700">👨‍💼</div>
          <div class="min-w-0">
            <p class="text-xs font-semibold text-highlighted">Team</p>
            <p class="mt-0.5 text-[11px] leading-snug text-muted">Staff, role-based permissions, activity logs.</p>
          </div>
        </div>

        <!-- Insights -->
        <div class="flex items-start gap-2.5 rounded-lg border border-default/60 bg-elevated/30 p-3">
          <div class="grid size-8 shrink-0 place-items-center rounded-md bg-cyan-50 text-sm text-cyan-700">📊</div>
          <div class="min-w-0">
            <p class="text-xs font-semibold text-highlighted">Insights</p>
            <p class="mt-0.5 text-[11px] leading-snug text-muted">Revenue trends, analytics, one-click exports.</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
