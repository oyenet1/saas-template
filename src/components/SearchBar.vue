<script setup lang="ts">
const search = ref('')
const type = ref('')
const status = ref('')

const typeOptions = [
  { label: 'All Types', value: '' },
  { label: 'Villa', value: 'villa' },
  { label: 'House', value: 'house' },
  { label: 'Apartment', value: 'apartment' },
  { label: 'Penthouse', value: 'penthouse' },
  { label: 'Land', value: 'land' },
]

const statusOptions = [
  { label: 'Buy & Rent', value: '' },
  { label: 'For Sale', value: 'sale' },
  { label: 'For Rent', value: 'rent' },
]

async function onSubmit() {
  const params = new URLSearchParams()
  if (search.value) params.set('search', search.value)
  if (type.value) params.set('type', type.value)
  if (status.value) params.set('status', status.value)
  const qs = params.toString()
  window.location.href = `/properties${qs ? `?${qs}` : ''}`
}
</script>

<template>
  <UForm class="flex flex-col lg:flex-row gap-3" @submit="onSubmit">
    <UFormField class="flex-1" :ui="{ root: 'w-full' }">
      <UInput
        v-model="search"
        name="search"
        placeholder="Search by city, location, or keyword..."
        icon="i-lucide-search"
        size="xl"
        class="w-full"
      />
    </UFormField>
    <UFormField class="lg:max-w-[180px]" :ui="{ root: 'w-full' }">
      <USelect
        v-model="type"
        :items="typeOptions"
        value-key="value"
        size="xl"
        class="w-full"
      />
    </UFormField>
    <UFormField class="lg:max-w-[160px]" :ui="{ root: 'w-full' }">
      <USelect
        v-model="status"
        :items="statusOptions"
        value-key="value"
        size="xl"
        class="w-full"
      />
    </UFormField>
    <UButton
      type="submit"
      color="primary"
      size="xl"
      icon="i-lucide-search"
      label="Search"
      class="shrink-0 justify-center"
    />
  </UForm>
</template>
