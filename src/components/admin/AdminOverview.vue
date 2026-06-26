<script setup lang="ts">
import { adminRequest } from '../../lib/admin-api'
import { useTenant } from '../../composables/useTenant'

const { bootstrap, activeCompany } = useTenant()
const loading = ref(true)
const stats = ref({
  properties: 0,
  inquiries: 0,
  categories: 0,
  members: 0,
})

onMounted(async () => {
  await bootstrap()
  if (!activeCompany.value) {
    loading.value = false
    return
  }
  const companyId = activeCompany.value.id
  const [propsRes, inqRes, catRes, memRes] = await Promise.all([
    adminRequest<{ properties: unknown[]; meta?: { pagination?: { total?: number } } }>('/api/v1/admin/properties?perPage=1'),
    adminRequest<{ inquiries: unknown[]; meta?: { pagination?: { total?: number } } }>('/api/v1/leads/inquiries?perPage=1'),
    adminRequest<{ categories: unknown[]; meta?: { pagination?: { total?: number } } }>('/api/v1/categories?perPage=1'),
    adminRequest<{ members: unknown[]; meta?: { pagination?: { total?: number } } }>(`/companies/${companyId}/members?perPage=1`),
  ])
  stats.value = {
    properties: propsRes.data?.meta?.pagination?.total ?? propsRes.data?.properties?.length ?? 0,
    inquiries: inqRes.data?.meta?.pagination?.total ?? inqRes.data?.inquiries?.length ?? 0,
    categories: catRes.data?.meta?.pagination?.total ?? catRes.data?.categories?.length ?? 0,
    members: memRes.data?.meta?.pagination?.total ?? memRes.data?.members?.length ?? 0,
  }
  loading.value = false
})

const cards = computed(() => [
  { label: 'Properties', value: stats.value.properties, href: '/admin/properties', icon: 'i-lucide-building-2' },
  { label: 'Inquiries', value: stats.value.inquiries, href: '/admin/inquiries', icon: 'i-lucide-mail' },
  { label: 'Categories', value: stats.value.categories, href: '/admin/categories', icon: 'i-lucide-tags' },
  { label: 'Staff', value: stats.value.members, href: '/admin/members', icon: 'i-lucide-users' },
])
</script>

<template>
  <div>
    <div v-if="loading" class="flex justify-center py-16">
      <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-primary" />
    </div>
    <template v-else>
      <p v-if="activeCompany" class="text-sm text-muted mb-6">
        Managing <span class="font-medium text-default">{{ activeCompany.name }}</span>
      </p>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <a
          v-for="card in cards"
          :key="card.label"
          :href="card.href"
          class="p-5 rounded-xl border border-default bg-elevated hover:border-primary/30 transition-colors"
        >
          <div class="flex items-center gap-3 mb-2">
            <span :class="[card.icon, 'size-5 text-primary']" />
            <p class="text-2xl font-bold">{{ card.value }}</p>
          </div>
          <p class="text-xs text-muted">{{ card.label }}</p>
        </a>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <a href="/admin/properties/new" class="surface-card p-6 hover:border-primary/30 border border-default transition-colors block">
          <h3 class="font-semibold flex items-center gap-2">
            <span class="i-lucide-plus size-4 text-primary" />
            Add property
          </h3>
          <p class="text-sm text-muted mt-1">Create a new listing for your site.</p>
        </a>
        <a href="/admin/content/banners" class="surface-card p-6 hover:border-primary/30 border border-default transition-colors block">
          <h3 class="font-semibold flex items-center gap-2">
            <span class="i-lucide-image size-4 text-primary" />
            Manage banners
          </h3>
          <p class="text-sm text-muted mt-1">Update homepage hero slides.</p>
        </a>
      </div>
    </template>
  </div>
</template>
