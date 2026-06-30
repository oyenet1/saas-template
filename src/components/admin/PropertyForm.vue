<script setup lang="ts">
import { adminRequest, mapFieldErrors } from '../../lib/admin-api'
import { useTenant } from '../../composables/useTenant'
import { useGeo } from '../../composables/useGeo'
import PropertyMediaManager from './PropertyMediaManager.vue'

const props = defineProps<{ propertyId?: number }>()

const { bootstrap } = useTenant()
const { countries, states, cities, fetchCountries, fetchStatesByCountry, fetchCitiesByState } = useGeo()

const categories = ref<{ id: number; name: string }[]>([])
const features = ref<{ id: number; name: string }[]>([])

const loading = ref(false)
const fieldErrors = reactive<Record<string, string>>({})
const toast = useToast()

const form = reactive({
  title: '',
  slug: '',
  description: '',
  purpose: 'sale',
  status: 'draft',
  propertyType: 'apartment',
  price: 0,
  currency: 'NGN',
  bedrooms: 0,
  bathrooms: 0,
  area: undefined as number | undefined,
  address: '',
  countryId: undefined as number | undefined,
  stateId: undefined as number | undefined,
  cityId: undefined as number | undefined,
  categoryIds: [] as number[],
  featureIds: [] as number[],
})

const purposeOptions = [
  { label: 'For sale', value: 'sale' },
  { label: 'For rent', value: 'rent' },
  { label: 'Short let', value: 'short-let' },
  { label: 'Lease', value: 'lease' },
]
const statusOptions = [
  { label: 'Draft', value: 'draft' },
  { label: 'Published', value: 'published' },
  { label: 'Pending', value: 'pending' },
  { label: 'Archived', value: 'archived' },
]
const typeOptions = [
  { label: 'Apartment', value: 'apartment' },
  { label: 'House', value: 'house' },
  { label: 'Land', value: 'land' },
  { label: 'Office', value: 'office' },
  { label: 'Shop', value: 'shop' },
  { label: 'Warehouse', value: 'warehouse' },
  { label: 'Commercial', value: 'commercial' },
]

function applyErrors(errors: unknown) {
  Object.keys(fieldErrors).forEach((k) => delete fieldErrors[k])
  Object.assign(fieldErrors, mapFieldErrors(errors))
}

watch(() => form.countryId, async (id) => {
  form.stateId = undefined
  form.cityId = undefined
  if (id) await fetchStatesByCountry(id)
})

watch(() => form.stateId, async (id) => {
  form.cityId = undefined
  if (id) await fetchCitiesByState(id)
})

onMounted(async () => {
  await bootstrap()
  await fetchCountries()
  const [catRes, featRes] = await Promise.all([
    adminRequest<{ categories: { id: number; name: string }[] }>('/api/v1/categories?perPage=100'),
    adminRequest<{ features: { id: number; name: string }[] }>('/api/v1/features?perPage=100'),
  ])
  categories.value = catRes.data?.categories ?? []
  features.value = featRes.data?.features ?? []
  const nigeria = countries.value.find((c) => c.iso2 === 'NG')
  if (nigeria && !form.countryId) form.countryId = nigeria.id

  if (props.propertyId) {
    loading.value = true
    const res = await adminRequest<{ property: Record<string, unknown> }>(`/api/v1/admin/properties/${props.propertyId}`)
    loading.value = false
    if (res.success && res.data?.property) {
      const p = res.data.property
      Object.assign(form, {
        title: p.title ?? '',
        slug: p.slug ?? '',
        description: p.description ?? '',
        purpose: p.purpose ?? 'sale',
        status: p.status ?? 'draft',
        propertyType: p.propertyType ?? 'apartment',
        price: Number(p.price) || 0,
        currency: p.currency ?? 'NGN',
        bedrooms: p.bedrooms ?? 0,
        bathrooms: p.bathrooms ?? 0,
        area: p.area ? Number(p.area) : undefined,
        address: p.address ?? '',
        countryId: p.countryId ?? undefined,
        stateId: p.stateId ?? undefined,
        cityId: p.cityId ?? undefined,
        categoryIds: (p.categories as { id: number }[] | undefined)?.map((c) => c.id) ?? [],
        featureIds: (p.features as { id: number }[] | undefined)?.map((f) => f.id) ?? [],
      })
      if (form.countryId) await fetchStatesByCountry(form.countryId)
      if (form.stateId) await fetchCitiesByState(form.stateId)
    }
  }
})

async function onSubmit() {
  loading.value = true
  applyErrors(undefined)
  const body = props.propertyId
    ? {
        ...form,
        syncCategories: form.categoryIds,
        syncFeatures: form.featureIds,
      }
    : { ...form }
  const path = props.propertyId ? `/api/v1/admin/properties/${props.propertyId}` : '/api/v1/admin/properties'
  const method = props.propertyId ? 'PATCH' : 'POST'
  const res = await adminRequest<{ property?: { id?: number } }>(path, { method, body })
  loading.value = false
  if (!res.success) {
    applyErrors(res.errors)
    toast.add({ title: 'Save failed', description: res.message, color: 'error' })
    return
  }
  toast.add({ title: props.propertyId ? 'Property updated' : 'Property created', color: 'success', icon: 'i-lucide-check-circle-2' })
  if (props.propertyId) return
  const createdId = res.data?.property?.id
  window.location.assign(createdId ? `/admin/properties/${createdId}` : '/admin/properties')
}
</script>

<template>
  <div class="surface-card p-6 max-w-3xl">
    <UForm :state="form" class="space-y-5" @submit="onSubmit">
      <UFormField label="Title" name="title" :error="fieldErrors.title" required>
        <UInput v-model="form.title" size="xl" class="w-full" />
      </UFormField>
      <UFormField label="Slug" name="slug" :error="fieldErrors.slug" hint="Auto-generated if empty">
        <UInput v-model="form.slug" size="xl" class="w-full" />
      </UFormField>
      <UFormField label="Description" name="description" :error="fieldErrors.description">
        <UTextarea v-model="form.description" size="xl" :rows="4" class="w-full" />
      </UFormField>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <UFormField label="Purpose" name="purpose">
          <USelect v-model="form.purpose" size="xl" :items="purposeOptions" class="w-full" />
        </UFormField>
        <UFormField label="Status" name="status">
          <USelect v-model="form.status" size="xl" :items="statusOptions" class="w-full" />
        </UFormField>
        <UFormField label="Type" name="propertyType">
          <USelect v-model="form.propertyType" size="xl" :items="typeOptions" class="w-full" />
        </UFormField>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <UFormField label="Price" name="price" :error="fieldErrors.price">
          <UInput v-model.number="form.price" size="xl" type="number" min="0" class="w-full" />
        </UFormField>
        <UFormField label="Currency" name="currency">
          <UInput v-model="form.currency" size="xl" maxlength="3" class="w-full" />
        </UFormField>
        <UFormField label="Area (sqm)" name="area">
          <UInput v-model.number="form.area" size="xl" type="number" min="0" class="w-full" />
        </UFormField>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <UFormField label="Bedrooms" name="bedrooms">
          <UInput v-model.number="form.bedrooms" size="xl" type="number" min="0" class="w-full" />
        </UFormField>
        <UFormField label="Bathrooms" name="bathrooms">
          <UInput v-model.number="form.bathrooms" size="xl" type="number" min="0" class="w-full" />
        </UFormField>
      </div>
      <UFormField label="Address" name="address">
        <UInput v-model="form.address" size="xl" class="w-full" />
      </UFormField>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <UFormField label="Country" name="countryId">
          <USelect
            v-model="form.countryId"
            size="xl"
            :items="countries.map((c) => ({ label: c.name, value: c.id }))"
            placeholder="Select country"
            class="w-full"
          />
        </UFormField>
        <UFormField label="State" name="stateId">
          <USelect
            v-model="form.stateId"
            size="xl"
            :items="states.map((s) => ({ label: s.name, value: s.id }))"
            placeholder="Select state"
            class="w-full"
          />
        </UFormField>
        <UFormField label="City" name="cityId">
          <USelect
            v-model="form.cityId"
            size="xl"
            :items="cities.map((c) => ({ label: c.name, value: c.id }))"
            placeholder="Select city"
            class="w-full"
          />
        </UFormField>
      </div>
      <UFormField label="Categories" name="categoryIds">
        <USelectMenu
          v-model="form.categoryIds"
          :items="categories.map((c) => ({ label: c.name, value: c.id }))"
          multiple
          placeholder="Select categories"
          class="w-full"
        />
      </UFormField>
      <UFormField label="Features" name="featureIds">
        <USelectMenu
          v-model="form.featureIds"
          :items="features.map((f) => ({ label: f.name, value: f.id }))"
          multiple
          placeholder="Select features"
          class="w-full"
        />
      </UFormField>
      <div class="flex gap-3 pt-2">
        <UButton type="submit" size="xl" color="primary" :label="propertyId ? 'Update property' : 'Create property'" icon="i-lucide-save" :loading="loading" />
        <UButton to="/admin/properties" size="xl" color="neutral" variant="outline" label="Cancel" />
      </div>
      <PropertyMediaManager v-if="propertyId" :property-id="propertyId" />
    </UForm>
  </div>
</template>
