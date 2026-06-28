<script setup lang="ts">
interface Props {
  search?: string
  type?: string
  status?: string
  city?: string
  minBedrooms?: number
  cities: string[]
}

const props = withDefaults(defineProps<Props>(), {
  search: '',
  type: '',
  status: '',
  city: '',
  minBedrooms: 0,
})

const typeOptions = [
  { label: 'All Types', value: '' },
  { label: 'Villa', value: 'villa' },
  { label: 'House', value: 'house' },
  { label: 'Apartment', value: 'apartment' },
  { label: 'Penthouse', value: 'penthouse' },
]

const statusOptions = [
  { label: 'All', value: '' },
  { label: 'For Sale', value: 'sale' },
  { label: 'For Rent', value: 'rent' },
]

const cityOptions = computed(() => [
  { label: 'All Cities', value: '' },
  ...props.cities.map((c) => ({ label: c, value: c })),
])

const bedroomOptions = [
  { label: 'Any', value: '' },
  { label: '3+', value: '3' },
  { label: '4+', value: '4' },
  { label: '5+', value: '5' },
  { label: '6+', value: '6' },
]

const form = reactive({
  search: props.search,
  type: props.type,
  status: props.status,
  city: props.city,
  minBedrooms: props.minBedrooms ? String(props.minBedrooms) : '',
})

async function onSubmit() {
  const params = new URLSearchParams()
  if (form.search) params.set('search', form.search)
  if (form.type) params.set('type', form.type)
  if (form.status) params.set('status', form.status)
  if (form.city) params.set('city', form.city)
  if (form.minBedrooms) params.set('minBedrooms', form.minBedrooms)
  const qs = params.toString()
  window.location.href = `/properties${qs ? `?${qs}` : ''}`
}
</script>

<template>
  <form class="space-y-4 surface-card p-6 sticky top-28" @submit.prevent="onSubmit">
    <UFormField label="Search" name="search">
      <UInput
        v-model="form.search"
        name="search"
        size="xl"
        placeholder="City, location, keyword..."
        icon="i-lucide-search"
        class="w-full"
      />
    </UFormField>

    <UFormField label="Property Type" name="type">
      <USelect
        v-model="form.type"
        size="xl"
        :items="typeOptions"
        value-key="value"
        class="w-full"
      />
    </UFormField>

    <UFormField label="Listing Type" name="status">
      <USelect
        v-model="form.status"
        size="xl"
        :items="statusOptions"
        value-key="value"
        class="w-full"
      />
    </UFormField>

    <UFormField label="City" name="city">
      <USelect
        v-model="form.city"
        size="xl"
        :items="cityOptions"
        value-key="value"
        class="w-full"
      />
    </UFormField>

    <UFormField label="Min Bedrooms" name="minBedrooms">
      <USelect
        v-model="form.minBedrooms"
        size="xl"
        :items="bedroomOptions"
        value-key="value"
        class="w-full"
      />
    </UFormField>

    <UButton
      type="submit"
      size="xl"
      color="primary"
      label="Apply Filters"
      icon="i-lucide-sliders-horizontal"
      block
      class="justify-center"
    />

    <UButton
      to="/properties"
      size="xl"
      color="neutral"
      variant="outline"
      label="Clear All"
      icon="i-lucide-x"
      block
      class="justify-center"
    />
  </form>
</template>
